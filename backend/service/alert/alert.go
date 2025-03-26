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

// AlertService 告警服务
type AlertService struct {
	// 用于记录每个规则的触发次数
	triggerCount     map[string]int64
	triggerStartTime map[string]time.Time
	// 主机标签缓存，key是主机ID，value是标签ID列表
	hostLabelCache     map[uint64][]uint64
	hostLabelCacheTime map[uint64]time.Time
	mutex              sync.RWMutex
}

var defaultAlertService *AlertService

func init() {
	defaultAlertService = &AlertService{
		triggerCount:       make(map[string]int64),
		triggerStartTime:   make(map[string]time.Time),
		hostLabelCache:     make(map[uint64][]uint64),
		hostLabelCacheTime: make(map[uint64]time.Time),
		mutex:              sync.RWMutex{},
	}
}

// GetAlertService 获取告警服务实例
func GetAlertService() *AlertService {
	return defaultAlertService
}

// getHostLabels 获取主机标签（带缓存）
func (s *AlertService) getHostLabels(hostID uint64) ([]uint64, error) {
	s.mutex.RLock()
	if labels, exists := s.hostLabelCache[hostID]; exists {
		if time.Since(s.hostLabelCacheTime[hostID]) < 5*time.Minute {
			s.mutex.RUnlock()
			return labels, nil
		}
	}
	s.mutex.RUnlock()

	// 缓存不存在或已过期，重新查询
	s.mutex.Lock()
	defer s.mutex.Unlock()

	// 双重检查
	if labels, exists := s.hostLabelCache[hostID]; exists {
		if time.Since(s.hostLabelCacheTime[hostID]) < 5*time.Minute {
			return labels, nil
		}
	}

	var labels []uint64
	if err := global.DB.Table("host_labels").
		Where("host_model_id = ?", hostID).
		Pluck("label_model_id", &labels).Error; err != nil {
		return nil, err
	}

	// 更新缓存
	s.hostLabelCache[hostID] = labels
	s.hostLabelCacheTime[hostID] = time.Now()

	return labels, nil
}

// cleanupOldTriggers 清理过期的触发记录
func (s *AlertService) cleanupOldTriggers() {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	now := time.Now()
	// 清理超过1小时的记录
	for key, startTime := range s.triggerStartTime {
		if now.Sub(startTime) > time.Hour {
			delete(s.triggerCount, key)
			delete(s.triggerStartTime, key)
		}
	}
}

// CheckMetrics 检查监控指标是否触发告警
func (s *AlertService) CheckMetrics(metrics *monitor.MetricPoint) error {
	log.Printf("开始检查告警，收到的指标数据：CPU使用率=%.2f%%, 内存使用率=%.2f%%, 网卡数量=%d, 主机ID=%d",
		metrics.CPU.UsagePercent, metrics.Memory.UsagePercent,
		len(metrics.Network.Interfaces), metrics.HostID)

	// 获取主机所属的标签ID列表
	hostLabels, err := s.getHostLabels(metrics.HostID)
	if err != nil {
		log.Printf("获取主机标签失败: %v", err)
		return err
	}

	// 定期清理过期的触发记录
	go s.cleanupOldTriggers()

	// 从缓存获取适用于该主机的所有规则
	rules := GetRuleCache().GetRulesForHost(metrics.HostID, hostLabels)
	log.Printf("找到%d条适用的告警规则", len(rules))

	// 检查每个规则
	for _, rule := range rules {
		// 获取指标值
		value, err := s.getMetricValue(metrics, rule.Type)
		if err != nil {
			log.Printf("获取指标值失败: %v", err)
			continue
		}

		// 检查是否触发告警
		triggered := rule.CheckRule(value)

		ruleKey := fmt.Sprintf("%d_%d", rule.ID, metrics.HostID)
		if triggered {
			// 检查持续时间
			if rule.Duration > 0 {
				if !s.checkDuration(ruleKey, uint64(rule.Duration)) {
					continue
				}
			}

			// 创建或更新告警记录
			if err := s.createOrUpdateAlert(global.DB, rule, metrics.HostID, value); err != nil {
				log.Printf("创建/更新告警记录失败: %v", err)
			}
		} else {
			// 如果未触发告警，重置计数器
			s.resetTriggerCount(ruleKey)

			// 只有在配置了恢复通知时才检查是否需要解除告警
			if rule.RecoverNotify {
				// 检查是否存在告警记录
				var count int64
				if err := global.DB.Model(&alert.AlertRecord{}).
					Where("rule_id = ? AND host_id = ? AND status = ?",
						rule.ID, metrics.HostID, alert.AlertStatusAlerting).
					Count(&count).Error; err != nil {
					log.Printf("检查告警记录失败: %v", err)
					continue
				}

				// 只有存在告警记录时才尝试解除告警
				if count > 0 {
					log.Printf("检查是否需要解除告警并发送恢复通知")
					if err := s.resolveAlert(rule.ID, metrics.HostID); err != nil {
						log.Printf("解除告警失败: %v", err)
					}
				}
			}
		}
	}

	return nil
}

// isHostApplicable 检查规则是否适用于主机
func (s *AlertService) isHostApplicable(tx *gorm.DB, hostID uint64, hostLabels []uint64, rule *alert.AlertRule) (bool, error) {
	// 如果规则是全局的
	if rule.Universal {
		// 检查是否在黑名单中
		var count int64
		err := tx.Model(&alert.AlertRuleTarget{}).
			Where("alert_rule_id = ? AND target_id = ? AND target_type = ? AND excluded = ?",
				rule.ID, hostID, alert.TargetTypeHost, true).
			Count(&count).Error
		if err != nil {
			return false, err
		}
		// 不在黑名单中则适用
		return count == 0, nil
	}

	// 非全局规则，检查白名单
	var targets []alert.AlertRuleTarget
	err := tx.Where("alert_rule_id = ?", rule.ID).Find(&targets).Error
	if err != nil {
		return false, err
	}

	// 检查主机是否直接在白名单中
	for _, target := range targets {
		if target.TargetType == alert.TargetTypeHost && target.TargetID == hostID {
			return !target.Excluded, nil
		}
		// 检查主机的标签是否在白名单中
		if target.TargetType == alert.TargetTypeLabel {
			for _, labelID := range hostLabels {
				if target.TargetID == labelID {
					return !target.Excluded, nil
				}
			}
		}
	}

	return false, nil
}

// getMetricValue 获取指定类型的指标值
func (s *AlertService) getMetricValue(metrics *monitor.MetricPoint, ruleType string) (float64, error) {
	var value float64
	switch ruleType {
	// CPU相关指标
	case alert.RuleTypeCPUUsage:
		value = metrics.CPU.UsagePercent
	case alert.RuleTypeCPULoad1:
		value = metrics.CPU.Load1m
	case alert.RuleTypeCPULoad5:
		value = metrics.CPU.Load5m
	case alert.RuleTypeCPULoad15:
		value = metrics.CPU.Load15m

	// 内存相关指标
	case alert.RuleTypeMemoryUsage:
		value = metrics.Memory.UsagePercent
	case alert.RuleTypeMemoryAvailable:
		value = float64(metrics.Memory.AvailableBytes) / (1024 * 1024 * 1024) // 转换为GB
	case alert.RuleTypeMemoryFree:
		value = float64(metrics.Memory.FreeBytes) / (1024 * 1024 * 1024) // 转换为GB

	// 磁盘相关指标
	case alert.RuleTypeDiskUsage:
		if len(metrics.Disk.Volumes) > 0 {
			value = metrics.Disk.Volumes[0].UsagePercent
		}
	case alert.RuleTypeDiskFree:
		value = metrics.Disk.AvailableBytes // 已经是GB单位
	case alert.RuleTypeDiskReadIO:
		value = float64(metrics.Disk.ReadRate) / (1024 * 1024) // 转换为MB/s
	case alert.RuleTypeDiskWriteIO:
		value = float64(metrics.Disk.WriteRate) / (1024 * 1024) // 转换为MB/s
	case alert.RuleTypeDiskVolume:
		// 遍历所有分区，找到使用率最高的
		var maxUsage float64
		for _, volume := range metrics.Disk.Volumes {
			if volume.UsagePercent > maxUsage {
				maxUsage = volume.UsagePercent
			}
		}
		value = maxUsage

	// 网络相关指标
	case alert.RuleTypeNetInSpeed:
		value = metrics.Network.RecvRate / (1024 * 1024) // 转换为MB/s
	case alert.RuleTypeNetOutSpeed:
		value = metrics.Network.SendRate / (1024 * 1024) // 转换为MB/s
	case alert.RuleTypeNetCardInSpeed:
		// 遍历所有网卡，找到入站速率最高的
		var maxRecvRate float64
		for _, net := range metrics.Network.Interfaces {
			if net.RecvRate > maxRecvRate {
				maxRecvRate = net.RecvRate
			}
		}
		value = maxRecvRate / (1024 * 1024) // 转换为MB/s
	case alert.RuleTypeNetCardOutSpeed:
		// 遍历所有网卡，找到出站速率最高的
		var maxSendRate float64
		for _, net := range metrics.Network.Interfaces {
			if net.SendRate > maxSendRate {
				maxSendRate = net.SendRate
			}
		}
		value = maxSendRate / (1024 * 1024) // 转换为MB/s
	case alert.RuleTypeNetCardStatus:
		// 检查是否有活跃的网卡
		if len(metrics.Network.Interfaces) > 0 {
			value = 1 // 有网卡在线
		} else {
			value = 0 // 无网卡在线
		}

	default:
		return 0, fmt.Errorf("不支持的规则类型: %s", ruleType)
	}
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

// createOrUpdateAlert 创建或更新告警记录
func (s *AlertService) createOrUpdateAlert(tx *gorm.DB, rule *alert.AlertRule, hostID uint64, value float64) error {
	var record alert.AlertRecord
	err := tx.Where("rule_id = ? AND host_id = ? AND status = ?",
		rule.ID, hostID, alert.AlertStatusAlerting).
		First(&record).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// 创建新的告警记录
			record = alert.AlertRecord{
				RuleID:      rule.ID,
				HostID:      hostID,
				Status:      alert.AlertStatusAlerting,
				Value:       value,
				StartTime:   time.Now(),
				Description: fmt.Sprintf("触发告警：%s，当前值：%.2f", rule.Name, value),
			}
			return tx.Create(&record).Error
		}
		return err
	}

	// 更新现有记录
	record.Value = value
	record.UpdatedAt = time.Now()
	record.Description = fmt.Sprintf("触发告警：%s，当前值：%.2f", rule.Name, value)
	return tx.Save(&record).Error
}

// resolveAlert 解除告警状态并发送恢复通知
func (s *AlertService) resolveAlert(ruleID uint64, hostID uint64) error {
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

	// TODO: 调用通知服务发送恢复通知
	log.Printf("发送告警恢复通知: 规则=%s, 主机ID=%d",
		rule.Name, hostID)

	return nil
}
