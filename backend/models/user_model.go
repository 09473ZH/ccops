package models

type UserModel struct {
	MODEL

	UserName  string      `gorm:"column:username;size:36;comment:用户名" json:"username"`                                 // 用户名
	Password  string      `gorm:"size:128;comment:密码" json:"-"`                                                        // 密码
	Role      string      `gorm:"size:128;default:用户;comment:权限，1系统管理员，用户" json:"role"`                                // 权限
	IsInit    int         `gorm:"size:4;default:0;comment:是否初始化，0未初始化，1已初始化" json:"isInit"`                            // 是否初始化  0 未初始化  1 已初始化
	IsEnabled int         `gorm:"default:1;comment:用户是否启用，1启用，0禁用" json:"isEnabled"`                                   // 用户是否启用，默认启用
	Email     string      `gorm:"size:128;comment:邮箱" json:"email"`                                                    // 邮箱
	Hosts     []HostModel `gorm:"many2many:host_permissions;joinForeignKey:UserId;joinReferences:HostId" json:"hosts"` // 关联的主机列表

	//是否启用
}
