package models

type LabelModel struct {
	MODEL

	Name string `gorm:"type:varchar(255);not null;comment:标签名称" json:"name"`

	Host []HostModel `gorm:"many2many:host_labels" json:"host"` // 关联的 Label 列表
}
