package models

// SystemMetrics 包含系统指标数据
type SystemMetrics struct {
	CPUUsage      float64         `json:"cpuUsage"`      // CPU使用率
	Memory        MemoryStatus    `json:"memory"`        // 内存状态
	DiskUsages    []DiskUsage     `json:"diskUsages"`    // 磁盘使用情况
	NetworkStatus []NetworkStatus `json:"networkStatus"` // 网络状态
	Timestamp     int64           `json:"timestamp"`     // 时间戳
}

// MemoryStatus 内存监控数据结构
type MemoryStatus struct {
	// 物理内存
	Total       uint64  `json:"memoryTotal"`       // 总内存(字节)
	Used        uint64  `json:"memoryUsed"`        // 已用内存(字节)
	Free        uint64  `json:"memoryFree"`        // 空闲内存(字节)
	Available   uint64  `json:"memoryAvailable"`   // 可用内存(字节)
	UsedPercent float64 `json:"memoryUsedPercent"` // 使用率(百分比)

	// 交换分区(Swap)
	SwapTotal   uint64  `json:"swapTotal"`   // Swap总大小
	SwapUsed    uint64  `json:"swapUsed"`    // Swap已用
	SwapFree    uint64  `json:"swapFree"`    // Swap空闲
	SwapPercent float64 `json:"swapPercent"` // Swap使用率

	// 内存详细信息
	Buffers uint64 `json:"memoryBuffers"` // 缓冲区大小
	Cached  uint64 `json:"memoryCached"`  // 缓存大小
}

// DiskUsage 磁盘使用情况
type DiskUsage struct {
	Path        string  `json:"path"`        // 挂载点路径
	Device      string  `json:"device"`      // 设备名称
	Total       uint64  `json:"total"`       // 总空间(字节)
	Used        uint64  `json:"used"`        // 已用空间(字节)
	Free        uint64  `json:"free"`        // 剩余空间(字节)
	UsedPercent float64 `json:"usedPercent"` // 使用率(百分比)
	FSType      string  `json:"fsType"`      // 文件系统类型
}

// NetworkStatus 网络监控数据结构
type NetworkStatus struct {
	// 基础信息
	Name string `json:"name"` // 网卡名称
	MAC  string `json:"mac"`  // MAC地址
	IPv4 string `json:"ipv4"` // IPv4地址
	IPv6 string `json:"ipv6"` // IPv6地址
	MTU  int    `json:"mtu"`  // MTU大小

	// 流量统计
	BytesRecv   uint64 `json:"bytesRecv"`   // 接收字节数
	BytesSent   uint64 `json:"bytesSent"`   // 发送字节数
	PacketsRecv uint64 `json:"packetsRecv"` // 接收包数
	PacketsSent uint64 `json:"packetsSent"` // 发送包数

	// 错误统计
	Errin   uint64 `json:"errin"`   // 接收错误数
	Errout  uint64 `json:"errout"`  // 发送错误数
	Dropin  uint64 `json:"dropin"`  // 接收丢包数
	Dropout uint64 `json:"dropout"` // 发送丢包数

	// 速率计算(每秒)
	BytesRecvRate   float64 `json:"bytesRecvRate"`   // 接收速率
	BytesSentRate   float64 `json:"bytesSentRate"`   // 发送速率
	PacketsRecvRate float64 `json:"packetsRecvRate"` // 接收包速率
	PacketsSentRate float64 `json:"packetsSentRate"` // 发送包速率

	// TCP连接状态
	TCPConnections map[string]int `json:"tcpConnections"` // 各状态连接数
}

// Clone 克隆网络状态对象
func (ns *NetworkStatus) Clone() *NetworkStatus {
	clone := *ns
	clone.TCPConnections = make(map[string]int)
	for k, v := range ns.TCPConnections {
		clone.TCPConnections[k] = v
	}
	return &clone
}
