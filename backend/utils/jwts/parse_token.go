package jwts

import (
	"ccops/global"
	"errors"
	"github.com/dgrijalva/jwt-go/v4"
	"strings"
)

var (
	ErrTokenExpired = errors.New("token has expired")
	ErrInvalidToken = errors.New("invalid token")
)

// ParseToken 解析 token
func ParseToken(tokenStr string) (*CustomClaims, error) {
	MySecret = []byte(global.Config.Jwt.Secret)
	token, err := jwt.ParseWithClaims(tokenStr, &CustomClaims{}, func(token *jwt.Token) (interface{}, error) {
		return MySecret, nil
	})

	if err != nil {
		// 通过错误信息字符串判断是否是过期错误
		if strings.Contains(err.Error(), "expired") {
			return nil, ErrTokenExpired
		}
		return nil, err
	}

	claims, ok := token.Claims.(*CustomClaims)
	if ok && token.Valid {
		return claims, nil
	}
	return nil, ErrInvalidToken
}

// RefreshAccessToken 使用刷新令牌生成新的访问令牌
func RefreshAccessToken(refreshToken string) (string, error) {
	claims, err := ParseToken(refreshToken)
	if err != nil {
		return "", err
	}

	// 生成新的访问令牌
	return generateAccessToken(claims.JwtPayLoad)
}
