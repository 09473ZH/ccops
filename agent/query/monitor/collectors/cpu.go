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
	// 使用瞬时值计算 CPU 使用率
	// 由于 gopsutil 内部会维护上次的 CPU 时间数据
	// 所以这里返回的是距离上次调用的平均使用率
	cpuPercent, err := cpu.Percent(0, false)
	if err != nil {
		return 0, err
	}

	if len(cpuPercent) > 0 {
		return cpuPercent[0], nil
	}

	return 0, nil
}
