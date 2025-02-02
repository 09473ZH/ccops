package user_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"ccops/utils/pwd"

	"github.com/gin-gonic/gin"
)

type ChangePasswordRequest struct {
	Password string `json:"password" binding:"required"`
}

func (UserApi) ChangePassword(c *gin.Context) {
	var cr ChangePasswordRequest
	id := c.Param("id")
	if err := c.ShouldBindJSON(&cr); err != nil {
		res.FailWithMessage(err.Error(), c)
		return
	}
	err := global.DB.Model(&models.UserModel{}).Where("id = ?", id).Updates(map[string]interface{}{
		"password": pwd.HashPwd(cr.Password),
		"is_init":  1,
	}).Error

	if err != nil {
		res.FailWithMessage("修改密码失败", c)
		return
	}
	res.OkWithMessage("成功", c)

}
