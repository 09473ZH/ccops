package calculator

import (
	"sync"
	"time"
)

// DiskCalculator 磁盘速率计算器
type DiskCalculator struct {
	prevReadBytes  uint64
	prevWriteBytes uint64
	prevTime       time.Time
	mutex          sync.Mutex
}

// NewDiskCalculator 创建新的磁盘速率计算器
func NewDiskCalculator() *DiskCalculator {
	return &DiskCalculator{
		prevTime: time.Now(),
	}
}

// CalculateDiskRates 计算磁盘读写速率
func (dc *DiskCalculator) CalculateDiskRates(readBytes, writeBytes uint64) (float64, float64) {
	dc.mutex.Lock()
	defer dc.mutex.Unlock()

	duration := time.Since(dc.prevTime).Seconds()
	var readRate, writeRate float64

	if duration > 0 {
		// 处理计数器溢出
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
