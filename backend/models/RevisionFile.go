package models

type RevisionFile struct {
	RoleRevisionModelID uint `gorm:"primaryKey"` // 角色修订模型ID
	FileModelID         uint `gorm:"primaryKey"` // 文件模型ID
}
