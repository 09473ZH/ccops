package router

import (
	"ccops/api"
	"ccops/middleware"

	"github.com/gin-gonic/gin"
)

func (router RouterGroup) TaskRouter(taskRouterGroup *gin.RouterGroup) {
	app := api.ApiGroupApp.TaskApi
	taskRouterGroup.Use(middleware.JwtUser())
	taskRouterGroup.POST("task", app.TaskCreateView)
	taskRouterGroup.GET("task", app.TaskListView)
	taskRouterGroup.GET("task/:id", app.TaskInfoView)
	taskRouterGroup.DELETE("task/:id", app.TaskRemove)
}
