package role_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"github.com/gin-gonic/gin"
)

func (RoleApi) RoleActiveRevisionInfoView(c *gin.Context) {
	roleID := c.Param("id")

	var roleRevision models.RoleRevisionModel
	global.DB.Model(&models.RoleRevisionModel{}).
		Where("role_id = ? AND is_active = ?", roleID, true).Preload("Files").First(&roleRevision)
	if roleRevision.ID == 0 {
		res.Ok(nil, "获取成功", c)
		return
	}

	res.Ok(roleRevision, "获取成功", c)

}
