package pwd

import (
	"log"
	"regexp"

	"golang.org/x/crypto/bcrypt"
)

// HashPwd hash密码
func HashPwd(pwd string) string {
	hash, err := bcrypt.GenerateFromPassword([]byte(pwd), bcrypt.MinCost)
	if err != nil {
		log.Println(err)
	}
	return string(hash)
}

// CheckPwd 验证密码  hash之后的密码  输入的密码
func CheckPwd(hashPwd string, pwd string) bool {
	byteHash := []byte(hashPwd)

	err := bcrypt.CompareHashAndPassword(byteHash, []byte(pwd))
	if err != nil {
		log.Println(err)
		return false
	}
	return true
}

// ValidatePasswordFormat 验证密码是否仅包含小写字母和数字，且长度至少为6位
func ValidatePasswordFormat(password string) bool {
	return regexp.MustCompile(`^[a-z0-9]{6,}$`).MatchString(password)
}
