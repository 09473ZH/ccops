package role_revision_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"github.com/gin-gonic/gin"
	"strconv"
)

func (RoleRevisionApi) RoleActiveSwitch(c *gin.Context) {
	revisionId := c.Param("id")

	// 将 revisionId 转为 uint 类型
	id, err := strconv.ParseUint(revisionId, 10, 64)
	if err != nil {
		res.FailWithMessage("参数错误", c)
		return
	}

	// 查找当前版本
	var roleRevision models.RoleRevisionModel
	if err := global.DB.First(&roleRevision, id).Error; err != nil {
		res.FailWithMessage("版本不存在", c)
		return
	}

	// 检查是否被锁定
	if !roleRevision.IsRelease {
		res.FailWithMessage("该版本无法激活，请完善版本", c)
		return
	}

	// 查找当前激活的版本，需根据 role_id 进行过滤
	var activeRevision models.RoleRevisionModel
	activeExists := global.DB.Model(&models.RoleRevisionModel{}).
		Where("is_active = ? AND role_id = ?", true, roleRevision.RoleID).
		First(&activeRevision).Error == nil

	if activeExists {
		if activeRevision.ID == uint(id) {
			// 当前点击的是已激活的版本，直接关闭激活状态
			global.DB.Model(&activeRevision).Update("is_active", false)
			res.OkWithMessage("已关闭激活状态", c)
			return
		} else {
			// 关闭当前激活的版本
			global.DB.Model(&activeRevision).Update("is_active", false)
		}
	}

	// 激活新的版本
	global.DB.Model(&models.RoleRevisionModel{}).Where("id = ?", id).Update("is_active", true)
	res.OkWithMessage("激活成功", c)
}
