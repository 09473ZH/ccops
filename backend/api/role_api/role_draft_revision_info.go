package role_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"github.com/gin-gonic/gin"
)

func (RoleApi) RoleDraftRevisionInfoView(c *gin.Context) {
	roleID := c.Param("id")

	var roleRevision models.RoleRevisionModel
	err := global.DB.Model(&models.RoleRevisionModel{}).
		Where("role_id = ? AND is_release = ?", roleID, false).Preload("Files").First(&roleRevision).Error
	if err != nil {
		res.FailWithMessage("获取失败", c)
		return
	}

	res.Ok(roleRevision, "获取成功", c)

}
