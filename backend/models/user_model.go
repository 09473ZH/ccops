package models

type UserModel struct {
	MODEL
	NickName string `gorm:"size:36;comment:昵称" json:"nickName"`                       // 昵称
	UserName string `gorm:"column:username;size:36;comment:用户名" json:"username"`      // 用户名
	Password string `gorm:"size:128;comment:密码" json:"-"`                             // 密码
	Role     string `gorm:"size:128;comment:权限，1系统管理员，2服务负责人" json:"role"`            // 权限
	IsInit   int    `gorm:"size:4;default:0;comment:是否初始化，0未初始化，1已初始化" json:"isInit"` // 是否初始化  0 未初始化  1 已初始化
}
