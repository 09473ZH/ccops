package notification_api

import (
	"ccops/global"
	"ccops/models/alert"
	"ccops/models/res"

	"github.com/gin-gonic/gin"
)

// GetNotificationList 获取通知配置列表
// @Summary 获取通知配置列表
// @Description 获取通知配置列表，支持分页和筛选
// @Tags 通知配置
// @Accept json
// @Produce json
// @Param page query int true "页码"
// @Param limit query int true "每页数量"
// @Param name query string false "通知名称"
// @Param enabled query bool false "是否启用"
// @Success 200 {object} alert.NotificationList
// @Router /api/notifications [get]
func (NotificationApi) GetNotificationList(c *gin.Context) {
	var query alert.NotificationRequest
	if err := c.ShouldBindQuery(&query.NotificationListQuery); err != nil {
		res.FailWithMessage("参数错误", c)
		return
	}

	// 构建查询条件
	db := global.DB.Model(&alert.Notification{})
	if query.NotificationListQuery.Name != "" {
		db = db.Where("name LIKE ?", "%"+query.NotificationListQuery.Name+"%")
	}
	if query.NotificationListQuery.Enabled != nil {
		db = db.Where("enabled = ?", *query.NotificationListQuery.Enabled)
	}

	// 获取总数
	var total int64
	if err := db.Count(&total).Error; err != nil {
		res.FailWithMessage("获取通知配置总数失败", c)
		return
	}

	// 获取列表
	var notifications []alert.Notification
	if err := db.Offset((query.NotificationListQuery.Page - 1) * query.NotificationListQuery.Limit).
		Limit(query.NotificationListQuery.Limit).
		Find(&notifications).Error; err != nil {
		res.FailWithMessage("获取通知配置列表失败", c)
		return
	}

	// 转换为响应格式
	list := make([]alert.NotificationInfo, len(notifications))
	for i, notification := range notifications {
		list[i] = alert.NotificationInfo{
			ID:        notification.ID,
			Name:      notification.Name,
			Message:   notification.Message,
			Enabled:   notification.Enabled,
			CreatedAt: notification.CreatedAt,
			UpdatedAt: notification.UpdatedAt,
		}
	}

	res.OkWithData(alert.NotificationList{
		Total: total,
		List:  list,
	}, c)
}
