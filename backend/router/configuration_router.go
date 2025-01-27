package router

import (
	"ccops/api"
	"ccops/middleware"

	"github.com/gin-gonic/gin"
)

func (router RouterGroup) ConfigurationRouter(configurationRouterGroup *gin.RouterGroup) {
	app := api.ApiGroupApp.ConfigurationApi
	configurationRouterGroup.GET("/authorized_keys", app.UserKeyInfo)
	configurationRouterGroup.GET("/configuration", app.ConfigurationListView)
	configurationRouterGroup.Use(middleware.JwtUser())
	configurationRouterGroup.PUT("/configuration", app.ConfigurationUpdateView)
}
