package router

import (
	"ccops/api"
)

func (router RouterGroup) TaskRouter() {
	app := api.ApiGroupApp.TaskApi
	//router.Use(middleware.JwtUser())

	router.POST("task", app.TaskCreateView)
	router.GET("task", app.TaskListView)
	router.GET("task/:id", app.TaskInfoView)
	router.DELETE("task/:id", app.TaskRemove)

}
