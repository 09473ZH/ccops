package router

import (
	"ccops/api/task_api"
	"ccops/middleware"

	// "ccops/middleware"

	"github.com/gin-gonic/gin"
)

func (router RouterGroup) CoreRouter(coreRouterGroup *gin.RouterGroup) {
	coreRouterGroup.Use(middleware.JwtUser())
	coreRouterGroup.GET("/task/:id/message", task_api.WebSocketHandler)
}
