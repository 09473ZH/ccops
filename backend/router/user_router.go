package router

import (
	"ccops/api"
)

func (router RouterGroup) UserRouter() {
	app := api.ApiGroupApp.UserApi

	router.POST("login", app.UserLoginView)
	router.POST("/refresh", app.RefreshTokenView)
	//router.Use(middleware.JwtUser())
	router.GET("/info", app.UserInfoView)

}
