package middleware

import (
	"ccops/utils/jwts"
	"github.com/gin-gonic/gin"
	"strings"
)

func JwtUser() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := extractToken(c)
		if token == "" {
			c.JSON(401, gin.H{"code": 401, "data": map[string]any{}, "msg": "token为空"})
			c.Abort()
			return
		}

		claims, err := jwts.ParseToken(token)
		if err == jwts.ErrTokenExpired {
			c.JSON(401, gin.H{"code": 401, "data": map[string]any{}, "msg": "token已过期"})
			c.Abort()
			return
		} else if err != nil {

			c.JSON(401, gin.H{"code": 401, "data": map[string]any{}, "msg": "token错误"})
			c.Abort()
			return
		}

		c.Set("claims", claims)
	}
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
