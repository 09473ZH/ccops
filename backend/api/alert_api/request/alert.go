package request

import (
	"time"
)

// CreateAlertRule 创建告警规则请求
type CreateAlertRule struct {
	Name           string  `json:"name" binding:"required"`           // 告警规则名称
	Description    string  `json:"description"`                       // 告警规则描述
	Universal      bool    `json:"universal"`                         // 是否对全部主机生效
	Enabled        bool    `json:"enabled"`                           // 是否启用
	Priority       string  `json:"priority" binding:"required"`       // 告警等级(P0-P3)
	Type           string  `json:"type" binding:"required"`           // 规则类型
	Duration       int     `json:"duration" binding:"required"`       // 持续时间(秒)
	Operator       string  `json:"operator" binding:"required"`       // 运算符(>, <, >=, <=, ==)
	Threshold      float64 `json:"threshold"`                         // 阈值
	RecoverNotify  bool    `json:"recoverNotify"`                     // 是否发送恢复通知
	NotificationId uint64  `json:"notificationId" binding:"required"` // 通知配置ID

	// 白名单配置（选传）
	WhitelistHostIDs  []uint64 `json:"whitelistHostIds"`  // 白名单主机ID列表
	WhitelistLabelIDs []uint64 `json:"whitelistLabelIds"` // 白名单标签ID列表

	// 黑名单配置（选传，仅在Universal=true时生效）
	BlacklistHostIDs  []uint64 `json:"blacklistHostIds"`  // 黑名单主机ID列表
	BlacklistLabelIDs []uint64 `json:"blacklistLabelIds"` // 黑名单标签ID列表
}

// UpdateAlertRule 更新告警规则请求
type UpdateAlertRule struct {
	ID             uint64  `json:"id" binding:"required"` // 规则ID
	Name           string  `json:"name"`                  // 告警规则名称
	Description    string  `json:"description"`           // 告警规则描述
	Universal      bool    `json:"universal"`             // 是否对全部主机生效
	Enabled        bool    `json:"enabled"`               // 是否启用
	Priority       string  `json:"priority"`              // 告警等级(P0-P3)
	Type           string  `json:"type"`                  // 规则类型
	Duration       int     `json:"duration"`              // 持续时间(秒)
	Operator       string  `json:"operator"`              // 运算符(>, <, >=, <=, ==)
	Threshold      float64 `json:"threshold"`             // 阈值
	RecoverNotify  bool    `json:"recoverNotify"`         // 是否发送恢复通知
	NotificationId uint64  `json:"notificationId"`        // 通知配置ID

	// 白名单配置（选传）
	WhitelistHostIDs  []uint64 `json:"whitelistHostIds"`  // 白名单主机ID列表
	WhitelistLabelIDs []uint64 `json:"whitelistLabelIds"` // 白名单标签ID列表

	// 黑名单配置（选传）
	BlacklistHostIDs  []uint64 `json:"blacklistHostIds"`  // 黑名单主机ID列表
	BlacklistLabelIDs []uint64 `json:"blacklistLabelIds"` // 黑名单标签ID列表
}

// CreateAlertRuleTarget 创建告警规则目标请求
type CreateAlertRuleTarget struct {
	AlertRuleID uint64 `json:"alertRuleId" binding:"required"` // 告警规则ID
	TargetID    uint64 `json:"targetId" binding:"required"`    // 目标ID
	TargetType  int8   `json:"targetType" binding:"required"`  // 目标类型(0:主机, 1:主机组)
	Excluded    bool   `json:"excluded"`                       // 是否为黑名单
}

// AlertRuleListQuery 告警规则列表查询参数
type AlertRuleListQuery struct {
	Page     int    `form:"page" binding:"required,min=1"`  // 页码
	Limit    int    `form:"limit" binding:"required,min=1"` // 每页数量
	Name     string `form:"name"`                           // 规则名称（模糊查询）
	Enabled  *bool  `form:"enabled"`                        // 是否启用
	Priority string `form:"priority"`                       // 告警等级
	Type     string `form:"type"`                           // 规则类型
}

// AlertRecordListQuery 告警记录列表查询参数
type AlertRecordListQuery struct {
	Page      int       `form:"page" binding:"required,min=1"`  // 页码
	Limit     int       `form:"limit" binding:"required,min=1"` // 每页数量
	Status    int       `form:"status"`                         // 状态:, 1-告警中, 2-已恢复
	RuleID    uint64    `form:"ruleId"`                         // 规则ID
	HostID    uint64    `form:"hostId"`                         // 主机ID
	StartTime time.Time `form:"startTime"`                      // 开始时间
	EndTime   time.Time `form:"endTime"`                        // 结束时间
}
