package models

import "time"

type RoleRevisionModel struct {
	MODEL
	RoleID         uint        `gorm:"not null;index;comment:关联的配置ID" json:"roleId"`         // 关联的配置ID
	TaskContent    string      `gorm:"type:text;comment:任务内容" json:"taskContent"`            // 任务内容
	HandlerContent string      `gorm:"type:text;comment:处理内容" json:"handlerContent"`         // 处理内容
	VarContent     string      `gorm:"type:text;comment:变量内容" json:"varContent"`             // 变量内容
	IsActive       bool        `gorm:"not null;default:false;comment:是否激活" json:"isActive"`  // 是否激活
	IsRelease      bool        `gorm:"not null;default:false;comment:是否锁定" json:"isRelease"` // 是否锁定（锁定后不可修改）
	ReleaseTime    time.Time   `gorm:"default:NULL;comment:锁定时间" json:"releaseTime"`         // 锁定时间
	Files          []FileModel `gorm:"many2many:revision_files" json:"files"`
	ChangeLog      string      `gorm:"type:text;comment:变更日志" json:"changeLog"` // 变更日志

	// 更新时间
}
