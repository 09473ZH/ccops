package models

import "gorm.io/gorm"

type UserKeyModel struct {
    gorm.Model
    HostID     uint   `gorm:"index;comment:主机ID" json:"hostId"`           // 关联主机ID
    Username   string `gorm:"index;comment:用户名" json:"username"`          // 用户名
    Key        string `gorm:"type:text;comment:SSH公钥" json:"key"`         // SSH公钥，使用text类型存储长文本
    Comment    string `gorm:"size:255;comment:公钥注释" json:"comment"`      // 注释
    Algorithm  string `gorm:"size:32;comment:加密算法" json:"algorithm"`     // 算法类型
} 