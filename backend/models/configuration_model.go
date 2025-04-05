package models

var (
	ConfigurationTypeSystem       = "system"
	ConfigurationTypeKey          = "key"
	ConfigurationTypeLlm          = "llm"
	ConfigurationTypeNotification = "notification"
)

type Configuration struct {
	MODEL
	Type             string `gorm:"type:varchar(128)" json:"type"`
	FieldName        string `gorm:"type:varchar(128)" json:"fieldName"`
	FieldValue       string `gorm:"type:text" json:"fieldValue"`
	FieldDescription string `gorm:"type:text" json:"fieldDescription"`
	IsChanged        bool   `gorm:"not null;default:false;comment:是否更改过" json:"isChanged"` //该配置用的默认还是自定义
}
