package api

import (
	"agent/update"
	"agent/web/request"
	"net/http"

	"github.com/gin-gonic/gin"
)

type HostNameRequest struct {
	HostName      string `json:"hostname"`
	HostServerUrl string `json:"hostServerUrl"`
}

type SelfUpgradeRequest struct {
	Url string `json:"url"`
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

func SelfUpgrade(c *gin.Context) {
	var request SelfUpgradeRequest

	// 绑定请求参数
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	update.SelfUpgrade(request.Url)
	c.JSON(200, gin.H{
		"message": "即将开始更新",
	})
}
