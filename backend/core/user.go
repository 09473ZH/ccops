package core

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/ctype"
	"ccops/utils/pwd"
)

func InitUser() {
	var user models.UserModel
	global.DB.Model(&models.UserModel{}).Where("username = ?", "admin").First(&user)
	if user.ID != 0 {
		//有数据,不用初始化
		return
	}
	//没数据,初始化
	global.DB.Create(&models.UserModel{
		Username:  "admin",
		Password:  pwd.HashPwd("admin"),
		Role:      ctype.PermissionAdmin,
		IsInit:    true,
		IsEnabled: true,
	})

}
