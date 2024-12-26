package config

type Jwt struct {
	Secret         string `json:"secret" yaml:"secret"`                  // 密钥
	AccessExpires  int    `json:"expires" yaml:"accessExpires"`          // 过期时间
	RefreshExpires int    `json:"refresh_expires" yaml:"refreshExpires"` // 刷新过期时间
	Issuer         string `json:"issuer" yaml:"issuer"`                  // 颁发人

}
