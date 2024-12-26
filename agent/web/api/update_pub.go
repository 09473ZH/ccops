package api

import (
	"agent/update"
	"github.com/gin-gonic/gin"
	"net/http"
)

//当服务端更改密钥后，client端需要主动更新authorized_keys文件以保持ssh连接通畅

type UpdatePublicKeyReq struct {
	PublicKey string `json:"public_key"`
}

func UpdatePublicKey(c *gin.Context) {
	var cr UpdatePublicKeyReq
	if err := c.ShouldBindJSON(&cr); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	err := update.AddRootPublicKey(cr.PublicKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "success"})

}
