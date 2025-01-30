package router

import (
	"ccops/api"

	"github.com/gin-gonic/gin"
)

func (router RouterGroup) ClientRouter(clientRouterGroup *gin.RouterGroup) {
	app := api.ApiGroupApp.ClientApi
	clientRouterGroup.POST("client/receive", app.ClientInfoReceive)
	clientRouterGroup.GET("client/public_key", app.GetPublicKey)
}
