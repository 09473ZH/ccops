package models

import "gorm.io/gorm"

type SystemUserModel struct {
    gorm.Model
    HostID      uint   `json:"host_id" gorm:"index"` // 关联主机ID
    UID         string `json:"uid"`                   // 用户ID
    Username    string `json:"username"`              // 用户名
    GID         string `json:"gid"`                   // 组ID
    Description string `json:"description"`           // 描述
    Directory   string `json:"directory"`             // 主目录
    Shell       string `json:"shell"`                 // Shell类型
} 