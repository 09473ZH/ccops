package router

import (
	"ccops/api"

	"github.com/gin-gonic/gin"
)

func (router RouterGroup) RulesRouter(rulesRouterGroup *gin.RouterGroup) {
	app := api.ApiGroupApp.AlertApi

	// 告警规则相关路由
	rulesRouterGroup.POST("", app.CreateAlertRule)       // 创建告警规则
	rulesRouterGroup.PUT("", app.UpdateAlertRule)        // 更新告警规则
	rulesRouterGroup.DELETE("/:id", app.DeleteAlertRule) // 删除告警规则
	rulesRouterGroup.GET("/:id", app.GetAlertRule)       // 获取告警规则详情
	rulesRouterGroup.GET("", app.GetAlertRuleList)       // 获取告警规则列表

	// 告警记录相关路由
	rulesRouterGroup.GET("/records", app.GetAlertRecordList)     // 获取告警记录列表
	rulesRouterGroup.GET("/records/active", app.GetActiveAlerts) // 获取当前活跃的告警
}
