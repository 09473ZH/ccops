package router

import (
	"ccops/api"
	"ccops/middleware"

	"github.com/gin-gonic/gin"
)

func (router RouterGroup) AIAssistantRouter(AIAssistantRouterGroup *gin.RouterGroup) {
	app := api.ApiGroupApp.AIAssistantApi
	AIAssistantRouterGroup.Use(middleware.JwtUser())
	AIAssistantRouterGroup.POST("ansible_chat", app.GenerateAnsibleRole)
	AIAssistantRouterGroup.POST("command_complete", app.CommandCompleteView)
}
