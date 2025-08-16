package query

import (
	"errors"
	"os"
	"runtime"
)

// GetHostName 获取主机名
func GetHostName() (string, error) {
	hostname, err := os.Hostname()
	if err != nil {
		return "", err
	}
	return hostname, nil
}

// GetOsType 获取操作系统类型
func GetOsType() (string, error) {
	osType := runtime.GOOS
	switch osType {
	case "linux":
		return "Linux", nil
	case "darwin":
		return "macOS", nil
	case "windows":
		return "Windows", nil
	default:
		return "", errors.New("unsupported OS: " + osType)
	}
}