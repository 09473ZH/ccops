package router

import (
	"ccops/api"
	"ccops/middleware"

	"github.com/gin-gonic/gin"
)

func (router RouterGroup) HostRouter(hostRouterGroup *gin.RouterGroup) {
	app := api.ApiGroupApp.HostsApi

	hostRouterGroup.Use(middleware.JwtUser())
	hostRouterGroup.GET("/:id/terminal", app.HandleWebSocket)
	hostRouterGroup.GET("", app.HostListView)
	hostRouterGroup.GET("/:id", app.HostInfoView)
	hostRouterGroup.DELETE("", app.HostRemoveView)
	hostRouterGroup.GET("install", app.HostInstall)
	hostRouterGroup.POST("refresh", app.HostFlushInfoView)
	hostRouterGroup.POST("rename", app.HostRename)
	hostRouterGroup.POST("assign_labels", app.AssignLabelsToHost)
	hostRouterGroup.POST("/:id/unlabel", app.LabelDisassociateView)
	hostRouterGroup.GET("my", app.PermissionHosts)
	hostRouterGroup.GET("search", app.HostSearch)
}
