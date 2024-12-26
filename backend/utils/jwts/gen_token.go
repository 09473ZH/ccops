package jwts

import (
	"ccops/global"
	"github.com/dgrijalva/jwt-go/v4"
	"time"
)

// GenToken 生成访问令牌和刷新令牌
func GenToken(user JwtPayLoad) (*TokenPair, error) {
	MySecret = []byte(global.Config.Jwt.Secret)

	// 生成访问令牌
	accessToken, err := generateAccessToken(user)
	if err != nil {
		return nil, err
	}

	// 生成刷新令牌
	refreshToken, err := generateRefreshToken(user)
	if err != nil {
		return nil, err
	}

	return &TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

// generateAccessToken 生成访问令牌
func generateAccessToken(user JwtPayLoad) (string, error) {
	claim := CustomClaims{
		user,
		jwt.StandardClaims{
			ExpiresAt: jwt.At(time.Now().Add(time.Hour * time.Duration(global.Config.Jwt.AccessExpires))), // 访问令牌30分钟过期
			Issuer:    global.Config.Jwt.Issuer,
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claim)
	return token.SignedString(MySecret)
}

// generateRefreshToken 生成刷新令牌
func generateRefreshToken(user JwtPayLoad) (string, error) {
	claim := CustomClaims{
		user,
		jwt.StandardClaims{
			ExpiresAt: jwt.At(time.Now().Add(time.Hour * time.Duration(global.Config.Jwt.RefreshExpires))), // 刷新令牌7天过期
			Issuer:    global.Config.Jwt.Issuer,
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claim)
	return token.SignedString(MySecret)
}
