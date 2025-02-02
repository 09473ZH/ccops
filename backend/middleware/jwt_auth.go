package middleware

import (
	"ccops/models/res"
	"ccops/utils/jwts"
	"github.com/gin-gonic/gin"
	"strings"
)

func JwtUser() gin.HandlerFunc {
	return func(c *gin.Context) {
		var token string

		if c.IsWebsocket() {
			token = c.Query("token")
		} else {
			token = extractToken(c)
		}

		if token == "" {
			handleHandshakeError(c, "token为空")
			return
		}

		claims, err := jwts.ParseToken(token)
		if err != nil {
			if err == jwts.ErrTokenExpired {
				handleHandshakeError(c, "token已过期")
			} else {
				handleHandshakeError(c, "token错误")
			}
			return
		}

		c.Set("claims", claims)
	}
}

func handleHandshakeError(c *gin.Context, message string) {
	// 在WebSocket握手阶段返回HTTP错误响应
	c.JSON(400, gin.H{"code": res.Error, "data": map[string]any{}, "msg": message})
	c.Abort()
}

// extractToken 从请求头中提取token
func extractToken(c *gin.Context) string {
	token := c.Request.Header.Get("Authorization")
	if token == "" {
		return ""
	}

	// 强制要求使用Bearer token格式
	parts := strings.SplitN(token, " ", 2)
	if len(parts) != 2 || parts[0] != "Bearer" {
		return ""
	}

	return parts[1]
}
