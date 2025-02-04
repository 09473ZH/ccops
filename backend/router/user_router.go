package router

import (
	"ccops/api"
	"ccops/middleware"

	"github.com/gin-gonic/gin"
)

func (router RouterGroup) UserRouter(userRouterGroup *gin.RouterGroup) {
	app := api.ApiGroupApp.UserApi
	userRouterGroup.Use(middleware.JwtUser())
	userRouterGroup.POST("password_reset", app.ChangeUserPassword)
	userRouterGroup.POST("/admin/:id/password_reset", app.ResetUserPasswordByAdmin)
	userRouterGroup.GET("permission_info/:id", app.UserPermissionInfoView)
	userRouterGroup.PUT("assign_permission", app.AssignPermission)
	userRouterGroup.POST("", app.UserCreate)
	userRouterGroup.PUT("disable/:id", app.UserDisable)
	userRouterGroup.DELETE("delete/:id", app.UserDelete)
	userRouterGroup.GET("", app.UserList)
	userRouterGroup.GET("my", app.UserMY)

}
