package role_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"github.com/gin-gonic/gin"
	"gorm.io/datatypes"
)

type RoleUpdateReq struct {
	Name        string                      `json:"name"`
	Description string                      `json:"description"`
	Tags        datatypes.JSONSlice[string] `json:"tags"`
}

func (RoleApi) RoleUpdateView(c *gin.Context) {
	var cr RoleUpdateReq
	if err := c.ShouldBindJSON(&cr); err != nil {
		res.FailWithMessage("参数错误", c)
	}
	id := c.Param("id")

	err := global.DB.Model(&models.RoleModel{}).Where("id=?", id).
		Updates(models.RoleModel{Name: cr.Name, Description: cr.Description, Tags: cr.Tags}).Error
	if err != nil {
		res.FailWithMessage("更新失败", c)
		return
	}
	res.OkWithMessage("更新成功", c)
}
