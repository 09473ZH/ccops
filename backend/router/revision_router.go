package router

import (
	"ccops/api"
	"ccops/middleware"

	"github.com/gin-gonic/gin"
)

func (router RouterGroup) RevisionRouter(revisionRouterGroup *gin.RouterGroup) {
	app := api.ApiGroupApp.RoleRevisionApi
	revisionRouterGroup.Use(middleware.JwtUser())
	revisionRouterGroup.PUT("role_revision/:id", app.RevisionFlush)
	revisionRouterGroup.POST("role_revision/:id/release", app.RevisionReleaseView)
	revisionRouterGroup.POST("role_revision/:id/active", app.RoleActiveSwitch)
	revisionRouterGroup.GET("role_revision/:id", app.RoleRevisionInfo)
	revisionRouterGroup.DELETE("role_revision/:id", app.RoleRevisionRemove)
	revisionRouterGroup.POST("role_revision/ai", app.GenerateAnsibleRole)

}
