package hosts_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"github.com/gin-gonic/gin"
)

func (HostsApi) HostInfoView(c *gin.Context) {
	id := c.Param("id") // 从路径参数中获取 ID
	var hostInfo models.HostModel
	errHost := global.DB.Model(models.HostModel{}).
		Where("id = ?", id).
		Preload("Label").
		
		First(&hostInfo).Error

	if errHost != nil {
		// 检查错误信息
		res.FailWithMessage("用户不存在: "+errHost.Error(), c)
		return
	}

	//关联查磁盘信息
	var diskListInfo []models.DiskModel
	global.DB.Model(models.DiskModel{}).Where("host_id = ?", id).Find(&diskListInfo)
	hostInfo.Disk = diskListInfo
	//关联查主机下用户信息
	var hostUserInfo []models.HostUserModel
	global.DB.Model(models.HostUserModel{}).Where("host_id = ?", id).Find(&hostUserInfo)
	hostInfo.HostUser = hostUserInfo
	//关联查主机下软件信息
	var softwareListInfo []models.SoftwareModel
	global.DB.Model(models.SoftwareModel{}).Where("host_id = ?", id).Find(&softwareListInfo)
	hostInfo.Software = softwareListInfo

	res.OkWithData(hostInfo, c)
}
