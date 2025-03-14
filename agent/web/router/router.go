package router

import (
	"agent/web/service/cron_ser"
	"github.com/gin-gonic/gin"
	"log"
)

type RouterGroup struct {
	*gin.RouterGroup
}

// StartGin initializes the Gin router and registers all routes.
func StartGin() {
	gin.SetMode(gin.ReleaseMode)
	router := gin.Default()

	apiRouterGroup := router.Group("api")
	routerGroupApp := RouterGroup{apiRouterGroup}

	routerGroupApp.RegisterHealth()
	routerGroupApp.InfoRouter()

	go cron_ser.StartOsqueryReport()
	go cron_ser.StartPollingPublicKey()
	go cron_ser.StartMetricsCollection()

	if err := router.Run(":41541"); err != nil {
		log.Fatalf("Gin 服务器启动失败: %v", err)
	}
}
