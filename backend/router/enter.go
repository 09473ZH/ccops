package router

import (
	"ccops/global"
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
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

	// 为每个路由组创建单独的 RouterGroup，前缀为空字符串

	authRouterGroup := apiRouterGroup.Group("auth")
	userRouterGroup := apiRouterGroup.Group("users")
	LabelRouterGroup := apiRouterGroup.Group("labels")
	fileRouterGroup := apiRouterGroup.Group("files")
	hostRouterGroup := apiRouterGroup.Group("hosts")
	clientRouterGroup := apiRouterGroup.Group("client")
	roleRouterGroup := apiRouterGroup.Group("roles")
	taskRouterGroup := apiRouterGroup.Group("tasks")
	revisionRouterGroup := apiRouterGroup.Group("role_revisions")
	configurationRouterGroup := apiRouterGroup.Group("configurations")
	ruleRouterGroup := apiRouterGroup.Group("alert/rules")

	routerGroupApp := RouterGroup{apiRouterGroup}

	// 使用不同的路由组
	routerGroupApp.UserRouter(userRouterGroup)
	routerGroupApp.LabelRouter(LabelRouterGroup)
	routerGroupApp.FileRouter(fileRouterGroup)
	routerGroupApp.HostRouter(hostRouterGroup)
	routerGroupApp.ClientRouter(clientRouterGroup)
	routerGroupApp.RoleRouter(roleRouterGroup)
	routerGroupApp.TaskRouter(taskRouterGroup)
	routerGroupApp.RevisionRouter(revisionRouterGroup)
	routerGroupApp.ConfigurationRouter(configurationRouterGroup)
	routerGroupApp.AuthRouter(authRouterGroup)
	routerGroupApp.RulesRouter(ruleRouterGroup)

	return router
}
