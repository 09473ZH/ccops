package router

import (
	"ccops/api"
	"ccops/middleware"
)

func (router RouterGroup) HostRouter() {
	app := api.ApiGroupApp.HostsApi

	router.GET("host_web_shell/:id", app.HandleWebSocket)

	router.Use(middleware.JwtUser())
	router.GET("host_list", app.HostListView)
	router.GET("host/:id/", app.HostInfoView)
	router.DELETE("host", app.HostRemoveView)
	router.GET("install", app.HostInstall)
	router.POST("host_flush", app.HostFlushInfoView)
	router.POST("host_rename", app.HostRename)
	router.POST("host_label_create", app.HostLabelCreate)
	router.POST("host_assign_labels", app.AssignLabelsToHost)
	router.GET("host_label_list", app.HostLabelList)
	router.PUT("host_label_update/:id/", app.HostLabelUpdateView)
	router.DELETE("host_label/:id/", app.HostLabelRemoveView)
	router.PUT("host_label_disassociate/:id/", app.LabelDisassociateView)

}
