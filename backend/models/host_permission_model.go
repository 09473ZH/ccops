package models

type HostPermission struct {
	MODEL
	HostId uint `json:"hostId" gorm:"index"` // 为HostId添加索引
	UserId uint `json:"userId" gorm:"index"` // 为UserId添加索引
}
