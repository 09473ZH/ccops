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

	// 获取Swap信息
	swap, err := mem.SwapMemory()
	if err != nil {
		return nil, err
	}

	return &models.MemoryStatus{
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
