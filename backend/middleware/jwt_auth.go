package middleware

import (
	"ccops/models/ctype"
	"ccops/models/res"
	"ccops/utils/jwts"
	"github.com/gin-gonic/gin"
	"strings"
)

func JwtUser() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := extractToken(c)
		if token == "" {
			res.FailWithMessage("未携带token", c)
			c.Abort()
			return
		}

		claims, err := jwts.ParseToken(token)
		if err == jwts.ErrTokenExpired {
			res.FailWithMessage("token已过期", c)
			c.Abort()
			return
		} else if err != nil {
			res.FailWithMessage("token错误", c)
			c.Abort()
			return
		}

		c.Set("claims", claims)
	}
}

func JwtAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := extractToken(c)
		if token == "" {
			res.FailWithMessage("未携带token", c)
			c.Abort()
			return
		}

		claims, err := jwts.ParseToken(token)
		if err == jwts.ErrTokenExpired {
			res.FailWithMessage("token已过期", c)
			c.Abort()
			return
		} else if err != nil {
			res.FailWithMessage("token错误", c)
			c.Abort()
			return
		}

		if claims.Role != int(ctype.PermissionAdmin) {
			res.FailWithMessage("权限错误", c)
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
