package router

import (
	"ccops/api"
	"ccops/middleware"

	"github.com/gin-gonic/gin"
)

func (router RouterGroup) HostRouter(hostRouterGroup *gin.RouterGroup) {
	app := api.ApiGroupApp.HostsApi

	hostRouterGroup.Use(middleware.JwtUser())
	hostRouterGroup.GET("web_shell/:id", app.HandleWebSocket)
	hostRouterGroup.GET("", app.HostListView)
	hostRouterGroup.GET("/:id", app.HostInfoView)
	hostRouterGroup.DELETE("", app.HostRemoveView)
	hostRouterGroup.GET("install", app.HostInstall)
	hostRouterGroup.POST("flush", app.HostFlushInfoView)
	hostRouterGroup.POST("rename", app.HostRename)
	hostRouterGroup.POST("label_create", app.HostLabelCreate)
	hostRouterGroup.POST("assign_labels", app.AssignLabelsToHost)
	hostRouterGroup.GET("label_list", app.HostLabelList)
	hostRouterGroup.PUT("label_update/:id/", app.HostLabelUpdateView)
	hostRouterGroup.DELETE("label/:id/", app.HostLabelRemoveView)
	hostRouterGroup.PUT("label_disassociate/:id/", app.LabelDisassociateView)
	hostRouterGroup.GET("my", app.PermissionHosts)
	hostRouterGroup.GET("search", app.HostSearch)
}
