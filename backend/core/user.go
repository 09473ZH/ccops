package core

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/ctype"
	"ccops/utils/pwd"
	"crypto/rand"
	"encoding/base64"
	"log"
	"os"
)

// InitUser creates the initial admin user if none exists.
//
// The initial password is read from the CCOPS_INITIAL_ADMIN_PASSWORD environment
// variable. If that is not set, a cryptographically random password is generated
// and printed to the startup log exactly once — operators must grab it from the
// logs on first boot. The user is created with IsInit=false so the frontend
// forces a password change on first login.
func InitUser() {
	var user models.UserModel
	global.DB.Model(&models.UserModel{}).Where("username = ?", "admin").First(&user)

	if user.ID != 0 {
		// Admin already provisioned — but an older build created the account with
		// the hardcoded "admin" password. Detect and rotate legacy installs so the
		// default credential can never be used to log in again.
		if pwd.CheckPwd(user.Password, "admin") {
			newPassword := loadOrGenerateAdminPassword("legacy default password detected, rotating")
			global.DB.Model(&user).Updates(map[string]interface{}{
				"password": pwd.HashPwd(newPassword),
				"is_init":  false,
			})
		}
		return
	}

	initialPassword := loadOrGenerateAdminPassword("")
	global.DB.Create(&models.UserModel{
		Username:  "admin",
		Password:  pwd.HashPwd(initialPassword),
		Role:      ctype.PermissionAdmin,
		IsInit:    false,
		IsEnabled: true,
	})
}

// loadOrGenerateAdminPassword reads the initial admin password from the
// CCOPS_INITIAL_ADMIN_PASSWORD env var, falling back to a random 24-char
// credential that is logged to stdout exactly once. The reason argument is a
// short context string included in the banner ("" for fresh installs).
func loadOrGenerateAdminPassword(reason string) string {
	if envPassword := os.Getenv("CCOPS_INITIAL_ADMIN_PASSWORD"); envPassword != "" {
		log.Println("Initial admin password loaded from CCOPS_INITIAL_ADMIN_PASSWORD env var")
		return envPassword
	}
	generated := generateRandomPassword()
	log.Println("=====================================================================")
	if reason != "" {
		log.Printf("CCOPS ADMIN PASSWORD ROTATION (%s)", reason)
	} else {
		log.Println("CCOPS INITIAL ADMIN PASSWORD (save this, it will not be shown again)")
	}
	log.Printf("    username: admin")
	log.Printf("    password: %s", generated)
	log.Println("You will be required to change this password on first login.")
	log.Println("=====================================================================")
	return generated
}

// generateRandomPassword returns a 24-character base64-urlsafe password.
func generateRandomPassword() string {
	buf := make([]byte, 18)
	if _, err := rand.Read(buf); err != nil {
		log.Fatalf("failed to generate random admin password: %v", err)
	}
	return base64.RawURLEncoding.EncodeToString(buf)
}
