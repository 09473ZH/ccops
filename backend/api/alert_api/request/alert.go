package request

import (
	"time"
)

// CreateAlertRule 创建告警规则请求
type CreateAlertRule struct {
	Name                string   `json:"name" binding:"required"`       // 告警规则名称
	Description         string   `json:"description"`                   // 告警规则描述
	Enable              bool     `json:"enable"`                        // 是否启用
	Rules               []Rule   `json:"rules" binding:"required,dive"` // 具体规则列表
	HostIDs             []uint64 `json:"hostIds"`                       // 绑定的主机ID列表
	LabelIDs            []uint64 `json:"labelIds"`                      // 绑定的主机标签ID列表
	IgnoreHostIDs       []uint64 `json:"ignoreHostIds"`                 // 忽略的主机ID列表
	NotificationGroupID uint64   `json:"notificationGroupId"`           // 通知组ID
	Tags                []string `json:"tags"`                          // 规则标签
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

// UpdateAlertRule 更新告警规则请求
type UpdateAlertRule struct {
	ID                  uint64   `json:"id" binding:"required"` // 规则ID
	Name                string   `json:"name"`                  // 告警规则名称
	Description         string   `json:"description"`           // 告警规则描述
	Enable              bool     `json:"enable"`                // 是否启用
	Rules               []Rule   `json:"rules"`                 // 具体规则列表
	HostIDs             []uint64 `json:"hostIds"`               // 绑定的主机ID列表
	LabelIDs            []uint64 `json:"labelIds"`              // 绑定的主机标签ID列表
	IgnoreHostIDs       []uint64 `json:"ignoreHostIds"`         // 忽略的主机ID列表
	NotificationGroupID uint64   `json:"notificationGroupId"`   // 通知组ID
	Tags                []string `json:"tags"`                  // 规则标签
}

// AlertRuleListQuery 告警规则列表查询参数
type AlertRuleListQuery struct {
	Page   int    `form:"page" binding:"required,min=1"`  // 页码
	Limit  int    `form:"limit" binding:"required,min=1"` // 每页数量
	Name   string `form:"name"`                           // 规则名称（模糊查询）
	Enable *bool  `form:"enable"`                         // 是否启用
}

// AlertRecordListQuery 告警记录列表查询参数
type AlertRecordListQuery struct {
	Page      int       `form:"page" binding:"required,min=1"`  // 页码
	Limit     int       `form:"limit" binding:"required,min=1"` // 每页数量
	Status    int       `form:"status"`                         // 状态：0-正常, 1-告警中, 2-已恢复
	RuleID    uint64    `form:"ruleId"`                         // 规则ID
	HostID    uint64    `form:"hostId"`                         // 主机ID
	StartTime time.Time `form:"startTime"`                      // 开始时间
	EndTime   time.Time `form:"endTime"`                        // 结束时间
}
