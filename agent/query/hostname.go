package query

import (
	"os"
)

// 获取主机名
func GetHostName() (string, error) {
	// 获取主机名
	hostname, err := os.Hostname()
	if err != nil {
		return "", err
	}
	return hostname, nil
}
