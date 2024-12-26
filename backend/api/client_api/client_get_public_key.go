package client_api

import (
	"ccops/global"
	"ccops/models"
	"github.com/gin-gonic/gin"
	"net/http"
)

// 定义一个结构体来表示公钥的响应格式
type PublicKeyResponse struct {
	PublicKey string `json:"public_key"`
}

func (ClientApi) GetPublicKey(c *gin.Context) {

	var PublicKey string
	global.DB.Model(&models.Configuration{}).Where("field_name = ?", "PublicKey").Select("field_value").First(&PublicKey)

	// 创建响应体
	response := PublicKeyResponse{
		PublicKey: PublicKey,
	}

	// 返回 JSON 响应
	c.JSON(http.StatusOK, response)
}
