package models

type LabelModel struct {
	MODEL

	Name string `gorm:"type:varchar(255);not null;comment:标签名称" json:"name"`

	Host  []HostModel `gorm:"many2many:host_labels" json:"host"`                                               // 关联的主机列表
	Users []UserModel `gorm:"many2many:user_labels;joinForeignKey:LabelID;joinReferences:UserID" json:"users"` // 关联的用户列表
}
