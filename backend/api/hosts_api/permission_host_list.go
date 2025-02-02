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
	Hosts     []Host `json:"hosts"`
}

func (HostsApi) PermissionHostList(c *gin.Context) {

	_claims, _ := c.Get("claims")
	claims := _claims.(*jwts.CustomClaims)

	var hostIds []uint
	global.DB.Model(&models.HostPermission{}).Where("user_id = ?", claims.UserID).Select("host_id").Find(&hostIds)

	var hosts []models.HostModel

	if claims.Role == ctype.PermissionAdmin {
		global.DB.Model(&models.HostModel{}).Preload("Label").Find(&hosts)
	} else {
		global.DB.Model(&models.HostModel{}).Where("id IN ?", hostIds).Preload("Label").Find(&hosts)
	}

	labelMap := make(map[string][]Host)
	for _, host := range hosts {
		if len(host.Label) == 0 {
			labelMap["无标签"] = append(labelMap["无标签"], Host{HostId: host.ID, HostName: host.Name, HostIp: host.HostServerUrl})
		} else {
			for _, label := range host.Label {
				labelMap[label.Name] = append(labelMap[label.Name], Host{HostId: host.ID, HostName: host.Name, HostIp: host.HostServerUrl})
			}
		}
	}

	var permissionHostLists []PermissionHostList
	for labelName, hosts := range labelMap {
		permissionHostLists = append(permissionHostLists, PermissionHostList{
			LabelName: labelName,
			Hosts:     hosts,
		})
	}

	res.OkWithList(permissionHostLists, int64(len(hosts)), c)
}
