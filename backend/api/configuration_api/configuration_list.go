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

func (ConfigurationApi) ConfigurationListView(c *gin.Context) {
	configurationType := c.Query("type")
	var configurationList []models.Configuration
	if configurationType == "" {
		global.DB.Model(&models.Configuration{}).Find(&configurationList)
	} else {
		global.DB.Model(&models.Configuration{}).Where("type = ?", configurationType).Find(&configurationList)
	}

	res.OkWithList(configurationList, int64(len(configurationList)), c)

}
