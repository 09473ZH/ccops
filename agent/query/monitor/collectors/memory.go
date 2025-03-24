package collectors

import (
	"agent/query/monitor/models"
	"github.com/shirou/gopsutil/v3/mem"
)

// MemoryCollector 内存信息收集器
type MemoryCollector struct{}

// NewMemoryCollector 创建新的内存收集器
func NewMemoryCollector() *MemoryCollector {
	return &MemoryCollector{}
}

// Collect 收集内存使用情况
func (mc *MemoryCollector) Collect() (*models.MemoryStatus, error) {
	// 获取物理内存信息
	vm, err := mem.VirtualMemory()
	if err != nil {
		return nil, err
	}

	return &models.MemoryStatus{
		TotalBytes:     vm.Total,
		UsedBytes:      vm.Used,
		FreeBytes:      vm.Free,
		AvailableBytes: vm.Available,
		UsagePercent:   vm.UsedPercent,
	}, nil
}
