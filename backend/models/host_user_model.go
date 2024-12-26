package models

// HostUser 表
type HostUserModel struct {
	MODEL
	HostID    uint   `gorm:"index;comment:主机ID" json:"hostId"` // 关联 HostModel 表
	UserName  string `json:"username"`                         // 用户名
	GroupName string `json:"groupName"`                        // 用户组
	Shell     string `json:"shell"`                            // 用户 Shell

}
