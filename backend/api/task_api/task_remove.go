package task_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"github.com/gin-gonic/gin"
)

func (TaskApi) TaskRemove(c *gin.Context) {
	id := c.Param("id")
	db := global.DB.Debug()

	// 开始事务
	tx := db.Begin()

	// 删除任务关联记录
	if err := tx.Where("task_id = ?", id).Delete(&models.TaskAssociationModel{}).Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("删除任务关联的角色失败", c)
		return
	}

	// 删除任务发版记录
	if err := tx.Where("task_id = ?", id).Delete(&models.TargetAssociationModel{}).Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("删除任务关联的目标失败", c)
		return
	}

	// 删除任务本身
	if err := tx.Where("id = ?", id).Delete(&models.TaskModel{}).Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("删除任务失败", c)
		return
	}

	// 提交事务
	tx.Commit()
	res.OkWithMessage("任务删除成功", c)
}
