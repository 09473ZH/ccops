package user_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"

	"github.com/gin-gonic/gin"
)

type PermissionStruct struct {
	HostId   uint   `json:"hostID"`
	HostIp   string `json:"hostIP"`
	HostName string `json:"hostName"`
}

func (UserApi) UserPermissionInfoView(c *gin.Context) {
	userID := c.Param("id")

	// 创建权限列表切片
	var permissionList []PermissionStruct

	// 查询用户的主机权限
	var hostPermissions []models.HostPermission
	if err := global.DB.Debug().Model(&models.HostPermission{}).Where("user_id = ?", userID).Find(&hostPermissions).Error; err != nil {
		res.FailWithMessage("获取用户权限失败", c)
		return
	}

	// 获取所有相关的主机ID
	var hostIds []uint
	for _, perm := range hostPermissions {
		hostIds = append(hostIds, perm.HostId)
	}

	// 查询主机信息
	var hosts []models.HostModel
	if err := global.DB.Where("id IN ?", hostIds).Find(&hosts).Error; err != nil {
		res.FailWithMessage("获取主机信息失败", c)
		return
	}

	// 组装权限列表
	for _, host := range hosts {
		permissionList = append(permissionList, PermissionStruct{
			HostId:   host.ID,
			HostIp:   host.HostServerUrl,
			HostName: host.Name,
		})
	}

	// 返回结果
	res.OkWithList(permissionList, int64(len(permissionList)), c)
}
