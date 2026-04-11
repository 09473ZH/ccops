package router

import (
	"ccops/global"
	"ccops/middleware"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type RouterGroup struct {
	*gin.RouterGroup
}

// resolveCorsOrigins picks the CORS origin whitelist from environment config.
// CCOPS_ALLOWED_ORIGINS takes a comma-separated list (e.g.
// "https://ccops.corgi.plus,https://admin.corgi.plus"). If unset, we fall back
// to a localhost-only whitelist and log a prominent warning — this keeps local
// dev working without reopening the "AllowAllOrigins: true" hole.
func resolveCorsOrigins() []string {
	raw := os.Getenv("CCOPS_ALLOWED_ORIGINS")
	if raw == "" {
		log.Println("WARNING: CCOPS_ALLOWED_ORIGINS is not set, falling back to localhost-only CORS whitelist. " +
			"Set CCOPS_ALLOWED_ORIGINS=https://your.domain in production.")
		return []string{
			"http://localhost:1090",
			"http://localhost:3000",
			"http://localhost:5173",
			"http://127.0.0.1:1090",
			"http://127.0.0.1:3000",
			"http://127.0.0.1:5173",
		}
	}
	parts := strings.Split(raw, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if trimmed := strings.TrimSpace(p); trimmed != "" {
			out = append(out, trimmed)
		}
	}
	return out
}

func InitRouter() *gin.Engine {
	gin.SetMode(global.Config.System.Env)
	router := gin.Default()

	router.Use(middleware.SecurityHeaders())

	router.Use(cors.New(cors.Config{
		AllowOrigins:     resolveCorsOrigins(),
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "Accept", "X-Requested-With", "baggage", "sentry-trace", "X-Refresh-Token"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
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
	ruleRouterGroup := apiRouterGroup.Group("alert_rules")
	notificationRouterGroup := apiRouterGroup.Group("notifications")
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
	routerGroupApp.NotificationRouter(notificationRouterGroup)

	return router
}
