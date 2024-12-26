package user_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/ctype"
	"ccops/models/res"
	"ccops/utils/pwd"
	"github.com/gin-gonic/gin"
)

type UserRegister struct {
	UserName   string `json:"username" binding:"required" msg:"请输入用户名"`
	Password   string `json:"password"  binding:"required" msg:"请输入密码"`
	RePassword string `json:"rePassword" binding:"required" msg:"请确认密码"`
}

func (UserApi) UserRegister(c *gin.Context) {
	var cr UserRegister
	err := c.ShouldBindJSON(&cr)
	if err != nil {

		res.FailWithError(err, &cr, c)
		return

	}
	//判断用户名是否存在
	var userModel models.UserModel
	err1 := global.DB.Take(&userModel, "username = ?", cr.UserName).Error

	if err1 == nil {
		//找到同名用户
		res.FailWithMessage("用户名已存在，请重新输入用户名", c)
		return
	}

	if cr.Password != cr.RePassword {

		res.FailWithMessage("两次密码不一致，请重新输入", c)
		return
	}
	//对密码进行hash
	hashPwd := pwd.HashPwd(cr.Password)
	//注册的用户一律先视为普通用户
	role := ctype.PermissionUser
	//头像先默认

	//入库

	err = global.DB.Create(&models.UserModel{
		UserName: cr.UserName,
		NickName: "注册用户",
		Password: hashPwd,

		Role: role,
	}).Error

	if err != nil {
		global.Log.Error(err)
		return
	}
	global.Log.Infof("注册成功")
	res.Ok(nil, "注册成功", c)
}
