package alert

import (
	"time"
)

// Notification 通知配置表
type Notification struct {
	ID         uint64    `json:"id" gorm:"primarykey"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
	WebhookUrl string    `json:"webhookUrl" gorm:"size:255"`  // 通知Webhook地址
	Name       string    `json:"name" gorm:"size:255"`        // 通知名称
	Message    string    `json:"message" gorm:"size:1000"`    // 通知消息模板
	Enabled    bool      `json:"enabled" gorm:"default:true"` // 是否启用
}

// NotificationRequest 通知请求相关结构体
type NotificationRequest struct {
	// CreateNotification 创建通知请求
	CreateNotification struct {
		Name       string `json:"name" binding:"required"`       // 通知名称
		Message    string `json:"message" binding:"required"`    // 通知消息模板
		Enabled    bool   `json:"enabled"`                       // 是否启用
		WebhookUrl string `json:"webhookUrl" binding:"required"` // 通知Webhook地址
	}

	// UpdateNotification 更新通知请求
	UpdateNotification struct {
		ID         uint64 `json:"id" binding:"required"` // 通知ID
		Name       string `json:"name"`                  // 通知名称
		Message    string `json:"message"`               // 通知消息模板
		Enabled    bool   `json:"enabled"`               // 是否启用
		WebhookUrl string `json:"webhookUrl" `
	}

	// NotificationListQuery 通知列表查询参数
	NotificationListQuery struct {
		Page    int    `form:"page" binding:"required,min=1"`  // 页码
		Limit   int    `form:"limit" binding:"required,min=1"` // 每页数量
		Name    string `form:"name"`                           // 通知名称（模糊查询）
		Enabled *bool  `form:"enabled"`                        // 是否启用
	}
}

// NotificationInfo 通知信息
type NotificationInfo struct {
	ID         uint64    `json:"id"`         // 通知ID
	Name       string    `json:"name"`       // 通知名称
	Message    string    `json:"message"`    // 通知消息模板
	WebhookUrl string    `json:"webhookUrl"` // 通知Webhook地址
	Enabled    bool      `json:"enabled"`    // 是否启用
	CreatedAt  time.Time `json:"createdAt"`  // 创建时间
	UpdatedAt  time.Time `json:"updatedAt"`  // 更新时间
}

// NotificationList 通知列表响应
type NotificationList struct {
	Count int64              `json:"count"` // 总数
	List  []NotificationInfo `json:"list"`  // 通知列表
}
