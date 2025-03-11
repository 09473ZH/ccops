package router

import "agent/web/api"

// 服务端主动请求更新数据
func (router RouterGroup) RegisterHealth() {
	router.GET("/os", api.OsToServer)
}
