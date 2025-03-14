package monitor

import (
	"fmt"
	"sync"
)

// MetricPoint 单个指标数据点

type MetricPoint struct {
	Timestamp int64   `json:"timestamp"` // 时间戳
	HostID    uint64  `json:"hostId"`    // 主机ID
	CPUUsage  float64 `json:"cpuUsage"`  // CPU使用率

	// 内存信息
	MemoryTotal       uint64  `json:"memoryTotal"`       // 总内存(字节)
	MemoryUsed        uint64  `json:"memoryUsed"`        // 已用内存(字节)
	MemoryFree        uint64  `json:"memoryFree"`        // 空闲内存(字节)
	MemoryAvailable   uint64  `json:"memoryAvailable"`   // 可用内存(字节)
	MemoryUsedPercent float64 `json:"memoryUsedPercent"` // 使用率(百分比)
	SwapTotal         uint64  `json:"swapTotal"`         // Swap总大小
	SwapUsed          uint64  `json:"swapUsed"`          // Swap已用
	SwapFree          uint64  `json:"swapFree"`          // Swap空闲
	SwapPercent       float64 `json:"swapPercent"`       // Swap使用率
	MemoryBuffers     uint64  `json:"memoryBuffers"`     // 缓冲区大小
	MemoryCached      uint64  `json:"memoryCached"`      // 缓存大小

	// 磁盘信息
	DiskUsages []DiskUsage `json:"diskUsages"` // 各磁盘使用情况

	// 网络信息
	NetworkStatus []NetworkStatus `json:"networkStatus"` // 各网卡状态
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

// HostTimeData 单个主机的时序数据

type HostTimeData struct {
	points [17280]*MetricPoint // 固定大小的数组，存储24小时的数据（5秒一个点）
	head   int                 // 当前写入位置
	count  int                 // 当前存储的数据点数量
}

// TimeSeriesDB 内存时序库

type TimeSeriesDB struct {
	sync.RWMutex
	hostPoints map[uint64]*HostTimeData // key为hostID，value为该主机的数据点数组
}

// 对象池，用于减少内存分配

var pointPool = sync.Pool{
	New: func() interface{} {
		return &MetricPoint{}
	},
}

// NewTimeSeriesDB 创建新的时序数据库实例

func NewTimeSeriesDB() *TimeSeriesDB {
	return &TimeSeriesDB{
		hostPoints: make(map[uint64]*HostTimeData),
	}
}

// alignTimestamp 时间戳对齐到5秒

func alignTimestamp(ts int64) int64 {
	return ts - (ts % 5)
}

// Insert 插入数据点

func (db *TimeSeriesDB) Insert(point *MetricPoint) {
	db.Lock()
	defer db.Unlock()

	// 对齐时间戳
	point.Timestamp = alignTimestamp(point.Timestamp)

	// 获取或创建主机的时间序列数据
	hostData, exists := db.hostPoints[point.HostID]
	if !exists {
		hostData = &HostTimeData{
			points: [17280]*MetricPoint{},
			head:   0,
			count:  0,
		}
		db.hostPoints[point.HostID] = hostData
		fmt.Printf("[时序数据库] 创建新的主机时序数据: 主机ID=%d\n", point.HostID)
	}

	// 从对象池获取新对象并复制数据
	newPoint := pointPool.Get().(*MetricPoint)
	*newPoint = *point

	// 如果当前位置有旧数据，放回对象池
	if hostData.points[hostData.head] != nil {
		pointPool.Put(hostData.points[hostData.head])
	}

	// 存入新数据
	hostData.points[hostData.head] = newPoint
	hostData.head = (hostData.head + 1) % 17280
	if hostData.count < 17280 {
		hostData.count++
	}

	fmt.Printf("[时序数据库] 插入数据点: 主机ID=%d, 时间戳=%d, 总数据点=%d\n",
		point.HostID, point.Timestamp, hostData.count)
}

// Query 查询指定主机在指定时间范围的数据

func (db *TimeSeriesDB) Query(hostID uint64, start, end int64) []*MetricPoint {
	db.RLock()
	defer db.RUnlock()

	hostData, exists := db.hostPoints[hostID]
	if !exists {
		fmt.Printf("[时序数据库] 查询失败: 主机ID=%d 不存在\n", hostID)
		return nil
	}

	result := make([]*MetricPoint, 0)
	for i := 0; i < hostData.count; i++ {
		idx := (hostData.head - 1 - i + 17280) % 17280
		point := hostData.points[idx]
		if point == nil {
			continue
		}
		if point.Timestamp >= start && point.Timestamp <= end {
			result = append(result, point)
		}
	}

	fmt.Printf("[时序数据库] 查询结果: 主机ID=%d, 时间范围=[%d, %d], 结果数量=%d\n",
		hostID, start, end, len(result))
	return result
}

// GetLatest 获取指定主机的最新数据点

func (db *TimeSeriesDB) GetLatest(hostID uint64) *MetricPoint {
	db.RLock()
	defer db.RUnlock()

	hostData, exists := db.hostPoints[hostID]
	if !exists || hostData.count == 0 {
		fmt.Printf("[时序数据库] 获取最新数据失败: 主机ID=%d 不存在或无数据\n", hostID)
		return nil
	}

	lastIdx := (hostData.head - 1 + 17280) % 17280
	point := hostData.points[lastIdx]
	if point != nil {
		fmt.Printf("[时序数据库] 获取最新数据: 主机ID=%d, 时间戳=%d\n",
			hostID, point.Timestamp)
	}
	return point
}

// GetAllLatest 获取所有主机的最新数据点

func (db *TimeSeriesDB) GetAllLatest() map[uint64]*MetricPoint {
	db.RLock()
	defer db.RUnlock()

	result := make(map[uint64]*MetricPoint)
	for hostID, hostData := range db.hostPoints {
		if hostData.count > 0 {
			lastIdx := (hostData.head - 1 + 17280) % 17280
			if point := hostData.points[lastIdx]; point != nil {
				result[hostID] = point
			}
		}
	}

	fmt.Printf("[时序数据库] 获取所有主机最新数据: 主机数量=%d\n", len(result))
	for hostID, point := range result {
		fmt.Printf("  主机ID=%d: 时间戳=%d, CPU=%.2f%%, 内存=%.2f%%\n",
			hostID, point.Timestamp, point.CPUUsage, point.MemoryUsedPercent)
	}
	return result
}

// GetAllData 获取指定主机的所有存储的数据点

func (db *TimeSeriesDB) GetAllData(hostID uint64) []*MetricPoint {
	db.RLock()
	defer db.RUnlock()

	hostData, exists := db.hostPoints[hostID]
	if !exists {
		fmt.Printf("[时序数据库] 获取所有数据失败: 主机ID=%d 不存在\n", hostID)
		return nil
	}

	result := make([]*MetricPoint, 0, hostData.count)
	for i := 0; i < hostData.count; i++ {
		idx := (hostData.head - 1 - i + 17280) % 17280
		if point := hostData.points[idx]; point != nil {
			result = append(result, point)
		}
	}

	if len(result) > 0 {
		firstPoint := result[0]
		lastPoint := result[len(result)-1]
		fmt.Printf("[时序数据库] 获取主机所有数据: 主机ID=%d, 数据点数量=%d\n", hostID, len(result))
		fmt.Printf("  时间范围: %d -> %d\n", lastPoint.Timestamp, firstPoint.Timestamp)
		fmt.Printf("  最新数据: CPU=%.2f%%, 内存=%.2f%%\n",
			firstPoint.CPUUsage, firstPoint.MemoryUsedPercent)
	}

	return result
}

// GetAllHostData 获取所有主机的所有数据点

func (db *TimeSeriesDB) GetAllHostData() map[uint64][]*MetricPoint {
	db.RLock()
	defer db.RUnlock()

	result := make(map[uint64][]*MetricPoint)
	for hostID := range db.hostPoints {
		result[hostID] = db.GetAllData(hostID)
	}

	return result
}
