package router

import (
	"ccops/api"
)

func (router RouterGroup) ConfigurationRouter() {
	app := api.ApiGroupApp.ConfigurationApi
	//router.Use(middleware.JwtUser())
	router.GET("/configuration", app.ConfigurationListView)
	router.PUT("/configuration", app.ConfigurationUpdateView)
	router.GET("/authorized_keys", app.UserKeyInfo)

}
