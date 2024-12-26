package router

import "agent/web/api"

// 服务端主动请求更新数据
func (router RouterGroup) InfoRouter() {
	router.POST("/rename", api.HostRename)
}
