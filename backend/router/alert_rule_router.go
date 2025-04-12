package router

import (
	"ccops/api"

	"github.com/gin-gonic/gin"
)

func (router RouterGroup) RulesRouter(rulesRouterGroup *gin.RouterGroup) {
	app := api.ApiGroupApp.AlertApi

	// 告警规则基础操作
	rulesRouterGroup.POST("", app.CreateAlertRule)       // 创建告警规则
	rulesRouterGroup.PUT("", app.UpdateAlertRule)        // 更新告警规则
	rulesRouterGroup.GET("", app.GetAlertRuleList)       // 获取告警规则列表
	rulesRouterGroup.GET("/:id", app.GetAlertRule)       // 获取告警规则
	rulesRouterGroup.DELETE("/:id", app.DeleteAlertRule) // 删除告警规则

	// 告警记录管理
	recordGroup := rulesRouterGroup.Group("/records")
	{
		recordGroup.GET("", app.GetAlertRecordList)              // 获取告警记录列表（支持统计视图）
		recordGroup.GET("/activation", app.GetActiveAlerts)      // 获取当前活跃的告警
		recordGroup.GET("/aggregation", app.GetAlertAggregation) // 获取告警聚合信息
		recordGroup.GET("/statistics", app.GetAlertStatistics)
	}
}
