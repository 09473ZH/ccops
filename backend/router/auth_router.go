package router

import (
	"ccops/api"

	"github.com/gin-gonic/gin"
)

func (router RouterGroup) AuthRouter(authRouterGroup *gin.RouterGroup) {
	app := api.ApiGroupApp.AuthApi

	authRouterGroup.POST("login", app.UserLoginView)
	authRouterGroup.POST("refresh", app.RefreshTokenView)

}
