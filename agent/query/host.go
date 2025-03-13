package query

import (
	"errors"
	"os"
	"runtime"
)

var (
	Version = "0.0.1-alpha3"
)

func GetAgentVersion() string {
	return Version
}

// 获取主机名
func GetHostName() (string, error) {
	// 获取主机名
	hostname, err := os.Hostname()
	if err != nil {
		return "", err
	}
	return hostname, nil
}

func GetOsType() (string, error) {
	// 获取操作系统
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
