package monitor

import (
	"agent/query/monitor/collectors"
	"agent/query/monitor/config"
	"agent/query/monitor/models"
	"fmt"
	"log"
	"net"
	"sync"
	"time"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/load"
	"github.com/shirou/gopsutil/v3/mem"
	psnet "github.com/shirou/gopsutil/v3/net"
)

// NetworkCalculator 网络速率计算器
type NetworkCalculator struct {
	prevStats map[string]*models.InterfaceStats
	prevTime  time.Time
	mutex     sync.Mutex
}

// DiskIOCalculator 磁盘IO速率计算器
type DiskIOCalculator struct {
	prevReadBytes  uint64
	prevWriteBytes uint64
	prevTime       time.Time
	mutex          sync.Mutex
}

// NewNetworkCalculator 创建新的网络速率计算器
func NewNetworkCalculator() *NetworkCalculator {
	return &NetworkCalculator{
		prevStats: make(map[string]*models.InterfaceStats),
		prevTime:  time.Now(),
	}
}

// NewDiskIOCalculator 创建新的磁盘IO速率计算器
func NewDiskIOCalculator() *DiskIOCalculator {
	return &DiskIOCalculator{
		prevTime: time.Now(),
	}
}

// CalculateNetworkRates 计算网络速率
func (nc *NetworkCalculator) CalculateNetworkRates(current *models.InterfaceStats) {
	nc.mutex.Lock()
	defer nc.mutex.Unlock()

	if prev, exists := nc.prevStats[current.Name]; exists {
		duration := time.Since(nc.prevTime).Seconds()
		if duration > 0 {
			// 计算字节速率
			if current.TotalRecvBytes >= prev.TotalRecvBytes {
				current.RecvRate = float64(current.TotalRecvBytes-prev.TotalRecvBytes) / duration
			}
			if current.TotalSentBytes >= prev.TotalSentBytes {
				current.SendRate = float64(current.TotalSentBytes-prev.TotalSentBytes) / duration
			}
		}
	}

	// 保存当前状态
	clone := *current
	nc.prevStats[current.Name] = &clone
	nc.prevTime = time.Now()
}

// CalculateDiskRates 计算磁盘IO速率
func (dc *DiskIOCalculator) CalculateDiskRates(readBytes, writeBytes uint64) (float64, float64) {
	dc.mutex.Lock()
	defer dc.mutex.Unlock()

	var readRate, writeRate float64
	duration := time.Since(dc.prevTime).Seconds()

	if duration > 0 {
		if readBytes >= dc.prevReadBytes {
			readRate = float64(readBytes-dc.prevReadBytes) / duration
		}
		if writeBytes >= dc.prevWriteBytes {
			writeRate = float64(writeBytes-dc.prevWriteBytes) / duration
		}
	}

	// 保存当前状态
	dc.prevReadBytes = readBytes
	dc.prevWriteBytes = writeBytes
	dc.prevTime = time.Now()

	return readRate, writeRate
}

// 全局速率计算器
var (
	networkCalculator = NewNetworkCalculator()
	diskIOCalculator  = NewDiskIOCalculator()
)

// CollectMetrics 采集系统指标
func CollectMetrics() (*models.SystemMetrics, error) {
	metrics := &models.SystemMetrics{
		CollectedAt: time.Now().Unix(),
	}

	// 采集 CPU 信息
	if cpuPercent, err := cpu.Percent(0, false); err == nil && len(cpuPercent) > 0 {
		metrics.CPU.UsagePercent = cpuPercent[0]
	}
	if loadAvg, err := load.Avg(); err == nil {
		metrics.CPU.Load1m = loadAvg.Load1
		metrics.CPU.Load5m = loadAvg.Load5
		metrics.CPU.Load15m = loadAvg.Load15
	}

	// 采集内存信息
	if vm, err := mem.VirtualMemory(); err == nil {
		metrics.Memory.TotalBytes = vm.Total
		metrics.Memory.UsedBytes = vm.Used
		metrics.Memory.FreeBytes = vm.Free
		metrics.Memory.AvailableBytes = vm.Available
		metrics.Memory.UsagePercent = vm.UsedPercent
	}

	// 采集根目录磁盘信息
	rootPath := "/"
	if usage, err := disk.Usage(rootPath); err == nil {
		diskUsage := models.DiskUsage{
			MountPoint:   rootPath,
			DeviceName:   "", // 需要另外获取
			TotalBytes:   usage.Total,
			UsedBytes:    usage.Used,
			FreeBytes:    usage.Free,
			UsagePercent: usage.UsedPercent,
			FSType:       usage.Fstype,
		}

		// 获取磁盘IO统计
		if diskIO, err := disk.IOCounters(); err == nil {
			for _, io := range diskIO {
				metrics.Disk.ReadRate = io.ReadBytes
				metrics.Disk.WriteRate = io.WriteBytes
				break // 只取第一个磁盘的IO数据
			}
		}

		metrics.Disk.AvailableBytes = float64(usage.Free)
		metrics.Disk.TotalBytes = float64(usage.Total)
		metrics.Disk.UsagePercent = fmt.Sprintf("%.0f", usage.UsedPercent)
		metrics.Disk.Volumes = []models.DiskUsage{diskUsage}
	}

	// 采集网络信息
	interfaces, _ := net.Interfaces()
	netIOCounters, _ := psnet.IOCounters(true)

	// 遍历网卡，找到第一块物理网卡
	for _, iface := range interfaces {
		// 跳过非物理网卡
		if iface.Flags&net.FlagLoopback != 0 || iface.HardwareAddr == nil || len(iface.HardwareAddr) == 0 {
			continue
		}

		// 获取IP地址
		addrs, err := iface.Addrs()
		if err != nil {
			continue
		}

		// 找到IPv4地址
		var ipv4 string
		for _, addr := range addrs {
			if ipnet, ok := addr.(*net.IPNet); ok {
				if ip4 := ipnet.IP.To4(); ip4 != nil {
					ipv4 = ip4.String()
					break
				}
			}
		}

		// 如果没有找到IPv4地址，跳过这个网卡
		if ipv4 == "" {
			continue
		}

		// 获取网卡统计信息
		var ioStat psnet.IOCountersStat
		for _, counter := range netIOCounters {
			if counter.Name == iface.Name {
				ioStat = counter
				break
			}
		}

		// 创建网卡统计对象
		ifaceStat := models.InterfaceStats{
			Name:           iface.Name,
			MacAddress:     iface.HardwareAddr.String(),
			IPv4Address:    ipv4,
			TotalRecvBytes: ioStat.BytesRecv,
			TotalSentBytes: ioStat.BytesSent,
		}

		// 计算速率
		networkCalculator.CalculateNetworkRates(&ifaceStat)

		// 更新网络总数据
		metrics.Network.RecvRate = ifaceStat.RecvRate
		metrics.Network.SendRate = ifaceStat.SendRate
		metrics.Network.Interfaces = []models.InterfaceStats{ifaceStat}
		break // 只取第一块物理网卡
	}

	return metrics, nil
}

// Monitor 系统监控器
type Monitor struct {
	config        *config.Config
	cpuCollector  *collectors.CPUCollector
	memCollector  *collectors.MemoryCollector
	diskCollector *collectors.DiskCollector
	netCollector  *collectors.NetworkCollector
}

// NewMonitor 创建新的监控器实例
func NewMonitor(cfg *config.Config) *Monitor {
	if cfg == nil {
		cfg = config.DefaultConfig()
	}

	return &Monitor{
		config:        cfg,
		cpuCollector:  collectors.NewCPUCollector(),
		memCollector:  collectors.NewMemoryCollector(),
		diskCollector: collectors.NewDiskCollector(),
		netCollector:  collectors.NewNetworkCollector(),
	}
}

// CollectMetrics 采集系统指标
func (m *Monitor) CollectMetrics() (*models.SystemMetrics, error) {
	metrics := &models.SystemMetrics{
		CollectedAt: time.Now().Unix(),
	}

	// 采集CPU使用率
	if m.config.CPUConfig.Enable {
		if cpuPercent, err := cpu.Percent(0, false); err == nil && len(cpuPercent) > 0 {
			metrics.CPU.UsagePercent = cpuPercent[0]
		}
		if loadAvg, err := load.Avg(); err == nil {
			metrics.CPU.Load1m = loadAvg.Load1
			metrics.CPU.Load5m = loadAvg.Load5
			metrics.CPU.Load15m = loadAvg.Load15
		}
	}

	// 采集内存信息
	if m.config.MemoryConfig.Enable {
		if vm, err := mem.VirtualMemory(); err == nil {
			metrics.Memory.TotalBytes = vm.Total
			metrics.Memory.UsedBytes = vm.Used
			metrics.Memory.FreeBytes = vm.Free
			metrics.Memory.AvailableBytes = vm.Available
			metrics.Memory.UsagePercent = vm.UsedPercent
		}
	}

	// 采集根目录磁盘信息
	if m.config.DiskConfig.Enable {
		rootPath := "/"
		if usage, err := disk.Usage(rootPath); err == nil {
			// 获取设备名称
			var deviceName string
			if partitions, err := disk.Partitions(false); err == nil {
				for _, part := range partitions {
					if part.Mountpoint == rootPath {
						deviceName = part.Device
						break
					}
				}
			}

			diskUsage := models.DiskUsage{
				MountPoint:   rootPath,
				DeviceName:   deviceName,
				TotalBytes:   usage.Total,
				UsedBytes:    usage.Used,
				FreeBytes:    usage.Free,
				UsagePercent: usage.UsedPercent,
				FSType:       usage.Fstype,
			}

			// 获取磁盘IO统计
			if diskIO, err := disk.IOCounters(); err == nil {
				for _, io := range diskIO {
					// 计算IO速率
					readRate, writeRate := diskIOCalculator.CalculateDiskRates(io.ReadBytes, io.WriteBytes)
					metrics.Disk.ReadRate = uint64(readRate)
					metrics.Disk.WriteRate = uint64(writeRate)
					break // 只取第一个磁盘的IO数据
				}
			}

			metrics.Disk.AvailableBytes = float64(usage.Free) / (1024 * 1024 * 1024)
			metrics.Disk.TotalBytes = float64(usage.Total) / (1024 * 1024 * 1024)
			metrics.Disk.UsagePercent = fmt.Sprintf("%.0f", usage.UsedPercent)
			metrics.Disk.Volumes = []models.DiskUsage{diskUsage}
		}
	}

	// 采集网络信息
	if m.config.NetworkConfig.Enable {
		interfaces, _ := net.Interfaces()
		netIOCounters, _ := psnet.IOCounters(true)

		// 遍历网卡，找到第一块物理网卡
		for _, iface := range interfaces {
			// 跳过非物理网卡
			if iface.Flags&net.FlagLoopback != 0 || iface.HardwareAddr == nil || len(iface.HardwareAddr) == 0 {
				continue
			}

			// 获取IP地址
			addrs, err := iface.Addrs()
			if err != nil {
				continue
			}

			// 找到IPv4地址
			var ipv4 string
			for _, addr := range addrs {
				if ipnet, ok := addr.(*net.IPNet); ok {
					if ip4 := ipnet.IP.To4(); ip4 != nil {
						ipv4 = ip4.String()
						break
					}
				}
			}

			// 如果没有找到IPv4地址，跳过这个网卡
			if ipv4 == "" {
				continue
			}

			// 获取网卡统计信息
			var ioStat psnet.IOCountersStat
			for _, counter := range netIOCounters {
				if counter.Name == iface.Name {
					ioStat = counter
					break
				}
			}

			// 创建网卡统计对象
			ifaceStat := models.InterfaceStats{
				Name:           iface.Name,
				MacAddress:     iface.HardwareAddr.String(),
				IPv4Address:    ipv4,
				TotalRecvBytes: ioStat.BytesRecv,
				TotalSentBytes: ioStat.BytesSent,
			}

			// 计算速率
			networkCalculator.CalculateNetworkRates(&ifaceStat)

			// 更新网络总数据
			metrics.Network.RecvRate = ifaceStat.RecvRate
			metrics.Network.SendRate = ifaceStat.SendRate
			metrics.Network.Interfaces = []models.InterfaceStats{ifaceStat}
			break // 只取第一块物理网卡
		}
	}

	// 打印详细的采集信息
	log.Printf("系统指标采集完成:")
	log.Printf("- CPU使用率: %.2f%%, 1分钟负载: %.2f, 5分钟负载: %.2f, 15分钟负载: %.2f",
		metrics.CPU.UsagePercent, metrics.CPU.Load1m, metrics.CPU.Load5m, metrics.CPU.Load15m)
	log.Printf("- 内存使用: %.2f%% (总共: %.2f GB, 已用: %.2f GB, 可用: %.2f GB)",
		metrics.Memory.UsagePercent,
		float64(metrics.Memory.TotalBytes)/(1024*1024*1024),
		float64(metrics.Memory.UsedBytes)/(1024*1024*1024),
		float64(metrics.Memory.AvailableBytes)/(1024*1024*1024))

	if len(metrics.Disk.Volumes) > 0 {
		disk := metrics.Disk.Volumes[0]
		log.Printf("- 根目录磁盘: %.2f%% 已用 (总共: %.2f GB, 可用: %.2f GB)",
			disk.UsagePercent,
			float64(disk.TotalBytes)/(1024*1024*1024),
			float64(disk.FreeBytes)/(1024*1024*1024))
		log.Printf("  IO速率: 读取 %.2f MB/s, 写入 %.2f MB/s",
			float64(metrics.Disk.ReadRate)/(1024*1024),
			float64(metrics.Disk.WriteRate)/(1024*1024))
	}

	if len(metrics.Network.Interfaces) > 0 {
		net := metrics.Network.Interfaces[0]
		log.Printf("- 网卡 %s:", net.Name)
		log.Printf("  MAC: %s, IPv4: %s", net.MacAddress, net.IPv4Address)
		log.Printf("  流量速率: 入站 %.2f MB/s, 出站 %.2f MB/s",
			net.RecvRate/(1024*1024),
			net.SendRate/(1024*1024))
	}

	return metrics, nil
}

// Start 启动监控
func (m *Monitor) Start(metricsChan chan<- *models.SystemMetrics) {
	ticker := time.NewTicker(m.config.CollectInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			metrics, err := m.CollectMetrics()
			if err != nil {
				log.Printf("采集系统指标时出错: %v", err)
				continue
			}
			metricsChan <- metrics
		}
	}
}
