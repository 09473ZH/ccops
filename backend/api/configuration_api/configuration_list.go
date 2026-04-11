package configuration_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"

	"github.com/gin-gonic/gin"
)

type ConfigurationType struct {
	Type string `json:"type" form:"type"`
}

// sensitive (type, fieldName) pairs whose FieldValue must never leave the server.
var sensitiveConfigFields = map[string]map[string]bool{
	models.ConfigurationTypeKey: {"PrivateKey": true},
	models.ConfigurationTypeLlm: {"ApiKey": true},
}

func isSensitiveConfig(cfgType, fieldName string) bool {
	if names, ok := sensitiveConfigFields[cfgType]; ok {
		return names[fieldName]
	}
	return false
}

func (ConfigurationApi) ConfigurationListView(c *gin.Context) {
	configurationType := c.Query("type")
	var configurationList []models.Configuration
	if configurationType == "" {
		global.DB.Model(&models.Configuration{}).Find(&configurationList)
	} else {
		global.DB.Model(&models.Configuration{}).Where("type = ?", configurationType).Find(&configurationList)
	}

	// Strip sensitive values from the response. The frontend still sees whether a
	// value has been set via the IsChanged flag so it can render "configured".
	for i := range configurationList {
		if isSensitiveConfig(configurationList[i].Type, configurationList[i].FieldName) {
			configurationList[i].FieldValue = ""
		}
	}

	res.OkWithList(configurationList, int64(len(configurationList)), c)
}
