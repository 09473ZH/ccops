package router

import (
	"ccops/api"
	"ccops/middleware"

	"github.com/gin-gonic/gin"
)

func (router RouterGroup) ConfigurationRouter(configurationRouterGroup *gin.RouterGroup) {
	app := api.ApiGroupApp.ConfigurationApi
	configurationRouterGroup.GET("/authorized_keys", app.UserKeyInfo)
	configurationRouterGroup.GET("", app.ConfigurationListView)
	configurationRouterGroup.Use(middleware.JwtUser())
	configurationRouterGroup.POST("batch_update", app.ConfigurationUpdateView)
}
