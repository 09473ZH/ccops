package router

import (
	"ccops/api"
	"ccops/middleware"

	"github.com/gin-gonic/gin"
)

func (router RouterGroup) FileRouter(fileRouterGroup *gin.RouterGroup) {
	app := api.ApiGroupApp.FileApi
	fileRouterGroup.Use(middleware.JwtUser())
	fileRouterGroup.POST("uploads", app.FilesUploadView)
	fileRouterGroup.GET("files", app.FileListView)
	fileRouterGroup.DELETE("files", app.FileRemoveView)
	fileRouterGroup.GET("file_download/:id", app.FilesDownloadView)
	fileRouterGroup.GET("file_preview", app.GetFileContent)
	fileRouterGroup.PUT("file", app.UpdateFileContent)
}
