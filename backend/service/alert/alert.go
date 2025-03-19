package alert

import (
	"ccops/global"
	"ccops/models/alert"
	"ccops/models/monitor"
	"errors"
	"fmt"
	"log"
	"sync"
	"time"

	"gorm.io/gorm"
)

type AlertService struct {
	// 用于记录每个规则的触发次数
	triggerCount     map[string]int64
	triggerStartTime map[string]time.Time
	mutex            sync.RWMutex
}

var defaultAlertService *AlertService

func init() {
	defaultAlertService = &AlertService{
		triggerCount:     make(map[string]int64),
		triggerStartTime: make(map[string]time.Time),
		mutex:            sync.RWMutex{},
	}
}

// GetAlertService 获取告警服务实例
func GetAlertService() *AlertService {
	return defaultAlertService
}

// checkCycle 检查是否在循环周期内
func (s *AlertService) checkCycle(r *alert.Rule) bool {
	if r.CycleInterval == 0 {
		return true
	}

	if r.CycleStart == nil {
		return true
	}

	// 计算距离循环开始时间的分钟数
	minutes := time.Since(*r.CycleStart).Minutes()

	// 检查是否在循环周期内
	return int(minutes)%r.CycleInterval == 0
}

// CheckMetrics 检查监控指标是否触发告警
func (s *AlertService) CheckMetrics(metrics *monitor.MetricPoint) error {
	log.Printf("开始检查告警，收到的指标数据：CPU使用率=%.2f%%, 内存使用率=%.2f%%, Swap使用率=%.2f%%, 磁盘数量=%d, 网卡数量=%d, 主机ID=%d",
		metrics.CPUUsage, metrics.Memory.UsedPercent, metrics.Memory.SwapPercent,
		len(metrics.DiskUsages), len(metrics.NetworkStatus), metrics.HostID)

	// 开启GORM调试模式
	tx := global.DB.Debug()

	// 获取所有启用的告警规则
	var rules []alert.AlertRule
	if err := tx.Where("enable = ?", true).Find(&rules).Error; err != nil {
		return fmt.Errorf("获取告警规则失败: %v", err)
	}
	log.Printf("找到%d条启用的告警规则", len(rules))

	// 获取主机所属的标签ID列表
	var hostLabels []uint64
	if err := tx.Table("host_labels").
		Where("host_model_id = ?", metrics.HostID).
		Pluck("label_model_id", &hostLabels).Error; err != nil {
		log.Printf("获取主机标签失败: %v", err)
	}

	// 检查每个规则
	for _, rule := range rules {
		// 获取规则适用的所有主机ID
		applicableHostIDs := make(map[uint64]struct{})

		// 如果规则指定了主机ID，添加到适用列表
		for _, id := range rule.HostIDs {
			applicableHostIDs[id] = struct{}{}
		}

		// 如果规则指定了标签ID，获取相关的主机ID
		if len(rule.LabelIDs) > 0 {
			var labelHostIDs []uint64
			if err := tx.Table("host_labels").
				Where("label_model_id IN ?", rule.LabelIDs).
				Pluck("host_model_id", &labelHostIDs).Error; err != nil {
				log.Printf("获取标签关联的主机ID失败: %v", err)
				continue
			}
			// 添加到适用列表
			for _, id := range labelHostIDs {
				applicableHostIDs[id] = struct{}{}
			}
		}

		// 判断规则是否适用于当前主机
		isApplicable := false

		// 如果规则没有指定任何白名单限制，适用于所有主机
		if len(rule.HostIDs) == 0 && len(rule.LabelIDs) == 0 {
			isApplicable = true
		} else {
			// 否则检查当前主机是否在适用列表中
			_, isApplicable = applicableHostIDs[metrics.HostID]
		}

		// 如果在黑名单中，则不适用
		if contains(rule.IgnoreHostIDs, metrics.HostID) {
			isApplicable = false
			log.Printf("主机ID %d 在规则黑名单中，跳过检查", metrics.HostID)
		}

		if isApplicable {
			log.Printf("检查告警规则: ID=%d, 名称=%s", rule.ID, rule.Name)

			// 检查规则中的每个具体规则
			for _, r := range rule.Rules {
				log.Printf("检查具体规则: 类型=%s, 最小值=%.2f, 最大值=%.2f, 级别=%s",
					r.Type, r.MinValue, r.MaxValue, r.Severity)

				// 检查是否在循环周期内
				if !s.checkCycle(&r) {
					log.Printf("不在循环周期内，跳过检查")
					continue
				}

				// 获取对应的指标值
				value, err := s.getMetricValue(metrics, r.Type)
				if err != nil {
					log.Printf("获取指标值失败: %v", err)
					continue
				}
				log.Printf("获取到的指标值: %.2f", value)

				// 检查是否触发告警
				isTriggered := r.CheckRule(value)
				log.Printf("告警规则检查结果: 当前值=%.2f, 最小值=%.2f, 最大值=%.2f, 是否触发=%v",
					value, r.MinValue, r.MaxValue, isTriggered)

				// 生成规则键
				ruleKey := fmt.Sprintf("%d_%d_%s", rule.ID, metrics.HostID, r.Type)

				if isTriggered {
					// 检查持续时间
					isDurationMet := s.checkDuration(ruleKey, uint64(r.Duration))
					log.Printf("持续时间检查结果: 是否满足=%v", isDurationMet)

					if isDurationMet {
						// 检查是否已存在告警中的记录
						var existingRecord alert.AlertRecord
						err := tx.Where("rule_id = ? AND host_id = ? AND type = ? AND status = ?",
							rule.ID, metrics.HostID, r.Type, alert.AlertStatusAlerting).
							First(&existingRecord).Error

						if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
							log.Printf("查询现有告警记录失败: %v", err)
							return fmt.Errorf("查询现有告警记录失败: %v", err)
						}

						if errors.Is(err, gorm.ErrRecordNotFound) {
							// 不存在告警中的记录，创建新记录
							record := &alert.AlertRecord{
								RuleID: rule.ID,
								HostID: metrics.HostID,

								Status:      alert.AlertStatusAlerting,
								Value:       value,
								StartTime:   s.triggerStartTime[ruleKey],
								Description: fmt.Sprintf("%s 触发告警规则 %s (级别: %s)", r.Type, rule.Name, r.Severity),
							}
							if err := tx.Create(record).Error; err != nil {
								log.Printf("创建告警记录失败: %v", err)
								return fmt.Errorf("创建告警记录失败: %v", err)
							}
							log.Printf("成功创建告警记录: ID=%d", record.ID)
						} else {
							// 已存在告警记录，只更新最新值
							existingRecord.Value = value
							if err := tx.Save(&existingRecord).Error; err != nil {
								log.Printf("更新告警记录失败: %v", err)
								return fmt.Errorf("更新告警记录失败: %v", err)
							}
							log.Printf("更新告警记录值: ID=%d, 新值=%.2f", existingRecord.ID, value)
						}
					}
				} else {
					// 如果未触发告警，重置计数器并检查是否需要解除告警
					s.resetTriggerCount(ruleKey)
					if r.RecoverNotify {
						log.Printf("检查是否需要解除告警并发送恢复通知")
						s.resolveAlert(rule.ID, metrics.HostID, r.Type)
					}
				}
			}
		} else {
			log.Printf("规则 %s (ID=%d) 不适用于主机 %d，跳过检查", rule.Name, rule.ID, metrics.HostID)
		}
	}

	return nil
}

// isHostApplicable 检查主机是否在适用列表中
func (s *AlertService) isHostApplicable(hostID uint64, applicableHosts map[uint64]struct{}) bool {
	_, exists := applicableHosts[hostID]
	return exists
}

// getMetricValue 获取指定类型的指标值
func (s *AlertService) getMetricValue(metrics *monitor.MetricPoint, ruleType string) (float64, error) {
	var value float64
	switch ruleType {
	case alert.RuleTypeCPUUsage:
		value = metrics.CPUUsage
	case alert.RuleTypeMemoryUsage:
		value = metrics.Memory.UsedPercent
	case alert.RuleTypeMemorySwap:
		value = metrics.Memory.SwapPercent
	case alert.RuleTypeDiskUsage:
		// 计算所有磁盘的平均使用率
		if len(metrics.DiskUsages) == 0 {
			return 0, fmt.Errorf("没有可用的磁盘数据")
		}
		var totalPercent float64
		for _, disk := range metrics.DiskUsages {
			totalPercent += disk.UsedPercent
		}
		value = totalPercent / float64(len(metrics.DiskUsages))
	case alert.RuleTypeNetInSpeed:
		// 计算所有网卡的总入站速率
		var totalSpeed float64
		for _, net := range metrics.NetworkStatus {
			totalSpeed += net.BytesRecvRate
		}
		value = totalSpeed
	case alert.RuleTypeNetOutSpeed:
		// 计算所有网卡的总出站速率
		var totalSpeed float64
		for _, net := range metrics.NetworkStatus {
			totalSpeed += net.BytesSentRate
		}
		value = totalSpeed
	case alert.RuleTypeNetInTransfer:
		// 计算所有网卡的总入站流量
		var totalTransfer uint64
		for _, net := range metrics.NetworkStatus {
			totalTransfer += net.BytesRecv
		}
		value = float64(totalTransfer)
	case alert.RuleTypeNetOutTransfer:
		// 计算所有网卡的总出站流量
		var totalTransfer uint64
		for _, net := range metrics.NetworkStatus {
			totalTransfer += net.BytesSent
		}
		value = float64(totalTransfer)
	case alert.RuleTypeNetError:
		// 计算所有网卡的总错误数
		var totalErrors uint64
		for _, net := range metrics.NetworkStatus {
			totalErrors += net.Errin + net.Errout
		}
		value = float64(totalErrors)
	case alert.RuleTypeNetDrop:
		// 计算所有网卡的总丢包数
		var totalDrops uint64
		for _, net := range metrics.NetworkStatus {
			totalDrops += net.Dropin + net.Dropout
		}
		value = float64(totalDrops)
	case alert.RuleTypeTCPConn:
		// 计算所有网卡的总TCP连接数
		var totalConnections int
		for _, net := range metrics.NetworkStatus {
			for _, count := range net.TCPConnections {
				totalConnections += count
			}
		}
		value = float64(totalConnections)
	default:
		return 0, fmt.Errorf("未知的规则类型: %s", ruleType)
	}
	log.Printf("获取指标值: 类型=%s, 值=%.2f", ruleType, value)
	return value, nil
}

// checkDuration 检查告警持续时间
func (s *AlertService) checkDuration(ruleKey string, duration uint64) bool {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	// 如果是首次触发，记录开始时间
	if _, exists := s.triggerCount[ruleKey]; !exists {
		s.triggerStartTime[ruleKey] = time.Now()
		s.triggerCount[ruleKey] = 1
		log.Printf("首次触发告警规则: %s, 开始计数", ruleKey)
		return false
	}

	// 检查是否达到持续时间
	elapsedDuration := time.Since(s.triggerStartTime[ruleKey])
	isDurationMet := elapsedDuration.Seconds() >= float64(duration)

	if !isDurationMet {
		// 增加计数
		s.triggerCount[ruleKey]++
		log.Printf("告警持续时间检查: 规则=%s, 已持续=%.2f秒, 需要持续=%d秒",
			ruleKey, elapsedDuration.Seconds(), duration)
	}

	return isDurationMet
}

// resetTriggerCount 重置触发计数器
func (s *AlertService) resetTriggerCount(ruleKey string) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	delete(s.triggerCount, ruleKey)
	delete(s.triggerStartTime, ruleKey)
	log.Printf("重置告警计数器: %s", ruleKey)
}

// resolveAlert 解除告警状态并发送恢复通知
func (s *AlertService) resolveAlert(ruleID uint64, hostID uint64, ruleType string) error {
	tx := global.DB.Debug()

	// 查找处于告警状态的记录
	var record alert.AlertRecord
	err := tx.Where("rule_id = ? AND host_id = ? AND status = ?",
		ruleID, hostID, alert.AlertStatusAlerting).
		First(&record).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil // 没有需要解除的告警
		}
		return fmt.Errorf("查询告警记录失败: %v", err)
	}

	// 更新告警状态为已恢复
	record.Status = alert.AlertStatusResolved
	endTime := time.Now()
	record.EndTime = &endTime
	if err := tx.Save(&record).Error; err != nil {
		return fmt.Errorf("更新告警记录失败: %v", err)
	}

	// 获取告警规则详情用于通知
	var rule alert.AlertRule
	if err := tx.First(&rule, ruleID).Error; err != nil {
		return fmt.Errorf("获取告警规则失败: %v", err)
	}

	// 如果配置了通知组，发送恢复通知
	if rule.NotificationGroupID > 0 {
		// TODO: 调用通知服务发送恢复通知
		log.Printf("发送告警恢复通知: 规则=%s, 主机ID=%d, 通知组ID=%d",
			rule.Name, hostID, rule.NotificationGroupID)
	}

	return nil
}

// contains 检查切片中是否包含指定值
func contains(slice []uint64, item uint64) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}
