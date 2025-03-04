package router

import (
	"ccops/api"
	"ccops/middleware"

	"github.com/gin-gonic/gin"
)

func (router RouterGroup) UserRouter(userRouterGroup *gin.RouterGroup) {
	app := api.ApiGroupApp.UserApi
	userRouterGroup.Use(middleware.JwtUser())
	userRouterGroup.POST("me/initialize", app.InitUserPassword)
	userRouterGroup.POST("/:id/reset_password", app.ResetUserPasswordByAdmin)
	userRouterGroup.POST("me/reset_password", app.ResetUserPassword)
	userRouterGroup.GET("/:id/permissions", app.UserPermissionInfoView)
	userRouterGroup.POST("/:id/permissions", app.AssignPermission)
	userRouterGroup.POST("", app.UserCreate)
	userRouterGroup.PUT("/:id/status", app.UserDisable)
	userRouterGroup.DELETE("/:id", app.UserDelete)
	userRouterGroup.GET("", app.UserList)
	userRouterGroup.GET("me", app.UserMY)
}
