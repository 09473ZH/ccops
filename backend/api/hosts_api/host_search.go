package hosts_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"

	"github.com/gin-gonic/gin"
)

type HostSearchRequest struct {
	Ip   string `form:"ip"`
	Id   uint   `form:"id"`
	Name string `form:"name"`
}

func (HostsApi) HostSearch(c *gin.Context) {
	var cr HostSearchRequest
	if err := c.ShouldBind(&cr); err != nil {
		res.FailWithMessage(err.Error(), c)
		return
	}

	var hosts []models.HostModel
	db := global.DB

	query := db
	if cr.Id != 0 {
		query = query.Where("id = ?", cr.Id)
	}
	if cr.Ip != "" {
		query = query.Where("host_server_url = ?", cr.Ip)
	}
	if cr.Name != "" {
		query = query.Where("name = ?", cr.Name)
	}

	if err := query.First(&hosts).Error; err != nil {
		res.FailWithMessage("无匹配主机", c)
		return
	}

	res.OkWithData(hosts, c)
}
