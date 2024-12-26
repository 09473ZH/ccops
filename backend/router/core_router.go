package router

import (
	"ccops/api"
	"ccops/api/task_api"
)

func (router RouterGroup) CoreRouter() {
	app := api.ApiGroupApp.CoreApi
	router.GET("core", app.ChatGroupView)
	router.GET("/task/:id/message", task_api.WebSocketHandler)

}
