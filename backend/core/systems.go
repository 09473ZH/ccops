package core

import (
	"ccops/global"
	"ccops/models"
)

func InitSystemConfiguration() {
	var systemsConfig models.Configuration
	global.DB.Model(&models.Configuration{}).Where("type = ?", models.ConfigurationTypeSystem).First(&systemsConfig)
	if systemsConfig.ID != 0 {
		//有数据,不用初始化
		return
	}
	//没数据,初始化
	global.DB.Create(&models.Configuration{
		Type:             models.ConfigurationTypeSystem,
		FieldName:        "ServerUrl",
		FieldValue:       "",
		FieldDescription: "用于连接ccops服务端",
	})

}
