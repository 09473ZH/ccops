package config

import "time"

// Config 监控配置
type Config struct {
	// 采集间隔
	CollectInterval time.Duration

	// CPU配置
	CPUConfig struct {
		Enable bool
	}

	// 内存配置
	MemoryConfig struct {
		Enable bool
	}

	// 磁盘配置
	DiskConfig struct {
		Enable         bool
		IgnoredFSTypes []string
	}

	// 网络配置
	NetworkConfig struct {
		Enable         bool
		IgnoreLoopback bool
		IgnoreDown     bool
	}
}

// DefaultConfig 返回默认配置
func DefaultConfig() *Config {
	cfg := &Config{
		CollectInterval: 5 * time.Second,
	}

	// CPU默认配置
	cfg.CPUConfig.Enable = true

	// 内存默认配置
	cfg.MemoryConfig.Enable = true

	// 磁盘默认配置
	cfg.DiskConfig.Enable = true
	cfg.DiskConfig.IgnoredFSTypes = []string{
		"tmpfs",
		"devtmpfs",
		"devfs",
	}

	// 网络默认配置
	cfg.NetworkConfig.Enable = true
	cfg.NetworkConfig.IgnoreLoopback = true
	cfg.NetworkConfig.IgnoreDown = true

	return cfg
}
