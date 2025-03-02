package router

import (
	"ccops/api"
	"ccops/middleware"

	"github.com/gin-gonic/gin"
)

func (router RouterGroup) LabelRouter(labelRouterGroup *gin.RouterGroup) {
	app := api.ApiGroupApp.LabelApi
	labelRouterGroup.Use(middleware.JwtUser())
	labelRouterGroup.POST("", app.HostLabelCreate)
	labelRouterGroup.GET("", app.HostLabelList)
	labelRouterGroup.PUT("/:id", app.HostLabelUpdateView)
	labelRouterGroup.DELETE("/:id", app.HostLabelRemoveView)

	labelRouterGroup.POST("/:id/unbind_all_hosts", app.LabelDisassociateView)

}
