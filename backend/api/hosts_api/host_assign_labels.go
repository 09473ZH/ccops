package hosts_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"

	"github.com/gin-gonic/gin"
)

// AssignLabelsRequest 定义了分配标签请求的结构
type AssignLabelsRequest struct {
	HostID   uint   `json:"hostId" binding:"required"`
	LabelIDs []uint `json:"labelIds" binding:"required"`
}

func (HostsApi) AssignLabelsToHost(c *gin.Context) {
	var req AssignLabelsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		res.FailWithMessage(err.Error(), c)
		return
	}

	// 开始事务
	tx := global.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var host models.HostModel
	if err := tx.Model(&host).Where("id = ?", req.HostID).First(&host).Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("Host not found", c)
		return
	}

	// 清除旧的标签关联
	if err := tx.Model(&host).Association("Label").Clear(); err != nil {
		tx.Rollback()
		res.FailWithMessage("Failed to clear old labels: "+err.Error(), c)
		return
	}

	var labels []models.LabelModel
	if err := tx.Model(&labels).Where("id IN (?)", req.LabelIDs).Find(&labels).Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("Some labels not found", c)
		return
	}

	// 添加新的标签关联
	if err := tx.Model(&host).Association("Label").Append(&labels); err != nil {
		tx.Rollback()
		res.FailWithMessage("Failed to assign labels: "+err.Error(), c)
		return
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("Failed to commit transaction: "+err.Error(), c)
		return
	}

	res.OkWithMessage("Labels assigned successfully", c)
}
