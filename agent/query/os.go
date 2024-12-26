package query

import (
	"errors"
	"runtime"
)

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
