package collectors

import (
	"agent/query/monitor/models"

	"github.com/shirou/gopsutil/v3/disk"
)

// DiskCollector 磁盘信息收集器
type DiskCollector struct {
	// 忽略的文件系统类型
	ignoredFSTypes map[string]bool
}

// NewDiskCollector 创建新的磁盘收集器
func NewDiskCollector() *DiskCollector {
	return &DiskCollector{
		ignoredFSTypes: map[string]bool{
			"tmpfs":    true,
			"devtmpfs": true,
			"devfs":    true,
			"overlay":  false, // 允许overlay文件系统
			"squashfs": false, // 允许squashfs文件系统
			"rootfs":   false, // 允许rootfs
		},
	}
}

// isIgnoredFSType 检查是否是需要忽略的文件系统类型
func (dc *DiskCollector) isIgnoredFSType(fsType string) bool {
	return dc.ignoredFSTypes[fsType]
}

// Collect 收集磁盘使用情况
func (dc *DiskCollector) Collect() ([]models.DiskUsage, error) {
	var diskUsages []models.DiskUsage

	// 获取所有分区
	partitions, err := disk.Partitions(false)
	if err != nil {
		return nil, err
	}

	// 遍历处理每个分区
	for _, partition := range partitions {
		// 跳过特殊文件系统
		if dc.isIgnoredFSType(partition.Fstype) {
			continue
		}

		usage, err := disk.Usage(partition.Mountpoint)
		if err != nil {
			continue
		}

		diskUsage := models.DiskUsage{
			MountPoint:   partition.Mountpoint,
			DeviceName:   partition.Device,
			TotalBytes:   usage.Total,
			UsedBytes:    usage.Used,
			FreeBytes:    usage.Free,
			UsagePercent: usage.UsedPercent,
			FSType:       partition.Fstype,
		}
		diskUsages = append(diskUsages, diskUsage)
	}

	return diskUsages, nil
}
