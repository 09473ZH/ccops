package jwts

import (
	"github.com/dgrijalva/jwt-go/v4"
)

var MySecret []byte

// JwtPayLoad 载荷
type JwtPayLoad struct {
	UserID   uint   `json:"userId"`
	Username string `json:"username"`
	Role     int    `json:"role"`
}

// CustomClaims 自定义声明
type CustomClaims struct {
	JwtPayLoad
	jwt.StandardClaims
}

type TokenPair struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
}
