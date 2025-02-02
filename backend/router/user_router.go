package router

import (
	"ccops/api"
	"ccops/middleware"

	"github.com/gin-gonic/gin"
)

func (router RouterGroup) UserRouter(userRouterGroup *gin.RouterGroup) {
	app := api.ApiGroupApp.UserApi
	userRouterGroup.PUT("change_password/:id", app.ChangePassword)
	userRouterGroup.POST("login", app.UserLoginView)
	userRouterGroup.POST("refresh", app.RefreshTokenView)
	userRouterGroup.Use(middleware.JwtUser())
	userRouterGroup.GET("permission_info/:id", app.UserPermissionInfoView)
	userRouterGroup.PUT("assign_permission", app.AssignPermission)
	userRouterGroup.POST("user_create", app.UserCreate)
	userRouterGroup.PUT("user_disable/:id", app.UserDisable)
	userRouterGroup.DELETE("user_delete/:id", app.UserDelete)
	userRouterGroup.GET("user_list", app.UserList)

}
