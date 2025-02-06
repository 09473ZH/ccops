package models

type UserLabels struct {
	MODEL

	UserID uint      `gorm:"not null;comment:用户ID" json:"user_id"`
	User   UserModel `gorm:"foreignKey:UserID" json:"user"`

	LabelID uint       `gorm:"not null;comment:标签ID" json:"label_id"`
	Label   LabelModel `gorm:"foreignKey:LabelID" json:"label"`
}
