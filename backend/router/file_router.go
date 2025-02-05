package router

import (
	"ccops/api"
	"ccops/middleware"

	"github.com/gin-gonic/gin"
)

func (router RouterGroup) FileRouter(fileRouterGroup *gin.RouterGroup) {
	app := api.ApiGroupApp.FileApi
	fileRouterGroup.Use(middleware.JwtUser())
	fileRouterGroup.POST("upload", app.FilesUploadView)
	fileRouterGroup.GET("", app.FileListView)
	fileRouterGroup.DELETE("", app.FileRemoveView)
	fileRouterGroup.GET("/:id/download", app.FilesDownloadView)
	fileRouterGroup.GET("preview", app.GetFileContent)
	fileRouterGroup.PUT("", app.UpdateFileContent)
}
