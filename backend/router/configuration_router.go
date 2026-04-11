package router

import (
	"ccops/api"
	"ccops/middleware"

	"github.com/gin-gonic/gin"
)

func (router RouterGroup) ConfigurationRouter(configurationRouterGroup *gin.RouterGroup) {
	app := api.ApiGroupApp.ConfigurationApi
	// All configuration endpoints are admin-only: they expose SSH keys and system settings.
	configurationRouterGroup.Use(middleware.JwtUser(), middleware.JwtAdmin())
	configurationRouterGroup.GET("/authorized_keys", app.UserKeyInfo)
	configurationRouterGroup.GET("", app.ConfigurationListView)
	configurationRouterGroup.POST("batch_update", app.ConfigurationUpdateView)
}
