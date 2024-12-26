package models

import "gorm.io/datatypes"

type TaskModel struct {
	MODEL
	TaskName string `gorm:"size:128;comment:任务名" json:"taskName"`

	UserID                uint           `gorm:"size:32;index;comment:发布人id" json:"userId"`
	Status                string         `gorm:"size:128;default:created;comment:任务状态" json:"status"`
	Type                  string         `gorm:"size:128;comment:任务分类" json:"type"`
	Result                string         `gorm:"type:text;comment:任务结果" json:"result"` // 任务结果的字符串
	ShortcutScriptContent string         `gorm:"type:text;comment:快捷脚本" json:"shortcutScriptContent"`
	RoleDetails           datatypes.JSON `gorm:"type:json;comment:'任务软件相关信息';" json:"roleDetails"`
}
