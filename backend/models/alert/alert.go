package alert

import (
	"fmt"
	"time"
)

// AlertRule 告警规则
type AlertRule struct {
	ID                  uint64    `json:"id" gorm:"primarykey"`
	CreatedAt           time.Time `json:"createdAt"`
	UpdatedAt           time.Time `json:"updatedAt"`
	Name                string    `json:"name" gorm:"size:100"`                 // 告警规则名称
	Description         string    `json:"description" gorm:"size:500"`          // 告警规则描述
	Enable              bool      `json:"enable"`                               // 是否启用
	Rules               []Rule    `json:"rules" gorm:"serializer:json"`         // 具体规则列表
	HostIDs             []uint64  `json:"hostIds" gorm:"serializer:json"`       // 适用的主机ID列表(白名单)
	LabelIDs            []uint64  `json:"labelIds" gorm:"serializer:json"`      // 适用的主机标签ID列表(白名单)
	IgnoreHostIDs       []uint64  `json:"ignoreHostIds" gorm:"serializer:json"` // 忽略的主机ID列表(黑名单)
	NotificationGroupID uint64    `json:"notificationGroupId"`                  // 通知组ID
	Tags                []string  `json:"tags" gorm:"serializer:json"`          // 规则标签
}

// Rule 具体告警规则
type Rule struct {
	Type          string     `json:"type" binding:"required"`     // 规则类型
	Duration      int        `json:"duration" binding:"required"` // 持续时间(秒)
	CycleInterval int        `json:"cycleInterval"`               // 循环间隔(分钟)
	CycleStart    *time.Time `json:"cycleStart"`                  // 循环开始时间
	MinValue      float64    `json:"minValue"`                    // 最小阈值
	MaxValue      float64    `json:"maxValue"`                    // 最大阈值
	Severity      string     `json:"severity" binding:"required"` // 告警级别
	RecoverNotify bool       `json:"recoverNotify"`               // 是否发送恢复通知
}

// AlertRecord 告警记录
type AlertRecord struct {
	ID          uint64     `json:"id" gorm:"primarykey"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
	RuleID      uint64     `json:"ruleId" gorm:"index"`                   // 告警规则ID
	HostID      uint64     `json:"hostId" gorm:"index"`                   // 触发告警的主机ID
	Status      int        `json:"status" gorm:"type:int"`                // 告警状态: 0-正常, 1-告警中, 2-已恢复
	Value       float64    `json:"value"`                                 // 触发告警时的值
	StartTime   time.Time  `json:"startTime"`                             // 告警开始时间
	EndTime     *time.Time `json:"endTime"`                               // 告警结束时间
	Description string     `json:"description" gorm:"type:varchar(1000)"` // 告警描述
}

// 告警规则类型常量
const (
	// 系统指标
	RuleTypeCPUUsage    = "cpu"         // CPU使用率
	RuleTypeLoad1       = "load1"       // 1分钟负载
	RuleTypeLoad5       = "load5"       // 5分钟负载
	RuleTypeLoad15      = "load15"      // 15分钟负载
	RuleTypeMemoryUsage = "memory"      // 内存使用率
	RuleTypeMemorySwap  = "memory_swap" // Swap使用率
	RuleTypeDiskUsage   = "disk"        // 磁盘使用率

	// 网络指标
	RuleTypeNetInSpeed     = "network_in"       // 网络入站速度
	RuleTypeNetOutSpeed    = "network_out"      // 网络出站速度
	RuleTypeNetInTransfer  = "net_transfer_in"  // 入站流量累计
	RuleTypeNetOutTransfer = "net_transfer_out" // 出站流量累计
	RuleTypeNetError       = "net_error"        // 网络错误数
	RuleTypeNetDrop        = "net_drop"         // 网络丢包数
	RuleTypeTCPConn        = "tcp_conn"         // TCP连接数
	RuleTypeNetworkDelay   = "network_delay"    // 网络延迟

	// 状态指标
	RuleTypeOnline  = "online"  // 在线状态
	RuleTypeSSL     = "ssl"     // SSL证书过期
	RuleTypeProcess = "process" // 进程状态
)

// 告警级别常量
const (
	SeverityInfo     = "info"
	SeverityWarning  = "warning"
	SeverityError    = "error"
	SeverityCritical = "critical"
)

// 告警状态常量
const (
	AlertStatusNormal   = 0 // 正常状态
	AlertStatusAlerting = 1 // 告警中
	AlertStatusResolved = 2 // 已恢复状态
)

// 操作符常量
const (
	OperatorGreaterThan    = ">"  // 大于
	OperatorLessThan       = "<"  // 小于
	OperatorGreaterOrEqual = ">=" // 大于等于
	OperatorLessOrEqual    = "<=" // 小于等于
	OperatorEqual          = "==" // 等于
)

// ValidateRule 验证告警规则
func ValidateRule(rule *AlertRule) error {
	validTypes := map[string]bool{
		RuleTypeCPUUsage:       true,
		RuleTypeLoad1:          true,
		RuleTypeLoad5:          true,
		RuleTypeLoad15:         true,
		RuleTypeMemoryUsage:    true,
		RuleTypeMemorySwap:     true,
		RuleTypeDiskUsage:      true,
		RuleTypeNetInSpeed:     true,
		RuleTypeNetOutSpeed:    true,
		RuleTypeNetInTransfer:  true,
		RuleTypeNetOutTransfer: true,
		RuleTypeNetError:       true,
		RuleTypeNetDrop:        true,
		RuleTypeTCPConn:        true,
		RuleTypeNetworkDelay:   true,
		RuleTypeOnline:         true,
		RuleTypeSSL:            true,
		RuleTypeProcess:        true,
	}

	validSeverity := map[string]bool{
		SeverityInfo:     true,
		SeverityWarning:  true,
		SeverityError:    true,
		SeverityCritical: true,
	}

	for _, r := range rule.Rules {
		if !validTypes[r.Type] {
			return fmt.Errorf("invalid rule type: %s", r.Type)
		}
		if !validSeverity[r.Severity] {
			return fmt.Errorf("invalid severity level: %s", r.Severity)
		}
		if r.MinValue > r.MaxValue {
			return fmt.Errorf("minValue cannot be greater than maxValue")
		}
		if r.CycleInterval < 0 {
			return fmt.Errorf("cycleInterval cannot be negative")
		}
		if r.Duration < 0 {
			return fmt.Errorf("duration cannot be negative")
		}
	}
	return nil
}

// CheckRule 检查告警规则
func (r *Rule) CheckRule(value float64) bool {
	// 检查是否在阈值范围内
	if r.MinValue != 0 && value < r.MinValue {
		return true
	}
	if r.MaxValue != 0 && value > r.MaxValue {
		return true
	}
	return false
}
