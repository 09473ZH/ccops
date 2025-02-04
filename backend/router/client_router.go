package router

import (
	"ccops/api"

	"github.com/gin-gonic/gin"
)

func (router RouterGroup) ClientRouter(clientRouterGroup *gin.RouterGroup) {
	app := api.ApiGroupApp.ClientApi
	clientRouterGroup.POST("receive", app.ClientInfoReceive)
	clientRouterGroup.GET("public_key", app.GetPublicKey)
}
