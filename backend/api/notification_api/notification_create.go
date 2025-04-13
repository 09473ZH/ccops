package notification_api

import (
	"ccops/global"
	"ccops/models/alert"
	"ccops/models/res"
	"github.com/gin-gonic/gin"
)

func (NotificationApi) CreateNotification(c *gin.Context) {
	var req alert.NotificationRequest
	if err := c.ShouldBindJSON(&req.CreateNotification); err != nil {
		res.FailWithMessage("参数错误", c)
		return
	}

	// 创建通知配置
	notification := &alert.Notification{
		Name:       req.CreateNotification.Name,
		Message:    req.CreateNotification.Message,
		Enabled:    req.CreateNotification.Enabled,
		WebhookUrl: req.CreateNotification.WebhookUrl,
	}

	// 保存到数据库
	if err := global.DB.Create(notification).Error; err != nil {
		res.FailWithMessage("创建通知配置失败", c)
		return
	}

	res.OkWithMessage("创建成功", c)
}
