package models

import "gorm.io/gorm"

type SoftwareModel struct {
	gorm.Model
	HostID  uint   `gorm:"index;comment:主机ID" json:"hostId"` // 关联 HostModel 表
	Name    string `json:"name"`                             // 软件名称
	Version string `json:"version"`                          // 软件版本
	Type    string `json:"type"`                            // 软件类型
}
