package router

import (
	"ccops/api"
	"ccops/middleware"

	"github.com/gin-gonic/gin"
)

func (router RouterGroup) UserRouter(userRouterGroup *gin.RouterGroup) {
	app := api.ApiGroupApp.UserApi

	userRouterGroup.POST("login", app.UserLoginView)
	userRouterGroup.POST("refresh", app.RefreshTokenView)
	userRouterGroup.Use(middleware.JwtUser())
	userRouterGroup.GET("permission_info/:id", app.UserPermissionInfoView)
	userRouterGroup.PUT("assign_permission", app.AssignPermission)
}
