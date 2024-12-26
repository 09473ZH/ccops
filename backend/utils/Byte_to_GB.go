package utils

func BytesToGB(bytes int64) float64 {
	// 1GB = 1024 * 1024 * 1024 字节
	return float64(bytes) / (1024 * 1024 * 1024)
}
