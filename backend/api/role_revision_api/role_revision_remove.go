package role_revision_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"github.com/gin-gonic/gin"
)

//不允许删草稿版本和激活版本   is_release = 0 OR is_active = 1

func (RoleRevisionApi) RoleRevisionRemove(c *gin.Context) {
	revisionID := c.Param("id")

	var roleRevision models.RoleRevisionModel
	if err := global.DB.Model(&models.RoleRevisionModel{}).Where("id = ?", revisionID).First(&roleRevision).Error; err != nil {
		res.FailWithMessage("查找版本失败", c)
		return
	}

	if !roleRevision.IsRelease || roleRevision.IsActive {
		// 草稿版本或激活版本
		res.FailWithMessage("禁止删除此版本", c)
		return
	}

	tx := global.DB.Begin()

	// 删除关联的文件
	if err := tx.Model(&models.RevisionFile{}).Where("role_revision_model_id = ?", revisionID).Delete(&models.RevisionFile{}).Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("删除文件失败", c)
		return
	}

	// 删除角色修订版本
	if err := tx.Model(&models.RoleRevisionModel{}).Where("id = ?", revisionID).Delete(&roleRevision).Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("删除版本失败", c)
		return
	}

	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("删除失败", c)
		return
	}

	res.OkWithMessage("删除成功", c)
}
