package response

import (
	"time"
)

// AlertRuleInfo 告警规则信息
type AlertRuleInfo struct {
	ID             uint64    `json:"id"`             // 规则ID
	Name           string    `json:"name"`           // 告警规则名称
	Description    string    `json:"description"`    // 告警规则描述
	Universal      bool      `json:"universal"`      // 是否对全部主机生效
	Enabled        bool      `json:"enabled"`        // 是否启用
	Priority       string    `json:"priority"`       // 告警等级(P0-P3)
	Type           string    `json:"type"`           // 规则类型
	Duration       int       `json:"duration"`       // 持续时间(秒)
	Operator       string    `json:"operator"`       // 运算符(>, <, >=, <=, ==)
	Threshold      float64   `json:"threshold"`      // 阈值
	RecoverNotify  bool      `json:"recoverNotify"`  // 是否发送恢复通知
	NotificationId uint64    `json:"notificationId"` // 通知配置ID
	CreatedAt      time.Time `json:"createdAt"`      // 创建时间
	UpdatedAt      time.Time `json:"updatedAt"`      // 更新时间

	// 白名单配置
	WhitelistHosts  []TargetInfo `json:"whitelistHosts"`  // 白名单主机列表
	WhitelistLabels []TargetInfo `json:"whitelistLabels"` // 白名单标签列表

	// 黑名单配置
	BlacklistHosts  []TargetInfo `json:"blacklistHosts"`  // 黑名单主机列表
	BlacklistLabels []TargetInfo `json:"blacklistLabels"` // 黑名单标签列表
}

// TargetInfo 目标信息
type TargetInfo struct {
	ID   uint64 `json:"id"`   // 目标ID
	Name string `json:"name"` // 目标名称
}

// AlertRuleTargetInfo 告警规则目标信息
type AlertRuleTargetInfo struct {
	ID          uint64 `json:"id"`          // ID
	AlertRuleID uint64 `json:"alertRuleId"` // 告警规则ID
	TargetID    uint64 `json:"targetId"`    // 目标ID
	TargetType  int8   `json:"targetType"`  // 目标类型(0:主机, 1:主机组)
	Excluded    bool   `json:"excluded"`    // 是否为黑名单
}

// AlertRuleList 告警规则列表响应
type AlertRuleList struct {
	Total int64           `json:"total"` // 总数
	List  []AlertRuleInfo `json:"list"`  // 规则列表
}

// AlertRecordInfo 告警记录信息
type AlertRecordInfo struct {
	ID           uint64     `json:"id"`           // 记录ID
	RuleID       uint64     `json:"ruleId"`       // 规则ID
	RuleName     string     `json:"ruleName"`     // 规则名称
	Priority     string     `json:"priority"`     // 告警等级
	HostID       uint64     `json:"hostId"`       // 主机ID
	HostName     string     `json:"hostName"`     // 主机名称
	Status       string     `json:"status"`       // 状态描述
	StatusCode   int        `json:"statusCode"`   // 状态码
	Value        float64    `json:"value"`        // 触发值
	RecoverValue float64    `json:"recoverValue"` // 恢复值
	StartTime    time.Time  `json:"startTime"`    // 开始时间
	EndTime      *time.Time `json:"endTime"`      // 结束时间
	Description  string     `json:"description"`  // 描述
	CreatedAt    time.Time  `json:"createdAt"`    // 创建时间
}

// AlertRecordList 告警记录列表响应
type AlertRecordList struct {
	Total         int64             `json:"total"`         // 总记录数
	AlertingTotal int64             `json:"alertingTotal"` // 告警中的记录数
	HostTotal     int64             `json:"hostTotal"`     // 告警主机数
	List          []AlertRecordInfo `json:"list"`          // 记录列表
}

// AlertStatistics 告警统计信息
type AlertStatistics struct {
	TotalAlerts     int64 `json:"totalAlerts"`     // 总告警数
	ActiveAlerts    int64 `json:"activeAlerts"`    // 活跃告警数
	AffectedHosts   int64 `json:"affectedHosts"`   // 受影响主机数
	ResolvedAlerts  int64 `json:"resolvedAlerts"`  // 已解决告警数
	P0Alerts        int64 `json:"p0Alerts"`        // P0级别告警数
	P1Alerts        int64 `json:"p1Alerts"`        // P1级别告警数
	P2Alerts        int64 `json:"p2Alerts"`        // P2级别告警数
	P3Alerts        int64 `json:"p3Alerts"`        // P3级别告警数
	LastHourAlerts  int64 `json:"lastHourAlerts"`  // 最近1小时告警数
	Last24HrAlerts  int64 `json:"last24HrAlerts"`  // 最近24小时告警数
	Last7DaysAlerts int64 `json:"last7DaysAlerts"` // 最近7天告警数
}

// AlertAggregation 告警聚合信息
type AlertAggregation struct {
	RuleID      uint64     `json:"ruleId"`      // 规则ID
	RuleName    string     `json:"ruleName"`    // 规则名称
	Priority    string     `json:"priority"`    // 告警等级(P0-P3)
	HostCount   int64      `json:"hostCount"`   // 触发告警的主机数
	AffectHosts []HostInfo `json:"affectHosts"` // 受影响的主机列表
}

// HostInfo 主机信息
type HostInfo struct {
	ID            uint64 `json:"id"`   // 主机ID
	Name          string `json:"name"` // 主机名称
	HostServerUrl string `json:"ip"`   // 主机访问地址
}

// AlertAggregationList 告警聚合列表响应
type AlertAggregationList struct {
	Total int64              `json:"total"` // 总数
	List  []AlertAggregation `json:"list"`  // 聚合列表
}

// MetricTypeInfo 指标类型信息
type MetricTypeInfo struct {
	Type string `json:"type"` // 指标类型代码
	Name string `json:"name"` // 指标名称

}

// MetricTypeList 指标类型列表响应
type MetricTypeList struct {
	List []MetricTypeInfo `json:"list"` // 指标类型列表
}
