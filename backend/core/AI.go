package core

import (
	"ccops/global"
	"ccops/models"
)

func InitAIConfiguration() {
	var aiConfig models.Configuration
	global.DB.Model(&models.Configuration{}).Where("type = ?", models.ConfigurationTypeLlm).First(&aiConfig)
	if aiConfig.ID != 0 {
		//有数据,不用初始化
		return
	}
	//没数据,初始化
	global.DB.Create(&models.Configuration{
		Type:             models.ConfigurationTypeLlm,
		FieldName:        "BaseUrl",
		FieldValue:       "",
		FieldDescription: "大模型接口地址",
	})
	global.DB.Create(&models.Configuration{
		Type:             models.ConfigurationTypeLlm,
		FieldName:        "ApiKey",
		FieldValue:       "",
		FieldDescription: "大模型密钥",
	})
	global.DB.Create(&models.Configuration{
		Type:             models.ConfigurationTypeLlm,
		FieldName:        "ModelName",
		FieldValue:       "",
		FieldDescription: "大模型名称",
	})

}
