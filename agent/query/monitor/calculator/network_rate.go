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

const (
	maxRateThreshold = 10 * 1024 * 1024 * 1024 // 10 Gbps，最大合理速率
)

// CalculateNetworkRates 计算网络速率
func (nc *NetworkCalculator) CalculateNetworkRates(current *models.InterfaceStats) {
	nc.mutex.Lock()
	defer nc.mutex.Unlock()

	if prev, exists := nc.prevStats[current.Name]; exists {
		duration := time.Since(nc.prevTime).Seconds()
		if duration > 0 {
			// 处理计数器重置或溢出的情况
			if current.TotalRecvBytes < prev.TotalRecvBytes {
				// 计数器已重置，使用当前值作为差值
				current.RecvRate = float64(current.TotalRecvBytes) / duration
			} else {
				current.RecvRate = float64(current.TotalRecvBytes-prev.TotalRecvBytes) / duration
			}

			if current.TotalSentBytes < prev.TotalSentBytes {
				// 计数器已重置，使用当前值作为差值
				current.SendRate = float64(current.TotalSentBytes) / duration
			} else {
				current.SendRate = float64(current.TotalSentBytes-prev.TotalSentBytes) / duration
			}

			// 异常值过滤
			if current.RecvRate > maxRateThreshold {
				current.RecvRate = prev.RecvRate // 使用上一次的值
			}
			if current.SendRate > maxRateThreshold {
				current.SendRate = prev.SendRate // 使用上一次的值
			}
		}
	}

	// 保存当前状态的副本
	clone := *current
	nc.prevStats[current.Name] = &clone
	nc.prevTime = time.Now()
}
