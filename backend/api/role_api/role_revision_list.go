package role_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"github.com/gin-gonic/gin"
)

func (RoleApi) RoleRevisionListView(c *gin.Context) {
	id := c.Param("id")
	var RevisionList []models.RoleRevisionModel
	global.DB.Model(&models.RoleRevisionModel{}).Where("role_id = ?", id).
		Preload("Files").Find(&RevisionList)

	res.OkWithList(RevisionList, int64(len(RevisionList)), c)

}
