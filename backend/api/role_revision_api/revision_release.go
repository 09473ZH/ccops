package role_revision_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"github.com/gin-gonic/gin"
	"time"
)

type RoleRevisionRequest struct {
	ChangeLog string `json:"changeLog"`
}

func (RoleRevisionApi) RevisionReleaseView(c *gin.Context) {
	revisionId := c.Param("id")
	var cr RoleRevisionRequest
	if err := c.ShouldBindJSON(&cr); err != nil {
		res.FailWithMessage(err.Error(), c)
		return
	}

	// 查找需要更新的 RoleRevision 记录
	var roleRevision models.RoleRevisionModel
	err := global.DB.Take(&roleRevision, revisionId).Error
	if err != nil {
		res.FailWithMessage("版本不存在", c)
		return
	}
	if roleRevision.IsRelease {
		// 如果已经锁定，则不能重复锁定
		res.FailWithMessage("版本已经锁定", c)
		return
	}

	// 更新字段信息

	roleRevision.IsRelease = true

	// 开启事务更新
	tx := global.DB.Begin()

	// 更新 RoleRevision 主表数据
	if err := tx.Model(&roleRevision).Updates(map[string]interface{}{

		"change_log":   cr.ChangeLog,
		"release_time": time.Now(), // 更新锁定时间
		"IsRelease":    true,
	}).Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("锁定失败", c)
		return
	}
	//锁定成功后生成副本
	// IsRelease 设为 false）
	newRoleRevision := models.RoleRevisionModel{
		RoleID:         roleRevision.RoleID,
		TaskContent:    roleRevision.TaskContent,
		HandlerContent: roleRevision.HandlerContent,
		VarContent:     roleRevision.VarContent,
		IsActive:       roleRevision.IsActive,
		IsRelease:      false, // 副本是默认 IsRelease 为 false
		//Files:          roleRevision.Files,
	}
	var FileIdList []uint
	tx.Model(&models.RevisionFile{}).Where("role_revision_model_id = ?", roleRevision.ID).Select("file_model_id").Find(&FileIdList)
	if len(FileIdList) > 0 {
		var files []models.FileModel
		err := tx.Model(&models.FileModel{}).Where("id IN (?)", FileIdList).Find(&files).Error
		if err != nil {
			tx.Rollback()
			res.FailWithMessage("副本关联文件失败", c)
		}
		newRoleRevision.Files = files
	}

	// 保存副本数据
	if err := tx.Create(&newRoleRevision).Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("副本生成失败", c)
		return
	}

	tx.Commit()

	res.OkWithMessage("锁定成功", c)
}
