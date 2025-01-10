package router

import (
	"ccops/api"
	"ccops/middleware"
)

func (router RouterGroup) UserRouter() {
	app := api.ApiGroupApp.UserApi

	router.POST("login", app.UserLoginView)
	router.POST("/refresh", app.RefreshTokenView)
	router.Use(middleware.JwtUser())
	router.GET("/permission_info/:id", app.UserPermissionInfoView)
	router.PUT("/assign_permission", app.AssignPermission)

}
