package notification_api

import (
	"ccops/global"
	"ccops/models/alert"
	"ccops/models/res"

	"github.com/gin-gonic/gin"
)

func (NotificationApi) GetNotification(c *gin.Context) {
	id := c.Param("id")

	// 查询通知配置
	var notification alert.Notification
	if err := global.DB.First(&notification, id).Error; err != nil {
		res.FailWithMessage("通知配置不存在", c)
		return
	}

	// 转换为响应格式
	info := alert.NotificationInfo{
		ID:         notification.ID,
		Name:       notification.Name,
		Message:    notification.Message,
		Enabled:    notification.Enabled,
		CreatedAt:  notification.CreatedAt,
		UpdatedAt:  notification.UpdatedAt,
		WebhookUrl: notification.WebhookUrl,
	}

	res.OkWithData(info, c)
}
