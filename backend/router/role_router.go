package router

import (
	"ccops/api"
	"ccops/middleware"

	"github.com/gin-gonic/gin"
)

func (router RouterGroup) RoleRouter(roleRouterGroup *gin.RouterGroup) {
	app := api.ApiGroupApp.RoleApi
	roleRouterGroup.Use(middleware.JwtUser())
	roleRouterGroup.POST("role", app.CreateRoleView)
	roleRouterGroup.GET("role_list", app.RoleList)
	roleRouterGroup.GET("role/:id/revision", app.RoleRevisionListView) //某配置下所有版本
	roleRouterGroup.GET("role/:id/draft_revision", app.RoleDraftRevisionInfoView)
	roleRouterGroup.GET("role/:id/active_revision", app.RoleActiveRevisionInfoView)
	roleRouterGroup.PUT("role/:id", app.RoleUpdateView)
	roleRouterGroup.DELETE("role/:id", app.RoleRemove)
}
