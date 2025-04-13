package notification_api

import (
	"ccops/global"
	"ccops/models/alert"
	"ccops/models/res"

	"github.com/gin-gonic/gin"
)

func (NotificationApi) DeleteNotification(c *gin.Context) {
	id := c.Param("id")

	// 开启事务
	tx := global.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 检查是否有告警规则正在使用此通知配置
	var count int64
	if err := tx.Model(&alert.AlertRule{}).Where("notification_id = ?", id).Count(&count).Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("检查通知配置使用状态失败", c)
		return
	}

	if count > 0 {
		tx.Rollback()
		res.FailWithMessage("该通知配置正在被告警规则使用，无法删除", c)
		return
	}

	// 删除通知配置
	if err := tx.Delete(&alert.Notification{}, id).Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("删除通知配置失败", c)
		return
	}

	if err := tx.Commit().Error; err != nil {
		res.FailWithMessage("删除通知配置失败", c)
		return
	}

	res.OkWithMessage("删除成功", c)
}
