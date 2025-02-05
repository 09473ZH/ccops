package user_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"ccops/utils/jwts"
	"ccops/utils/pwd"
	"github.com/gin-gonic/gin"
)

type InitPasswordRequest struct {
	Password        string `json:"password" binding:"required"`
	ConfirmPassword string `json:"confirmPassword" binding:"required"`
}

func (UserApi) InitUserPassword(c *gin.Context) {
	_claims, _ := c.Get("claims")
	claims := _claims.(*jwts.CustomClaims)
	var cr InitPasswordRequest

	if err := c.ShouldBindJSON(&cr); err != nil {
		res.FailWithMessage(err.Error(), c)
		return
	}
	var my models.UserModel
	global.DB.Model(&models.UserModel{}).First(&my, claims.UserID)

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
