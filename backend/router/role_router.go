package router

import (
	"ccops/api"
)

func (router RouterGroup) RoleRouter() {
	app := api.ApiGroupApp.RoleApi
	//router.Use(middleware.JwtUser())

	router.POST("role", app.CreateRoleView)

	router.GET("role_list", app.RoleList)
	router.GET("role/:id/revision", app.RoleRevisionListView) //某配置下所有版本
	router.GET("role/:id/draft_revision", app.RoleDraftRevisionInfoView)
	router.GET("role/:id/active_revision", app.RoleActiveRevisionInfoView)
	router.PUT("role/:id", app.RoleUpdateView)
	router.DELETE("role/:id", app.RoleRemove)
}
