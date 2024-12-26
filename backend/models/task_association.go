package models

type TaskAssociationModel struct {
	MODEL
	TaskID     uint `gorm:"not null;index;comment:任务ID" json:"taskId"`       //关联到任务表
	RoleID     uint `gorm:"not null;index;comment:发布的配置ID" json:"roleId"`    // 关联到配置表
	RevisionID uint `gorm:"not null;index;comment:配置版本ID" json:"revisionId"` // 关联到配置版本表
	UserID     uint `gorm:"size:32;index;comment:发布人id" json:"userId"`
}
