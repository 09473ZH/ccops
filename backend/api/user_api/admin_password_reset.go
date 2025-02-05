package user_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"ccops/utils/jwts"
	"ccops/utils/permission"
	"ccops/utils/pwd"

	"github.com/gin-gonic/gin"
)

type ResetPasswordRequest struct {
	Password string `json:"password" binding:"required"`
}

func (UserApi) ResetUserPasswordByAdmin(c *gin.Context) {
	_claims, _ := c.Get("claims")
	claims := _claims.(*jwts.CustomClaims)
	if !permission.IsAdmin(claims.UserID) {
		res.FailWithMessage("权限不足", c)
		return
	}
	var cr ResetPasswordRequest
	id := c.Param("id")
	if err := c.ShouldBindJSON(&cr); err != nil {
		res.FailWithMessage(err.Error(), c)
		return
	}
	err := global.DB.Model(&models.UserModel{}).Where("id = ?", id).Updates(map[string]interface{}{
		"password": pwd.HashPwd(cr.Password),
	}).Error

	if err != nil {
		res.FailWithMessage("修改密码失败", c)
		return
	}
	res.OkWithMessage("成功", c)

}
