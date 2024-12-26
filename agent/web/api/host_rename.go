package api

import (
	"agent/update"
	"net/http"

	"github.com/gin-gonic/gin"
)

type HostNameRequest struct {
	HostName      string `json:"hostname"`
	HostServerUrl string `json:"hostServerUrl"`
}

func HostRename(c *gin.Context) {
	var request HostNameRequest

	// 绑定请求参数
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 调用修改主机名的函数
	err := update.RenameHost(request.HostName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 成功响应
	c.JSON(http.StatusOK, gin.H{"message": "更改成功"})
}
