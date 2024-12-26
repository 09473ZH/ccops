package models

type TargetAssociationModel struct {
	MODEL
	TaskID uint   `gorm:"not null;index;comment:任务ID"`         // 关联任务表
	HostIP string `gorm:"size:128;comment:目标IP" json:"hostIp"` // 主机的 IP 地址

}
