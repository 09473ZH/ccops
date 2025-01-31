package router

import (
	"ccops/api/task_api"

	// "ccops/middleware"

	"github.com/gin-gonic/gin"
)

func (router RouterGroup) CoreRouter(coreRouterGroup *gin.RouterGroup) {
	coreRouterGroup.GET("/task/:id/message", task_api.WebSocketHandler)
}
