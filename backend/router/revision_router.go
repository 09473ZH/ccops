package router

import (
	"ccops/api"
	"ccops/middleware"
)

func (router RouterGroup) RevisionRouter() {
	app := api.ApiGroupApp.RoleRevisionApi
	router.Use(middleware.JwtUser())

	router.PUT("role_revision/:id", app.RevisionFlush)
	router.POST("role_revision/:id/release", app.RevisionReleaseView)
	router.POST("role_revision/:id/active", app.RoleActiveSwitch)
	router.GET("role_revision/:id", app.RoleRevisionInfo)
	router.DELETE("role_revision/:id", app.RoleRevisionRemove)
	router.POST("role_revision/ai", app.GenerateAnsibleRole)

}
