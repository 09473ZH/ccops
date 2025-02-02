package user_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"ccops/utils/jwts"
	"ccops/utils/permission"

	"github.com/gin-gonic/gin"
)

func (UserApi) UserDisable(c *gin.Context) {
	_claims, _ := c.Get("claims")
	claims := _claims.(*jwts.CustomClaims)
	if !permission.IsAdmin(claims.UserID) {
		res.FailWithMessage("权限不足", c)
		return
	}
	id := c.Param("id")

	// 获取当前用户状态
	var user models.UserModel
	if err := global.DB.Where("id = ?", id).First(&user).Error; err != nil {
		res.FailWithMessage("用户不存在", c)
		return
	}

	// 切换用户状态
	newStatus := 1
	if user.IsEnabled == 1 {
		newStatus = 0
	}

	if err := global.DB.Model(&models.UserModel{}).
		Where("id = ?", id).
		Update("is_enabled", newStatus).Error; err != nil {
		res.FailWithMessage("用户状态切换失败", c)
		return
	}

	statusMessage := "用户已启用"
	if newStatus == 0 {
		statusMessage = "用户已禁用"
	}

	res.OkWithMessage(statusMessage, c)
}
