package api

import (
	"agent/web/request"
	"github.com/gin-gonic/gin"
)

//客户端发来请求更新os数据

func OsToServer(c *gin.Context) {

	err := request.SendHostInfoRequest()
	if err != nil {
		c.JSON(500, gin.H{
			"message": "请求失败",
		})
	}
	c.JSON(200, gin.H{
		"message": "更新中",
	})
}
