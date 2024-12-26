package models

type DiskModel struct {
	MODEL

	HostID uint `gorm:"index;comment:主机ID" json:"hostId"` // 关联 HostModel 表

	DiskSpaceAvailable        float64 `gorm:"comment:磁盘剩余" json:"diskSpaceAvailable"`           // 主机磁盘
	TotalDiskSpace            float64 `gorm:"comment:主机总容量" json:"totalDiskSpace"`              // 主机总容量
	PercentDiskSpaceAvailable string  `gorm:"comment:主机磁盘使用率" json:"percentDiskSpaceAvailable"` // 主机磁盘使用率
	Encrypted                 bool    `gorm:"comment:磁盘是否加密" json:"encrypted"`                  // 磁盘是否加密

}
