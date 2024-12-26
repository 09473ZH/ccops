package router

import (
	"ccops/global"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"net/http"
	"time"
)

type RouterGroup struct {
	*gin.RouterGroup
}

func InitRouter() *gin.Engine {
	gin.SetMode(global.Config.System.Env)
	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowAllOrigins: true,                                     // 开放所有请求源
		AllowMethods:    []string{"GET", "POST", "PUT", "DELETE"}, // 允许的方法
		AllowHeaders:    []string{"*"},                            // 允许的 Header
		ExposeHeaders:   []string{"Content-Length"},               // 公开的 Header
		MaxAge:          12 * time.Hour,                           // 预检请求的缓存时间
	}))

	router.StaticFS("static", http.Dir("static"))

	apiRouterGroup := router.Group("api")

	routerGroupApp := RouterGroup{apiRouterGroup}

	routerGroupApp.UserRouter()
	routerGroupApp.CoreRouter()
	routerGroupApp.FileRouter()
	routerGroupApp.HostRouter()
	routerGroupApp.ClientRouter()
	routerGroupApp.RoleRouter()
	routerGroupApp.TaskRouter()
	routerGroupApp.RevisionRouter()
	routerGroupApp.ConfigurationRouter()
	return router
}
