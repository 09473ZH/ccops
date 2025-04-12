package alert

import (
	"fmt"
	"log"
	"time"
)

// AlertRule 告警规则主表
type AlertRule struct {
	ID             uint64    `json:"id" gorm:"primarykey"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
	Name           string    `json:"name" gorm:"size:255"`           // 告警规则名称
	Description    string    `json:"description" gorm:"size:500"`    // 告警规则描述
	Universal      bool      `json:"universal" gorm:"default:false"` // 是否对全部主机生效
	Enabled        bool      `json:"enabled" gorm:"default:true"`    // 是否启用
	Priority       string    `json:"priority" gorm:"size:2"`         // 告警等级(P0-P3)
	Type           string    `json:"type"`                           // 规则类型
	Duration       int       `json:"duration"`                       // 持续时间(秒)
	Operator       string    `json:"operator" gorm:"size:2"`         // 运算符(>, <, >=, <=, ==)
	Threshold      float64   `json:"threshold"`                      // 阈值
	RecoverNotify  bool      `json:"recoverNotify"`                  // 是否发送恢复通知
	NotificationId uint64    `json:"notificationId"`                 // 通知ID
}

// AlertRuleTarget 告警规则与目标(主机/主机组)的关联表
type AlertRuleTarget struct {
	ID          uint64 `json:"id" gorm:"primarykey"`
	AlertRuleID uint64 `json:"alertRuleId" gorm:"index"`
	TargetID    uint64 `json:"targetId"`                      // 目标ID(主机ID或主机组ID)
	TargetType  int8   `json:"targetType"`                    // 目标类型(0:主机, 1:主机组)
	Excluded    bool   `json:"excluded" gorm:"default:false"` // 是否为黑名单
}

// AlertRecord 告警记录表
type AlertRecord struct {
	ID           uint64     `json:"id" gorm:"primarykey"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
	RuleID       uint64     `json:"ruleId" gorm:"index"`                   // 告警规则ID
	HostID       uint64     `json:"hostId" gorm:"index"`                   // 触发告警的主机ID
	Status       int        `json:"status" gorm:"type:int"`                // 告警状态: 0-正常, 1-告警中, 2-已恢复
	Value        float64    `json:"value"`                                 // 触发告警时的值
	RecoverValue float64    `json:"recoverValue"`                          // 恢复时的值
	StartTime    time.Time  `json:"startTime"`                             // 告警开始时间
	EndTime      *time.Time `json:"endTime"`                               // 告警结束时间
	Description  string     `json:"description" gorm:"type:varchar(1000)"` // 告警描述
}

// 告警规则类型常量
const (
	// 系统指标
	RuleTypeCPUUsage  = "cpu"    // CPU使用率
	RuleTypeCPULoad1  = "load1"  // 1分钟负载
	RuleTypeCPULoad5  = "load5"  // 5分钟负载
	RuleTypeCPULoad15 = "load15" // 15分钟负载

	// 内存指标
	RuleTypeMemoryUsage     = "memory"       // 内存使用率
	RuleTypeMemoryAvailable = "memory_avail" // 可用内存
	RuleTypeMemoryFree      = "memory_free"  // 空闲内存

	// 磁盘指标
	RuleTypeDiskUsage   = "disk_usage"  // 磁盘使用率
	RuleTypeDiskFree    = "disk_free"   // 磁盘剩余空间
	RuleTypeDiskReadIO  = "disk_read"   // 磁盘读取速率
	RuleTypeDiskWriteIO = "disk_write"  // 磁盘写入速率
	RuleTypeDiskVolume  = "disk_volume" // 分区使用率

	// 网络指标
	RuleTypeNetInSpeed      = "network_in"     // 总网络入站速度
	RuleTypeNetOutSpeed     = "network_out"    // 总网络出站速度
	RuleTypeNetCardInSpeed  = "netcard_in"     // 单网卡入站速度
	RuleTypeNetCardOutSpeed = "netcard_out"    // 单网卡出站速度
	RuleTypeNetCardStatus   = "netcard_status" // 网卡状态

	// 状态指标
	RuleTypeOnline  = "online"  // 在线状态
	RuleTypeSSL     = "ssl"     // SSL证书过期
	RuleTypeProcess = "process" // 进程状态
)

// 运算符常量
const (
	OperatorGt  = ">"  // 大于
	OperatorLt  = "<"  // 小于
	OperatorGte = ">=" // 大于等于
	OperatorLte = "<=" // 小于等于
	OperatorEq  = "==" // 等于
)

// 告警优先级常量
const (
	PriorityP0 = "P0" // 最高优先级
	PriorityP1 = "P1"
	PriorityP2 = "P2"
	PriorityP3 = "P3" // 最低优先级
)

// 告警状态常量
const (
	AlertStatusAlerting = 1 // 告警中
	AlertStatusResolved = 2 // 已恢复状态
)

// 目标类型常量
const (
	TargetTypeHost  = 0 // 主机
	TargetTypeLabel = 1 // 主机组(标签)
)

// ValidateRule 验证告警规则
func ValidateRule(rule *AlertRule) error {
	validTypes := map[string]bool{
		// CPU相关指标
		RuleTypeCPUUsage:  true,
		RuleTypeCPULoad1:  true,
		RuleTypeCPULoad5:  true,
		RuleTypeCPULoad15: true,

		// 内存相关指标
		RuleTypeMemoryUsage:     true,
		RuleTypeMemoryAvailable: true,
		RuleTypeMemoryFree:      true,

		// 磁盘相关指标
		RuleTypeDiskUsage:   true,
		RuleTypeDiskFree:    true,
		RuleTypeDiskReadIO:  true,
		RuleTypeDiskWriteIO: true,
		RuleTypeDiskVolume:  true,

		// 网络相关指标
		RuleTypeNetInSpeed:      true,
		RuleTypeNetOutSpeed:     true,
		RuleTypeNetCardInSpeed:  true,
		RuleTypeNetCardOutSpeed: true,
		RuleTypeNetCardStatus:   true,

		// 状态指标
		RuleTypeOnline:  true,
		RuleTypeSSL:     true,
		RuleTypeProcess: true,
	}

	validPriority := map[string]bool{
		PriorityP0: true,
		PriorityP1: true,
		PriorityP2: true,
		PriorityP3: true,
	}

	validOperators := map[string]bool{
		OperatorGt:  true,
		OperatorLt:  true,
		OperatorGte: true,
		OperatorLte: true,
		OperatorEq:  true,
	}

	if !validTypes[rule.Type] {
		return fmt.Errorf("invalid rule type: %s", rule.Type)
	}
	if !validPriority[rule.Priority] {
		return fmt.Errorf("invalid priority level: %s", rule.Priority)
	}
	if !validOperators[rule.Operator] {
		return fmt.Errorf("invalid operator: %s", rule.Operator)
	}
	if rule.Duration < 0 {
		return fmt.Errorf("duration cannot be negative")
	}

	// 对特定类型的规则进行阈值范围验证
	switch rule.Type {
	case RuleTypeCPUUsage, RuleTypeMemoryUsage, RuleTypeDiskUsage, RuleTypeDiskVolume:
		if rule.Threshold < 0 || rule.Threshold > 100 {
			return fmt.Errorf("percentage threshold must be between 0 and 100")
		}
	case RuleTypeNetCardStatus:
		if rule.Threshold != 0 && rule.Threshold != 1 {
			return fmt.Errorf("network card status threshold must be 0 or 1")
		}
	case RuleTypeMemoryAvailable, RuleTypeMemoryFree, RuleTypeDiskFree:
		if rule.Threshold < 0 {
			return fmt.Errorf("size threshold cannot be negative")
		}
	case RuleTypeDiskReadIO, RuleTypeDiskWriteIO,
		RuleTypeNetInSpeed, RuleTypeNetOutSpeed,
		RuleTypeNetCardInSpeed, RuleTypeNetCardOutSpeed:
		if rule.Threshold < 0 {
			return fmt.Errorf("rate threshold cannot be negative")
		}
	}

	return nil
}

// CheckRule 检查告警规则
func (r *AlertRule) CheckRule(value float64) bool {
	log.Printf("检查告警规则: 当前值=%.2f, 阈值=%.2f, 运算符=%s", value, r.Threshold, r.Operator)

	var result bool
	switch r.Operator {
	case OperatorGt:
		result = value > r.Threshold
	case OperatorLt:
		result = value < r.Threshold
	case OperatorGte:
		result = value >= r.Threshold
	case OperatorLte:
		result = value <= r.Threshold
	case OperatorEq:
		result = value == r.Threshold
	default:
		log.Printf("不支持的运算符: %s", r.Operator)
		return false
	}

	log.Printf("规则检查结果: %v", result)
	return result
}
