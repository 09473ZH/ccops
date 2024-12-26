package role_revision_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"github.com/gin-gonic/gin"
)

func (RoleRevisionApi) RoleRevisionInfo(c *gin.Context) {
	id := c.Param("id")
	var roleRevision models.RoleRevisionModel
	global.DB.Model(&models.RoleRevisionModel{}).Where("id = ?", id).
		Preload("Files").First(&roleRevision)

	res.Ok(roleRevision, "获取成功", c)
}
