package calculator

import (
	"agent/query/monitor/models"
	"sync"
	"time"
)

// NetworkCalculator 网络速率计算器
type NetworkCalculator struct {
	prevStats map[string]*models.NetworkStatus
	prevTime  time.Time
	mutex     sync.Mutex
}

// NewNetworkCalculator 创建新的网络速率计算器
func NewNetworkCalculator() *NetworkCalculator {
	return &NetworkCalculator{
		prevStats: make(map[string]*models.NetworkStatus),
		prevTime:  time.Now(),
	}
}

// CalculateRates 计算网络速率
func (nc *NetworkCalculator) CalculateRates(current *models.NetworkStatus) {
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
