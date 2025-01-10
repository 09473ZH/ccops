package router

import (
	"ccops/api"
	"ccops/middleware"
)

func (router RouterGroup) FileRouter() {
	app := api.ApiGroupApp.FileApi
	router.Use(middleware.JwtUser())

	router.POST("uploads", app.FilesUploadView)
	router.GET("files", app.FileListView)
	router.DELETE("files", app.FileRemoveView)
	router.GET("file_download/:id", app.FilesDownloadView)
	router.GET("file_preview", app.GetFileContent)
	router.PUT("file", app.UpdateFileContent)
}
