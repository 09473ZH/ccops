package models

// SystemMetrics 包含系统指标数据
type SystemMetrics struct {
	CollectedAt int64  `json:"collectedAt"` // 采集时间戳（Unix时间戳，秒）
	HostID      uint64 `json:"hostId"`      // 主机ID

	// CPU信息
	CPU struct {
		UsagePercent float64 `json:"usagePercent"` // CPU使用率（百分比）
		Load1m       float64 `json:"load1m"`       // 1分钟负载
		Load5m       float64 `json:"load5m"`       // 5分钟负载
		Load15m      float64 `json:"load15m"`      // 15分钟负载
	} `json:"cpu"`

	// 内存信息
	Memory MemoryStatus `json:"memory"`

	// 磁盘信息
	Disk struct {
		AvailableBytes float64     `json:"availableBytes"` // 可用空间(GB)
		TotalBytes     float64     `json:"totalBytes"`     // 总空间(GB)
		UsagePercent   string      `json:"usagePercent"`   // 使用率(百分比)
		ReadRate       uint64      `json:"readRate"`       // 读取速率(B/s)
		WriteRate      uint64      `json:"writeRate"`      // 写入速率(B/s)
		Volumes        []DiskUsage `json:"volumes"`        // 磁盘详情列表
	} `json:"disk"`

	// 网络信息
	Network struct {
		RecvRate   float64          `json:"RecvRate"`   // 总接收速率(B/s)
		SendRate   float64          `json:"sendRate"`   // 总发送速率(B/s)
		Interfaces []InterfaceStats `json:"interfaces"` // 网卡列表
	} `json:"network"`
}

// MemoryStatus 内存状态信息
type MemoryStatus struct {
	TotalBytes     uint64  `json:"totalBytes"`     // 总内存(字节)
	UsedBytes      uint64  `json:"usedBytes"`      // 已用内存(字节)
	FreeBytes      uint64  `json:"freeBytes"`      // 空闲内存(字节)
	AvailableBytes uint64  `json:"availableBytes"` // 可用内存(字节)
	UsagePercent   float64 `json:"usagePercent"`   // 使用率(百分比)
}

// DiskUsage 单个磁盘使用情况
type DiskUsage struct {
	MountPoint   string  `json:"mountPoint"`   // 挂载点路径
	DeviceName   string  `json:"deviceName"`   // 设备名称
	TotalBytes   uint64  `json:"totalBytes"`   // 总空间(字节)
	UsedBytes    uint64  `json:"usedBytes"`    // 已用空间(字节)
	FreeBytes    uint64  `json:"freeBytes"`    // 剩余空间(字节)
	UsagePercent float64 `json:"usagePercent"` // 使用率(百分比)
	FSType       string  `json:"fsType"`       // 文件系统类型
}

// InterfaceStats 网卡统计信息
type InterfaceStats struct {
	Name           string  `json:"name"`           // 网卡名称
	MacAddress     string  `json:"macAddress"`     // MAC地址
	IPv4Address    string  `json:"ipv4Address"`    // IPv4地址
	TotalRecvBytes uint64  `json:"totalRecvBytes"` // 总接收字节数
	TotalSentBytes uint64  `json:"totalSentBytes"` // 总发送字节数
	RecvRate       float64 `json:"recvRate"`       // 接收速率（字节/秒）
	SendRate       float64 `json:"sendRate"`       // 发送速率（字节/秒）
}
