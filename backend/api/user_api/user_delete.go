package user_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"ccops/utils/jwts"
	"ccops/utils/permission"

	"github.com/gin-gonic/gin"
)

func (UserApi) UserDelete(c *gin.Context) {
	_claims, _ := c.Get("claims")
	claims := _claims.(*jwts.CustomClaims)
	if !permission.IsAdmin(claims.UserID) {
		res.FailWithMessage("权限不足", c)
		return
	}

	id := c.Param("id")

	// 开启事务
	tx := global.DB.Begin()

	// 删除用户权限
	if err := tx.Where("user_id = ?", id).Delete(&models.HostPermission{}).Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("删除用户权限失败", c)
		return
	}

	// 删除用户
	if err := tx.Delete(&models.UserModel{}, id).Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("用户删除失败", c)
		return
	}

	// 提交事务
	tx.Commit()

	res.OkWithMessage("用户已删除", c)
}
