package core

import (
	"ccops/global"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"log"
	"os"
)

// weakJwtSecrets are default/example values shipped with the repo that must
// never be used in a real deployment. If any of these is configured, startup
// must fail loudly.
var weakJwtSecrets = map[string]bool{
	"":          true,
	"xxx":       true,
	"xx":        true,
	"secret":    true,
	"change-me": true,
}

const minJwtSecretLength = 32

// InitJwtSecret validates (and optionally overrides) the JWT secret at startup.
//
// Order of resolution:
//  1. CCOPS_JWT_SECRET env var — takes precedence over the yaml config so ops
//     can rotate without committing a file.
//  2. jwt.secret from the loaded yaml config.
//
// The resolved secret must be at least 32 characters and not match a known
// weak default. If the env var is explicitly set to "generate", a random 48-
// byte secret is generated, installed for this process, and logged once.
// Running the server with a weak secret is refused — tokens signed with a
// 3-character secret are trivially forgeable.
func InitJwtSecret() error {
	if env := os.Getenv("CCOPS_JWT_SECRET"); env != "" {
		if env == "generate" {
			env = generateJwtSecret()
			log.Println("=====================================================================")
			log.Println("CCOPS JWT SECRET (ephemeral, tokens will be invalidated on restart):")
			log.Printf("    %s", env)
			log.Println("Set CCOPS_JWT_SECRET or jwt.secret in your config to persist this.")
			log.Println("=====================================================================")
		}
		global.Config.Jwt.Secret = env
	}

	secret := global.Config.Jwt.Secret
	if weakJwtSecrets[secret] {
		return errors.New("jwt.secret is set to a known weak/default value — refusing to start. " +
			"Set CCOPS_JWT_SECRET env var or jwt.secret in config to a strong random value (>=32 chars), " +
			"or set CCOPS_JWT_SECRET=generate to generate one on startup")
	}
	if len(secret) < minJwtSecretLength {
		return errors.New("jwt.secret is too short — refusing to start. " +
			"Use at least 32 characters (set CCOPS_JWT_SECRET or jwt.secret in config), " +
			"or set CCOPS_JWT_SECRET=generate")
	}
	return nil
}

func generateJwtSecret() string {
	buf := make([]byte, 48)
	if _, err := rand.Read(buf); err != nil {
		log.Fatalf("failed to generate jwt secret: %v", err)
	}
	return base64.RawURLEncoding.EncodeToString(buf)
}
