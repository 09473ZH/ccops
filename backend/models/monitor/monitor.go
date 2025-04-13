package monitor

import (
	"fmt"
	"sync"
)

// MetricPoint 单个指标数据点
type MetricPoint struct {
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
	Memory struct {
		TotalBytes     uint64  `json:"totalBytes"`     // 总内存(字节)
		UsedBytes      uint64  `json:"usedBytes"`      // 已用内存(字节)
		FreeBytes      uint64  `json:"freeBytes"`      // 空闲内存(字节)
		AvailableBytes uint64  `json:"availableBytes"` // 可用内存(字节)
		UsagePercent   float64 `json:"usagePercent"`   // 使用率(百分比)
	} `json:"memory"`

	// 磁盘信息
	Disk struct {
		AvailableBytes float64     `json:"availableBytes"` // 可用空间(字节)
		TotalBytes     float64     `json:"totalBytes"`     // 总空间(字节)
		UsagePercent   float64     `json:"usagePercent"`   // 使用率(百分比)
		ReadRate       float64     `json:"readRate"`       // 读取速率(字节/秒)
		WriteRate      float64     `json:"writeRate"`      // 写入速率(字节/秒)
		Volumes        []DiskUsage `json:"volumes"`        // 磁盘详情列表
	} `json:"disk"`

	// 网络信息
	Network struct {
		RecvRate   float64          `json:"recvRate"`   // 总接收速率(B/s)
		SendRate   float64          `json:"sendRate"`   // 总发送速率(B/s)
		Interfaces []InterfaceStats `json:"interfaces"` // 网卡列表
	} `json:"network"`
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

// NetworkStatus 网络监控数据结构
type NetworkStatus struct {
	// 基础信息
	Name string `json:"name"` // 网卡名称
	MAC  string `json:"mac"`  // MAC地址
	IPv4 string `json:"ipv4"` // IPv4地址

	// 流量统计
	BytesRecv     uint64  `json:"bytesRecv"`     // 接收字节数
	BytesSent     uint64  `json:"bytesSent"`     // 发送字节数
	BytesRecvRate float64 `json:"bytesRecvRate"` // 接收速率（字节/秒）
	BytesSentRate float64 `json:"bytesSentRate"` // 发送速率（字节/秒）
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
	point.CollectedAt = alignTimestamp(point.CollectedAt)

	// 获取或创建主机的时间序列数据
	hostData, exists := db.hostPoints[point.HostID]
	if !exists {
		hostData = &HostTimeData{
			points: [17280]*MetricPoint{},
			head:   0,
			count:  0,
		}
		db.hostPoints[point.HostID] = hostData

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
		if point.CollectedAt >= start && point.CollectedAt <= end {
			result = append(result, point)
		}
	}

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
