package router

import "ccops/api"

func (router RouterGroup) ClientRouter() {
	app := api.ApiGroupApp.ClientApi

	router.POST("client/receive", app.ClientInfoReceive)
	router.GET("client/public_key", app.GetPublicKey)
}
