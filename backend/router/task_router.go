package router

import (
	"ccops/api"
	"ccops/middleware"

	"github.com/gin-gonic/gin"
)

func (router RouterGroup) TaskRouter(taskRouterGroup *gin.RouterGroup) {
	app := api.ApiGroupApp.TaskApi
	taskRouterGroup.Use(middleware.JwtUser())
	taskRouterGroup.POST("", app.TaskCreateView)
	taskRouterGroup.GET("", app.TaskListView)
	taskRouterGroup.GET("/:id", app.TaskInfoView)
	taskRouterGroup.DELETE("/:id", app.TaskRemove)
	taskRouterGroup.GET("/:id/message", app.WebSocketHandler)
}
