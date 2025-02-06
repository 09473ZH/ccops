package auth_api

import (
	"ccops/global"
	"ccops/models/res"
	"ccops/utils/jwts"
	"github.com/gin-gonic/gin"
	"time"
)

type RefreshTokenRequest struct {
	RefreshToken string `json:"refreshToken" binding:"required" msg:"请提供刷新令牌"`
}

// RefreshTokenView 刷新访问令牌
func (AuthApi) RefreshTokenView(c *gin.Context) {
	var req RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		res.FailWithError(err, &req, c)
		return
	}

	// 使用刷新令牌获取新的访问令牌
	newAccessToken, err := jwts.RefreshAccessToken(req.RefreshToken)
	if err != nil {
		if err == jwts.ErrTokenExpired {
			res.FailWithMessage("刷新令牌已过期，请重新登录", c)
			return
		}
		res.FailWithMessage("刷新令牌无效", c)
		return
	}

	response := gin.H{
		"accessToken": newAccessToken,
		"expireAt":    time.Now().Add(time.Hour * time.Duration(global.Config.Jwt.AccessExpires)).Unix(),
	}

	res.OkWithData(response, c)
}
