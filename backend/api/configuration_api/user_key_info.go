package configuration_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"github.com/gin-gonic/gin"
)

func (ConfigurationApi) UserKeyInfo(c *gin.Context) {
	type userKeyInfoResponse struct {
		PublicKey string   `json:"publicKey"`
		HostIps   []string `json:"hostIp"`
	}
	key := c.Query("publicKey")

	var rep userKeyInfoResponse
	rep.PublicKey = key
	var hostIds []uint
	global.DB.Debug().Model(&models.UserKeyModel{}).
		Where("`key` = ?", key).
		Select("host_id").
		Find(&hostIds)
	global.DB.Model(&models.HostModel{}).Where("id in (?)", hostIds).Select("host_server_url").Find(&rep.HostIps)

	res.OkWithData(rep, c)
}
