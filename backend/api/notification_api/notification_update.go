package notification_api

import (
	"ccops/global"
	"ccops/models/alert"
	"ccops/models/res"
	"fmt"

	"github.com/gin-gonic/gin"
)

func (NotificationApi) UpdateNotification(c *gin.Context) {
	id := c.Param("id")
	var req alert.NotificationRequest
	if err := c.ShouldBindJSON(&req.UpdateNotification); err != nil {
		fmt.Println(err)
		res.FailWithMessage("参数错误", c)
		return
	}

	// 查找现有通知配置
	var notification alert.Notification
	if err := global.DB.First(&notification, id).Error; err != nil {
		res.FailWithMessage("通知配置不存在", c)
		return
	}

	// 更新字段
	if req.UpdateNotification.Name != "" {
		notification.Name = req.UpdateNotification.Name
	}
	if req.UpdateNotification.Message != "" {
		notification.Message = req.UpdateNotification.Message
	}
	if req.UpdateNotification.WebhookUrl != "" {
		notification.WebhookUrl = req.UpdateNotification.WebhookUrl
	}
	notification.Enabled = req.UpdateNotification.Enabled

	// 保存更新
	if err := global.DB.Save(&notification).Error; err != nil {
		res.FailWithMessage("更新通知配置失败", c)
		return
	}

	res.OkWithMessage("更新成功", c)
}
