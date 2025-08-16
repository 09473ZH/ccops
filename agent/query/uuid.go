package query

import (
	"crypto/md5"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

// getMachineUUID 获取机器UUID
func getMachineUUID() string {
	// 1. 尝试从硬件获取UUID
	if hwUUID := getHardwareUUID(); hwUUID != "" && !isPlaceholderUUID(hwUUID) {
		return hwUUID
	}
	
	// 2. 尝试从多个缓存位置读取
	for _, uuidFile := range getUUIDCachePaths() {
		if data, err := os.ReadFile(uuidFile); err == nil {
			uuid := strings.TrimSpace(string(data))
			if isValidUUID(uuid) {
				return uuid
			}
		}
	}
	
	// 3. 生成新UUID并缓存
	newUUID := generateRandomUUID()
	saveUUIDToCache(newUUID)
	return newUUID
}

// getUUIDCachePaths 获取UUID缓存路径（按优先级）
func getUUIDCachePaths() []string {
	var paths []string
	
	// 1. 统一先尝试系统级目录
	paths = append(paths, "/var/lib/ccops/machine-uuid")
	
	// 2. 用户级目录作为备选
	if homeDir, err := os.UserHomeDir(); err == nil {
		paths = append(paths, filepath.Join(homeDir, ".ccops", "machine-uuid"))
	}
	
	return paths
}

// saveUUIDToCache 保存UUID到缓存文件
func saveUUIDToCache(uuid string) {
	for _, path := range getUUIDCachePaths() {
		// 确保目录存在
		if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
			continue
		}
		
		// 尝试写入文件
		if err := os.WriteFile(path, []byte(uuid), 0644); err == nil {
			return // 成功写入就返回
		}
	}
}

// getHardwareUUID 获取硬件UUID
func getHardwareUUID() string {
	switch runtime.GOOS {
	case "linux":
		if data, err := os.ReadFile("/sys/class/dmi/id/product_uuid"); err == nil {
			uuid := strings.TrimSpace(string(data))
			if isValidUUID(uuid) {
				return uuid
			}
		}
	case "darwin":
		// macOS IOPlatformUUID
		cmd := exec.Command("ioreg", "-rd1", "-c", "IOPlatformExpertDevice")
		if output, err := cmd.Output(); err == nil {
			lines := strings.Split(string(output), "\n")
			for _, line := range lines {
				if strings.Contains(line, "IOPlatformUUID") {
					parts := strings.Split(line, "\"")
					if len(parts) >= 4 {
						return parts[3]
					}
				}
			}
		}
	}
	return ""
}

// isPlaceholderUUID 检查是否为占位符UUID
func isPlaceholderUUID(uuid string) bool {
	placeholders := []string{
		"00000000-0000-0000-0000-000000000000",
		"03000200-0400-0500-0006-000700080009",
		"03020100-0504-0706-0809-0a0b0c0d0e0f", 
		"10000000-0000-8000-0040-000000000000",
	}
	
	lowerUUID := strings.ToLower(uuid)
	for _, placeholder := range placeholders {
		if lowerUUID == placeholder {
			return true
		}
	}
	return false
}

// isValidUUID 检查UUID格式是否有效
func isValidUUID(uuid string) bool {
	if len(uuid) != 36 {
		return false
	}
	parts := strings.Split(uuid, "-")
	if len(parts) != 5 {
		return false
	}
	lengths := []int{8, 4, 4, 4, 12}
	for i, part := range parts {
		if len(part) != lengths[i] {
			return false
		}
	}
	return true
}

// generateRandomUUID 生成随机UUID
func generateRandomUUID() string {
	// 生成16字节随机数
	uuid := make([]byte, 16)
	if _, err := rand.Read(uuid); err != nil {
		// 如果随机数生成失败，使用时间戳+进程ID
		timestamp := time.Now().UnixNano()
		pid := os.Getpid()
		source := fmt.Sprintf("%d-%d", timestamp, pid)
		hash := md5.Sum([]byte(source))
		copy(uuid, hash[:])
	}
	
	// 设置版本和变体
	uuid[6] = (uuid[6] & 0x0f) | 0x40 // Version 4
	uuid[8] = (uuid[8] & 0x3f) | 0x80 // Variant 10
	
	return formatAsUUID(hex.EncodeToString(uuid))
}

// formatAsUUID 将32位hex字符串格式化为UUID
func formatAsUUID(hexStr string) string {
	if len(hexStr) < 32 {
		hexStr = fmt.Sprintf("%-32s", hexStr) // 补齐到32位
	}
	hexStr = hexStr[:32] // 截取前32位
	
	return fmt.Sprintf("%s-%s-%s-%s-%s",
		hexStr[0:8], hexStr[8:12], hexStr[12:16], hexStr[16:20], hexStr[20:32])
}