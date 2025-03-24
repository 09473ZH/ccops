package calculator

import (
	"agent/query/monitor/models"
	"sync"
	"time"
)

// NetworkCalculator 网络速率计算器
type NetworkCalculator struct {
	prevStats map[string]*models.InterfaceStats
	prevTime  time.Time
	mutex     sync.Mutex
}

// NewNetworkCalculator 创建新的网络速率计算器
func NewNetworkCalculator() *NetworkCalculator {
	return &NetworkCalculator{
		prevStats: make(map[string]*models.InterfaceStats),
		prevTime:  time.Now(),
	}
}

// CalculateNetworkRates 计算网络速率
func (nc *NetworkCalculator) CalculateNetworkRates(current *models.InterfaceStats) {
	nc.mutex.Lock()
	defer nc.mutex.Unlock()

	if prev, exists := nc.prevStats[current.Name]; exists {
		duration := time.Since(nc.prevTime).Seconds()
		if duration > 0 {
			// 处理计数器溢出
			if current.TotalRecvBytes >= prev.TotalRecvBytes {
				current.RecvRate = float64(current.TotalRecvBytes-prev.TotalRecvBytes) / duration
			}
			if current.TotalSentBytes >= prev.TotalSentBytes {
				current.SendRate = float64(current.TotalSentBytes-prev.TotalSentBytes) / duration
			}
		}
	}

	// 保存当前状态的副本
	clone := *current
	nc.prevStats[current.Name] = &clone
	nc.prevTime = time.Now()
}
