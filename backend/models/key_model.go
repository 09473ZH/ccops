package models

type KeyModel struct {
	MODEL
	PublicKey  string `gorm:"type:text;comment:公钥" json:"publicKey"`
	PrivateKey string `gorm:"type:text;comment:私钥" json:"privateKey"`
}
