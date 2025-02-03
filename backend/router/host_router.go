package router

import (
	"ccops/api"
	"ccops/middleware"

	"github.com/gin-gonic/gin"
)

func (router RouterGroup) HostRouter(hostRouterGroup *gin.RouterGroup) {
	app := api.ApiGroupApp.HostsApi

	hostRouterGroup.Use(middleware.JwtUser())
	hostRouterGroup.GET("host_web_shell/:id", app.HandleWebSocket)
	hostRouterGroup.GET("host_list", app.HostListView)
	hostRouterGroup.GET("host/:id/", app.HostInfoView)
	hostRouterGroup.DELETE("host", app.HostRemoveView)
	hostRouterGroup.GET("install", app.HostInstall)
	hostRouterGroup.POST("host_flush", app.HostFlushInfoView)
	hostRouterGroup.POST("host_rename", app.HostRename)
	hostRouterGroup.POST("host_label_create", app.HostLabelCreate)
	hostRouterGroup.POST("host_assign_labels", app.AssignLabelsToHost)
	hostRouterGroup.GET("host_label_list", app.HostLabelList)
	hostRouterGroup.PUT("host_label_update/:id/", app.HostLabelUpdateView)
	hostRouterGroup.DELETE("host_label/:id/", app.HostLabelRemoveView)
	hostRouterGroup.PUT("host_label_disassociate/:id/", app.LabelDisassociateView)
	hostRouterGroup.GET("host/my", app.PermissionHosts)
	hostRouterGroup.GET("host_search", app.HostSearch)
}
