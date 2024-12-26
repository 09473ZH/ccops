package role_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"github.com/gin-gonic/gin"
)

func (RoleApi) RoleRemove(c *gin.Context) {
	id := c.Param("id")
	var role models.RoleModel
	tx := global.DB.Begin()

	// 查找角色
	if err := tx.Model(&models.RoleModel{}).Where("id = ?", id).First(&role).Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("软件不存在", c)
		return
	}

	// 查找关联的角色修订ID
	var roleRevisionIDList []uint
	if err := tx.Model(&models.RoleRevisionModel{}).Where("role_id = ?", id).Select("id").Find(&roleRevisionIDList).Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("查找软件版本失败", c)
		return
	}

	// 删除关联的文件

	if err := tx.Model(&models.RevisionFile{}).Where("role_revision_model_id IN ?", roleRevisionIDList).Delete(&models.RevisionFile{}).Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("删除文件失败", c)
		return
	}

	// 删除角色修订
	if err := tx.Model(&models.RoleRevisionModel{}).Where("id IN ?", roleRevisionIDList).Delete(&models.RoleRevisionModel{}).Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("删除软件版本失败", c)
		return
	}

	// 删除角色
	if err := tx.Model(&models.RoleModel{}).Where("id = ?", id).Delete(&role).Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("删除软件失败", c)
		return
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("删除失败", c)
		return
	}

	res.OkWithMessage("删除成功", c)
}
