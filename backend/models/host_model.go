package models

import (
	"time"
)

type HostModel struct {
	ID              uint      `gorm:"primaryKey;comment:id" json:"id"`               // 主键ID
	CreatedAt       time.Time `json:"createdAt"`                                     // 创建时间
	UpdatedAt       time.Time `json:"updatedAt"`                                     // 更新时间
	Name            string    `gorm:"size:36;comment:主机名称" json:"name"`              // 主机名称
	OperatingSystem string    `gorm:"size:36;comment:主机操作系统" json:"operatingSystem"` // 主机操作系统
	Status          int       `gorm:"comment:主机状态" json:"status"`                    // 主机状态 0:在线 1:下线

	FetchTime      time.Time `gorm:"comment:主机抓取时间" json:"fetchTime"`              // 主机抓取时间
	StartTime      time.Time `gorm:"comment:主机启动时间" json:"startTime"`              // 主机启动时间
	Agent          string    `gorm:"size:36;comment:主机agent" json:"agent"`         // 主机agent
	HostServerUrl  string    `gorm:"size:128;comment:主机服务地址" json:"hostServerUrl"` // 主机serverUrl
	OsqueryHostId  string    `gorm:"size:256;comment:os的id" json:"osqueryHostId"`  // os的id
	OsqueryVersion string    `gorm:"size:64;comment:os的版本" json:"osqueryVersion"`  // os的版本
	PlatformLike   string    `gorm:"size:64;comment:平台类型" json:"platformLike"`     // 平台类型

	CpuType      string `gorm:"size:64;comment:cpu类型" json:"cpuType"`      // cpu类型
	CpuMicrocode string `gorm:"size:64;comment:cpu微码" json:"cpuMicrocode"` // cpu微码
	PrimaryIp    string `gorm:"size:64;comment:主ip" json:"primaryIp"`      // 主ip
	PrimaryMac   string `gorm:"size:64;comment:主mac" json:"primaryMac"`    // 主mac

	// 新增的字段
	BoardModel       string `gorm:"size:64;comment:主板型号" json:"boardModel"`        // 主板型号
	BoardSerial      string `gorm:"size:64;comment:主板序列号" json:"boardSerial"`      // 主板序列号
	BoardVendor      string `gorm:"size:64;comment:主板供应商" json:"boardVendor"`      // 主板供应商
	BoardVersion     string `gorm:"size:64;comment:主板版本" json:"boardVersion"`      // 主板版本
	CpuLogicalCores  string `gorm:"size:64;comment:逻辑核心数" json:"cpuLogicalCores"`  // 逻辑核心数
	CpuPhysicalCores string `gorm:"size:64;comment:物理核心数" json:"cpuPhysicalCores"` // 物理核心数
	CpuSockets       string `gorm:"size:64;comment:cpu插槽数" json:"cpuSockets"`      // cpu插槽数
	CpuSubtype       string `gorm:"size:64;comment:cpu子类型" json:"cpuSubtype"`      // cpu子类型
	CpuBrand         string `gorm:"size:64;comment:cpu品牌" json:"cpuBrand"`         // cpu品牌
	HardwareModel    string `gorm:"size:64;comment:硬件型号" json:"hardwareModel"`     // 硬件型号
	HardwareSerial   string `gorm:"size:64;comment:硬件序列号" json:"hardwareSerial"`   // 硬件序列号
	HardwareVendor   string `gorm:"size:64;comment:硬件供应商" json:"hardwareVendor"`   // 硬件供应商
	HardwareVersion  string `gorm:"size:64;comment:硬件版本" json:"hardwareVersion"`   // 硬件版本
	PhysicalMemory   string `gorm:"size:64;comment:物理内存" json:"physicalMemory"`    // 物理内存
	UUID             string `gorm:"size:64;comment:唯一标识符" json:"uuid"`             // 唯一标识符

	TotalUptimeSeconds string `gorm:"size:64;comment:总运行秒数" json:"totalUptimeSeconds"` // 总运行秒数

	Arch          string `gorm:"size:64;comment:架构类型" json:"arch"`          // CPU 架构，例如 "arm64"
	Build         string `gorm:"size:64;comment:操作系统构建版本" json:"build"`     // 构建版本，例如 "23G80"
	KernelVersion string `gorm:"size:64;comment:内核版本" json:"kernelVersion"` // 内核版本，例如 "23.6.0"
	Major         string `gorm:"size:64;comment:操作系统主版本号" json:"major"`     // 主版本号，例如 "14"
	Minor         string `gorm:"size:64;comment:操作系统次版本号" json:"minor"`     // 次版本号，例如 "6"

	Patch    string          `gorm:"size:64;comment:补丁版本号" json:"patch"`       // 补丁版本号，可能为空
	Platform string          `gorm:"size:64;comment:平台名称" json:"platform"`     // 平台名称，例如 "darwin"
	Version  string          `gorm:"size:64;comment:完整版本号" json:"version"`     // 完整的操作系统版本，例如 "14.6"
	HostUser []HostUserModel `gorm:"type:json;comment:主机用户列表" json:"hostUser"` // 关联的 HostUser 列表
	Software []SoftwareModel `gorm:"type:json;comment:主机软件列表" json:"software"` // 关联的 Software 列表

	Disk     []DiskModel  `gorm:"type:json;comment:主机磁盘列表" json:"disk"` // 关联的 Disk 列表
	Label    []LabelModel `gorm:"many2many:host_labels" json:"label"`   // 关联的 Label 列表
	PublicIP string       `gorm:"size:64;comment:公网ip" json:"publicIp"` // 公网ip
	Country  string       `gorm:"size:64;comment:国家" json:"country"`    // 国家
	City     string       `gorm:"size:64;comment:城市" json:"city"`       // 公网ip
	Org      string       `gorm:"size:64;comment:组织" json:"org"`        // 组织

}
