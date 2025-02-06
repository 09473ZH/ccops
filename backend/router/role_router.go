package router

import (
	"ccops/api"
	"ccops/middleware"

	"github.com/gin-gonic/gin"
)

func (router RouterGroup) RoleRouter(roleRouterGroup *gin.RouterGroup) {
	app := api.ApiGroupApp.RoleApi
	roleRouterGroup.Use(middleware.JwtUser())
	roleRouterGroup.POST("", app.CreateRoleView)
	roleRouterGroup.GET("", app.RoleList)
	roleRouterGroup.GET("/:id/revision", app.RoleRevisionListView) //某配置下所有版本
	roleRouterGroup.GET("/:id/draft_revision", app.RoleDraftRevisionInfoView)
	roleRouterGroup.GET("/:id/active_revision", app.RoleActiveRevisionInfoView)
	roleRouterGroup.PUT("/:id", app.RoleUpdateView)
	roleRouterGroup.DELETE("/:id", app.RoleRemove)
}
