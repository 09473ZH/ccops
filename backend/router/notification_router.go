package router

import (
	"ccops/api"
	"ccops/middleware"

	"github.com/gin-gonic/gin"
)

func (router RouterGroup) NotificationRouter(notificationRouterGroup *gin.RouterGroup) {
	app := api.ApiGroupApp.NotificationApi
	notificationRouterGroup.Use(middleware.JwtUser())
	notificationRouterGroup.POST("", app.CreateNotification)       // 创建通知配置
	notificationRouterGroup.PUT("", app.UpdateNotification)        // 更新通知配置
	notificationRouterGroup.GET("", app.GetNotificationList)       // 获取通知配置列表
	notificationRouterGroup.GET("/:id", app.GetNotification)       // 获取通知配置详情
	notificationRouterGroup.DELETE("/:id", app.DeleteNotification) // 删除通知配置
}
