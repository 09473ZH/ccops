package router

import (
	"ccops/api"
	"ccops/api/task_api"
	"ccops/middleware"

	"github.com/gin-gonic/gin"
)

func (router RouterGroup) CoreRouter(coreRouterGroup *gin.RouterGroup) {
	app := api.ApiGroupApp.CoreApi
	coreRouterGroup.Use(middleware.JwtUser())
	coreRouterGroup.GET("core", app.ChatGroupView)
	coreRouterGroup.GET("/task/:id/message", task_api.WebSocketHandler)
}
