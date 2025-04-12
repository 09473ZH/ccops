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
	// 主机标签缓存，key是主机ID，value是标签ID列表
	hostLabelCache     map[uint64][]uint64
	hostLabelCacheTime map[uint64]time.Time
	mutex              sync.RWMutex
}

var defaultAlertService *AlertService

func init() {
	defaultAlertService = &AlertService{
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

// CheckMetrics 检查监控指标是否触发告警
func (s *AlertService) CheckMetrics(metrics *monitor.MetricPoint) error {

	// 获取主机所属的标签ID列表
	hostLabels, err := s.getHostLabels(metrics.HostID)
	if err != nil {
		log.Printf("获取主机标签失败: %v", err)
		return err
	}

	// 定期清理过期的状态
	go GetStateManager().CleanupStates()

	// 从缓存获取适用于该主机的所有规则
	rules := GetRuleCache().GetRulesForHost(metrics.HostID, hostLabels)

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
			log.Printf("规则 %d 被触发", rule.ID)
			// 检查持续时间
			if rule.Duration > 0 {
				if !GetStateManager().CheckDuration(ruleKey, uint64(rule.Duration), value) {
					log.Printf("未达到持续时间要求，继续观察")
					continue
				}

			}

			// 创建或更新告警记录
			if err := s.createOrUpdateAlert(global.DB, rule, metrics.HostID, value); err != nil {

			}
		} else {

			// 重置持续时间检查状态
			GetStateManager().ResetState(ruleKey)

			// 只有在配置了恢复通知时才检查是否需要解除告警
			if rule.RecoverNotify {
				// 检查是否已经确认恢复
				if !GetStateManager().ConfirmRecovery(ruleKey, true) {
					log.Printf("恢复确认未完成，继续观察")
					continue
				}

				// 检查是否存在告警记录
				var record alert.AlertRecord
				if err := global.DB.Where("rule_id = ? AND host_id = ? AND status = ?",
					rule.ID, metrics.HostID, alert.AlertStatusAlerting).
					First(&record).Error; err != nil {
					if !errors.Is(err, gorm.ErrRecordNotFound) {
						log.Printf("检查告警记录失败: %v", err)
					}
					continue
				}

				// 发现告警记录，且当前值已恢复正常，则更新状态
				log.Printf("检测到告警恢复，当前值: %.2f", value)
				now := time.Now()
				record.Status = alert.AlertStatusResolved
				record.EndTime = &now
				record.RecoverValue = value

				if err := global.DB.Save(&record).Error; err != nil {
					log.Printf("更新告警记录失败: %v", err)
					continue
				}

				// 发送恢复通知
				if err := WebhookNotification(uint(rule.ID), uint(metrics.HostID), value, NotificationTypeRecover, now); err != nil {
					log.Printf("发送恢复通知失败: %v", err)
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

// createOrUpdateAlert 创建或更新告警记录
func (s *AlertService) createOrUpdateAlert(tx *gorm.DB, rule *alert.AlertRule, hostID uint64, value float64) error {
	var record alert.AlertRecord
	tx = tx.Debug()
	err := tx.Where("rule_id = ? AND host_id = ? AND status = ?",
		rule.ID, hostID, alert.AlertStatusAlerting).
		First(&record).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// 创建新的告警记录
			now := time.Now()
			record = alert.AlertRecord{
				RuleID:      rule.ID,
				HostID:      hostID,
				Status:      alert.AlertStatusAlerting,
				Value:       value,
				StartTime:   now,
				Description: fmt.Sprintf("触发告警：%s，当前值：%.2f", rule.Name, value),
			}
			if err := tx.Create(&record).Error; err != nil {
				return err
			}

			// 发送告警通知
			if err := WebhookNotification(uint(rule.ID), uint(hostID), value, NotificationTypeAlert, now); err != nil {
				log.Printf("发送告警通知失败: %v", err)
			}
			return nil
		}
		return err
	}

	// 更新现有记录
	now := time.Now()
	record.Value = value
	record.UpdatedAt = now
	record.Description = fmt.Sprintf("触发告警：%s，当前值：%.2f", rule.Name, value)
	return tx.Save(&record).Error
}
