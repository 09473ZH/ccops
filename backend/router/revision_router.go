package router

import (
	"ccops/api"
	"ccops/middleware"

	"github.com/gin-gonic/gin"
)

func (router RouterGroup) RevisionRouter(revisionRouterGroup *gin.RouterGroup) {
	app := api.ApiGroupApp.RoleRevisionApi
	revisionRouterGroup.Use(middleware.JwtUser())
	revisionRouterGroup.PUT("/:id", app.RevisionFlush)
	revisionRouterGroup.POST("/:id/release", app.RevisionReleaseView)
	revisionRouterGroup.POST("/:id/active", app.RoleActiveSwitch)
	revisionRouterGroup.GET("/:id", app.RoleRevisionInfo)
	revisionRouterGroup.DELETE("/:id", app.RoleRevisionRemove)
	revisionRouterGroup.POST("/ai", app.GenerateAnsibleRole)

}
