package user_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"ccops/utils/jwts"
	"ccops/utils/pwd"
	"github.com/gin-gonic/gin"
)

type ChangePasswordRequest struct {
	OldPassword     string `json:"oldPassword"`
	Password        string `json:"password" binding:"required"`
	ConfirmPassword string `json:"confirmPassword" binding:"required"`
}

func (UserApi) ChangeUserPassword(c *gin.Context) {
	_claims, _ := c.Get("claims")
	claims := _claims.(*jwts.CustomClaims)
	var cr ChangePasswordRequest

	if err := c.ShouldBindJSON(&cr); err != nil {
		res.FailWithMessage(err.Error(), c)
		return
	}
	var my models.UserModel
	global.DB.Model(&models.UserModel{}).First(&my, claims.UserID)
	//未初始化用户不需要再输入旧密码
	if my.IsInit == true {
		if !pwd.CheckPwd(my.Password, cr.OldPassword) {
			//旧密码校验错误
			res.FailWithMessage("旧密码错误", c)
			return
		}
	}
	if cr.Password != cr.ConfirmPassword {
		//两次密码不一致
		res.FailWithMessage("两次密码不一致", c)
		return
	}
	my.Password = pwd.HashPwd(cr.Password)
	my.IsInit = true
	if err := global.DB.Save(&my).Error; err != nil {
		res.FailWithMessage("修改密码失败", c)
		return
	}

	res.OkWithMessage("成功", c)

}
