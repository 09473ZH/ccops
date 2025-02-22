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

// ValidatePasswordFormat 验证密码复杂度
// 要求：
// 1. 长度至少8位
// 2. 必须包含字母和数字
func ValidatePasswordFormat(password string) bool {
	// 检查长度是否至少8位
	if len(password) < 8 {
		return false
	}

	// 定义密码规则
	var (
		hasLetter = regexp.MustCompile(`[a-zA-Z]`).MatchString(password)
		hasNumber = regexp.MustCompile(`[0-9]`).MatchString(password)
	)

	// 必须同时满足包含字母和数字
	return hasLetter && hasNumber
}
