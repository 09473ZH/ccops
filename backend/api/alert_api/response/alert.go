package response

import (
	"ccops/models/alert"
	"time"
)

// AlertRuleInfo 告警规则信息
type AlertRuleInfo struct {
	ID                  uint64       `json:"id"`                  // 规则ID
	Name                string       `json:"name"`                // 告警规则名称
	Description         string       `json:"description"`         // 告警规则描述
	Enable              bool         `json:"enable"`              // 是否启用
	Rules               []alert.Rule `json:"rules"`               // 具体规则列表
	HostIDs             []uint64     `json:"hostIds"`             // 绑定的主机ID列表
	LabelIDs            []uint64     `json:"labelIds"`            // 绑定的主机标签ID列表
	NotificationGroupID uint64       `json:"notificationGroupId"` // 通知组ID
	Tags                []string     `json:"tags"`                // 规则标签
	CreatedAt           time.Time    `json:"createdAt"`           // 创建时间
	UpdatedAt           time.Time    `json:"updatedAt"`           // 更新时间
}

// AlertRuleList 告警规则列表响应
type AlertRuleList struct {
	Total int64           `json:"total"` // 总数
	List  []AlertRuleInfo `json:"list"`  // 规则列表
}

// AlertRecordInfo 告警记录信息
type AlertRecordInfo struct {
	ID          uint64     `json:"id"`          // 记录ID
	RuleID      uint64     `json:"ruleId"`      // 规则ID
	RuleName    string     `json:"ruleName"`    // 规则名称
	HostID      uint64     `json:"hostId"`      // 主机ID
	Status      string     `json:"status"`      // 状态
	Value       float64    `json:"value"`       // 触发值
	StartTime   time.Time  `json:"startTime"`   // 开始时间
	EndTime     *time.Time `json:"endTime"`     // 结束时间
	Description string     `json:"description"` // 描述
	CreatedAt   time.Time  `json:"createdAt"`   // 创建时间
}

// AlertRecordList 告警记录列表响应
type AlertRecordList struct {
	Total int64             `json:"total"` // 总数
	List  []AlertRecordInfo `json:"list"`  // 记录列表
}
