package hosts_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/ctype"
	"ccops/models/res"
	"ccops/utils/jwts"

	"github.com/gin-gonic/gin"
)

type Host struct {
	HostId   uint   `json:"hostId"`
	HostName string `json:"hostName"`
	HostIp   string `json:"hostIp"`
}

type PermissionHostList struct {
	LabelName string `json:"labelName"`
	LabelId   uint   `json:"labelId"`
	Hosts     []Host `json:"hosts"`
}

func (HostsApi) PermissionHosts(c *gin.Context) {

	_claims, _ := c.Get("claims")
	claims := _claims.(*jwts.CustomClaims)

	var hostIds []uint
	global.DB.Model(&models.HostPermission{}).Where("user_id = ?", claims.UserID).Select("host_id").Find(&hostIds)

	// 获取用户拥有的标签ID
	var labelIds []uint
	global.DB.Model(&models.UserLabels{}).Where("user_id = ?", claims.UserID).Select("label_id").Find(&labelIds)

	// 获取与这些标签关联的主机ID
	var additionalHostIds []uint
	if len(labelIds) > 0 {
		global.DB.Model(&models.HostLabels{}).Where("label_model_id IN ?", labelIds).Select("host_model_id").Find(&additionalHostIds)
	}

	// 合并主机ID
	hostIds = append(hostIds, additionalHostIds...)

	// 去重
	hostIdsMap := make(map[uint]bool)
	for _, id := range hostIds {
		hostIdsMap[id] = true
	}
	uniqueHostIds := make([]uint, 0, len(hostIdsMap))
	for id := range hostIdsMap {
		uniqueHostIds = append(uniqueHostIds, id)
	}

	// 根据合并后的主机ID列表获取主机信息
	var hosts []models.HostModel
	if claims.Role == ctype.PermissionAdmin {
		global.DB.Model(&models.HostModel{}).Preload("Label").Find(&hosts)
	} else {
		global.DB.Model(&models.HostModel{}).Where("id IN ?", uniqueHostIds).Preload("Label").Find(&hosts)
	}

	labelMap := make(map[string]struct {
		Hosts   []Host
		LabelId uint
	})
	for _, host := range hosts {
		if len(host.Label) == 0 {
			labelMap["无标签"] = struct {
				Hosts   []Host
				LabelId uint
			}{
				Hosts:   append(labelMap["无标签"].Hosts, Host{HostId: host.ID, HostName: host.Name, HostIp: host.HostServerUrl}),
				LabelId: 0,
			}
		} else {
			for _, label := range host.Label {
				labelMap[label.Name] = struct {
					Hosts   []Host
					LabelId uint
				}{
					Hosts:   append(labelMap[label.Name].Hosts, Host{HostId: host.ID, HostName: host.Name, HostIp: host.HostServerUrl}),
					LabelId: label.ID,
				}
			}
		}
	}

	var permissionHostLists []PermissionHostList
	for labelName, data := range labelMap {
		permissionHostLists = append(permissionHostLists, PermissionHostList{
			LabelName: labelName,
			LabelId:   data.LabelId,
			Hosts:     data.Hosts,
		})
	}

	res.OkWithList(permissionHostLists, int64(len(hosts)), c)
}
