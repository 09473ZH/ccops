package models

import "ccops/models/ctype"

type UserModel struct {
	MODEL
	NickName string     `gorm:"size:36;comment:昵称" json:"nickName"`                       // 昵称
	UserName string     `gorm:"column:username;size:36;comment:用户名" json:"username"`      // 用户名
	Password string     `gorm:"size:128;comment:密码" json:"-"`                             // 密码
	Role     ctype.Role `gorm:"size:4;default:1;comment:权限，1管理员，2普通用户，3游客" json:"role"`   // 权限  1 管理员  2 普通用户  3 游客
	IsInit   int        `gorm:"size:4;default:0;comment:是否初始化，0未初始化，1已初始化" json:"isInit"` // 是否初始化  0 未初始化  1 已初始化
}
		