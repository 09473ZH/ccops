package notification_api

import (
	"ccops/global"
	"ccops/models/alert"
	"ccops/models/res"

	"github.com/gin-gonic/gin"
)

// GetNotification 获取通知配置详情
// @Summary 获取通知配置详情
// @Description 获取指定通知配置的详细信息
// @Tags 通知配置
// @Accept json
// @Produce json
// @Param id path int true "通知ID"
// @Success 200 {object} alert.NotificationInfo
// @Router /api/notifications/{id} [get]
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
