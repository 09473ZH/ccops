package monitor

import (
	"log"
	"net"
	"sync"
	"time"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/mem"
	psnet "github.com/shirou/gopsutil/v3/net"
)

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

// NetworkCalculator 网络速率计算器
type NetworkCalculator struct {
	prevStats map[string]*NetworkStatus
	prevTime  time.Time
	mutex     sync.Mutex
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

// NewNetworkCalculator 创建新的网络速率计算器
func NewNetworkCalculator() *NetworkCalculator {
	return &NetworkCalculator{
		prevStats: make(map[string]*NetworkStatus),
		prevTime:  time.Now(),
	}
}

// CalculateRates 计算网络速率
func (nc *NetworkCalculator) CalculateRates(current *NetworkStatus) {
	nc.mutex.Lock()
	defer nc.mutex.Unlock()

	if prev, exists := nc.prevStats[current.Name]; exists {
		duration := time.Since(nc.prevTime).Seconds()
		if duration > 0 {
			// 处理计数器溢出
			if current.BytesRecv >= prev.BytesRecv {
				current.BytesRecvRate = float64(current.BytesRecv-prev.BytesRecv) / duration
			}
			if current.BytesSent >= prev.BytesSent {
				current.BytesSentRate = float64(current.BytesSent-prev.BytesSent) / duration
			}
			if current.PacketsRecv >= prev.PacketsRecv {
				current.PacketsRecvRate = float64(current.PacketsRecv-prev.PacketsRecv) / duration
			}
			if current.PacketsSent >= prev.PacketsSent {
				current.PacketsSentRate = float64(current.PacketsSent-prev.PacketsSent) / duration
			}

			// 处理丢包计数器溢出
			if current.Dropin < prev.Dropin {
				current.Dropin = 0 // 重置计数器
			}
			if current.Dropout < prev.Dropout {
				current.Dropout = 0 // 重置计数器
			}
		}
	}

	// 保存当前状态的副本
	nc.prevStats[current.Name] = current.Clone()
	nc.prevTime = time.Now()
}

// GetMemoryUsage 获取内存使用情况
func GetMemoryUsage() (*MemoryStatus, error) {
	// 获取物理内存信息
	vm, err := mem.VirtualMemory()
	if err != nil {
		return nil, err
	}

	// 获取Swap信息
	swap, err := mem.SwapMemory()
	if err != nil {
		return nil, err
	}

	return &MemoryStatus{
		// 物理内存
		Total:       vm.Total,
		Used:        vm.Used,
		Free:        vm.Free,
		Available:   vm.Available,
		UsedPercent: vm.UsedPercent,

		// Swap
		SwapTotal:   swap.Total,
		SwapUsed:    swap.Used,
		SwapFree:    swap.Free,
		SwapPercent: swap.UsedPercent,

		// 详细信息
		Buffers: vm.Buffers,
		Cached:  vm.Cached,
	}, nil
}

// GetDiskUsage 获取磁盘使用情况
func GetDiskUsage() ([]DiskUsage, error) {
	var diskUsages []DiskUsage

	// 获取所有分区
	partitions, err := disk.Partitions(false)
	if err != nil {
		return nil, err
	}

	// 遍历处理每个分区
	for _, partition := range partitions {
		// 跳过特殊文件系统
		if isIgnoredFSType(partition.Fstype) {
			continue
		}

		usage, err := disk.Usage(partition.Mountpoint)
		if err != nil {
			continue
		}

		diskUsage := DiskUsage{
			Path:        partition.Mountpoint,
			Device:      partition.Device,
			Total:       usage.Total,
			Used:        usage.Used,
			Free:        usage.Free,
			UsedPercent: usage.UsedPercent,
			FSType:      partition.Fstype,
		}
		diskUsages = append(diskUsages, diskUsage)
	}

	return diskUsages, nil
}

// 忽略的文件系统类型
var ignoredFSTypes = map[string]bool{
	"tmpfs":    true,
	"devtmpfs": true,
	"devfs":    true,
	"overlay":  false, // 允许overlay文件系统
	"squashfs": false, // 允许squashfs文件系统
	"rootfs":   false, // 允许rootfs
}

// isIgnoredFSType 检查是否是需要忽略的文件系统类型
func isIgnoredFSType(fsType string) bool {
	return ignoredFSTypes[fsType]
}

// GetNetworkStatus 获取网络状态
func GetNetworkStatus() ([]NetworkStatus, error) {
	var networkStats []NetworkStatus

	// 获取网卡信息
	interfaces, err := net.Interfaces()
	if err != nil {
		return nil, err
	}

	// 获取网卡统计信息
	netIOCounters, err := psnet.IOCounters(true)
	if err != nil {
		return nil, err
	}

	// 获取TCP连接状态
	connections, err := psnet.Connections("tcp")
	if err != nil {
		return nil, err
	}

	// 统计TCP连接状态
	tcpStates := make(map[string]int)
	for _, conn := range connections {
		tcpStates[conn.Status]++
	}

	// 处理每个网卡
	for _, iface := range interfaces {
		// 跳过本地回环和非活动接口
		if iface.Flags&net.FlagLoopback != 0 || iface.Flags&net.FlagUp == 0 {
			continue
		}

		stat := NetworkStatus{
			Name:           iface.Name,
			MAC:            iface.HardwareAddr.String(),
			MTU:            iface.MTU,
			TCPConnections: tcpStates,
		}

		// 获取IP地址
		addrs, err := iface.Addrs()
		if err != nil {
			continue
		}
		for _, addr := range addrs {
			if ipnet, ok := addr.(*net.IPNet); ok {
				if ip4 := ipnet.IP.To4(); ip4 != nil {
					stat.IPv4 = ip4.String()
				} else if ipnet.IP.To16() != nil {
					stat.IPv6 = ipnet.IP.String()
				}
			}
		}

		// 获取网卡统计信息
		for _, counter := range netIOCounters {
			if counter.Name == iface.Name {
				stat.BytesRecv = counter.BytesRecv
				stat.BytesSent = counter.BytesSent
				stat.PacketsRecv = counter.PacketsRecv
				stat.PacketsSent = counter.PacketsSent
				stat.Errin = counter.Errin
				stat.Errout = counter.Errout
				stat.Dropin = counter.Dropin
				stat.Dropout = counter.Dropout
				break
			}
		}

		networkStats = append(networkStats, stat)
	}

	return networkStats, nil
}

// SystemMetrics 包含系统指标数据
type SystemMetrics struct {
	CPUUsage      float64         `json:"cpuUsage"`      // CPU使用率
	Memory        MemoryStatus    `json:"memory"`        // 内存状态
	DiskUsages    []DiskUsage     `json:"diskUsages"`    // 磁盘使用情况
	NetworkStatus []NetworkStatus `json:"networkStatus"` // 网络状态
	Timestamp     int64           `json:"timestamp"`     // 时间戳
}

// 全局网络速率计算器
var networkCalculator = NewNetworkCalculator()

// CollectMetrics 采集系统指标
func CollectMetrics() (*SystemMetrics, error) {
	metrics := &SystemMetrics{}

	// 采集 CPU 使用率
	cpuPercent, err := cpu.Percent(0, false)
	if err == nil && len(cpuPercent) > 0 {
		metrics.CPUUsage = cpuPercent[0]
	} else {
		log.Printf("CPU使用率采集失败: %v", err)
	}

	// 采集内存信息
	memoryStatus, err := GetMemoryUsage()
	if err == nil {
		metrics.Memory = *memoryStatus
	} else {
		log.Printf("内存信息采集失败: %v", err)
	}

	// 采集磁盘信息
	diskUsages, err := GetDiskUsage()
	if err == nil {
		metrics.DiskUsages = diskUsages
	} else {
		log.Printf("磁盘信息采集失败: %v", err)
	}

	// 采集网络信息
	networkStats, err := GetNetworkStatus()
	if err == nil {
		// 计算网络速率
		for i := range networkStats {
			networkCalculator.CalculateRates(&networkStats[i])
		}
		metrics.NetworkStatus = networkStats
	} else {
		log.Printf("网络信息采集失败: %v", err)
	}

	metrics.Timestamp = time.Now().Unix()

	// 打印详细的采集信息
	log.Printf("系统指标采集完成:")
	log.Printf("- CPU使用率: %.2f%%", metrics.CPUUsage)
	log.Printf("- 内存使用: %.2f%% (总共: %.2f GB, 已用: %.2f GB, 可用: %.2f GB)",
		metrics.Memory.UsedPercent,
		float64(metrics.Memory.Total)/(1024*1024*1024),
		float64(metrics.Memory.Used)/(1024*1024*1024),
		float64(metrics.Memory.Available)/(1024*1024*1024))
	log.Printf("- Swap使用: %.2f%% (总共: %.2f GB, 已用: %.2f GB)",
		metrics.Memory.SwapPercent,
		float64(metrics.Memory.SwapTotal)/(1024*1024*1024),
		float64(metrics.Memory.SwapUsed)/(1024*1024*1024))

	for _, disk := range metrics.DiskUsages {
		log.Printf("- 磁盘 %s (%s): %.2f%% 已用 (总共: %.2f GB, 可用: %.2f GB)",
			disk.Path, disk.FSType,
			disk.UsedPercent,
			float64(disk.Total)/(1024*1024*1024),
			float64(disk.Free)/(1024*1024*1024))
	}

	for _, net := range metrics.NetworkStatus {
		log.Printf("- 网卡 %s:", net.Name)
		log.Printf("  MAC: %s, IPv4: %s, IPv6: %s", net.MAC, net.IPv4, net.IPv6)
		log.Printf("  速率: 入站 %.2f MB/s, 出站 %.2f MB/s",
			net.BytesRecvRate/(1024*1024),
			net.BytesSentRate/(1024*1024))
		log.Printf("  错误: 入站错误 %d, 出站错误 %d, 入站丢包 %d, 出站丢包 %d",
			net.Errin, net.Errout, net.Dropin, net.Dropout)
	}

	return metrics, nil
}
