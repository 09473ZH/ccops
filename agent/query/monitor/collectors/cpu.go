package collectors

import (
	"github.com/shirou/gopsutil/v3/cpu"
)

// CPUCollector CPU信息收集器
type CPUCollector struct{}

// NewCPUCollector 创建新的CPU收集器
func NewCPUCollector() *CPUCollector {
	return &CPUCollector{}
}

// Collect 收集CPU使用率
func (cc *CPUCollector) Collect() (float64, error) {
	cpuPercent, err := cpu.Percent(0, false)
	if err != nil {
		return 0, err
	}

	if len(cpuPercent) > 0 {
		return cpuPercent[0], nil
	}

	return 0, nil
}
