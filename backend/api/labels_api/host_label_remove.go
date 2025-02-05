package hosts_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"ccops/utils/jwts"
	"ccops/utils/permission"

	"github.com/gin-gonic/gin"
)

// 删之前查标签下有没有标签，有的话不给删
func (HostsApi) HostLabelRemoveView(c *gin.Context) {
	_claims, _ := c.Get("claims")
	claims := _claims.(*jwts.CustomClaims)
	if !permission.IsAdmin(claims.UserID) {
		res.FailWithMessage("权限错误", c)
		return
	}
	id := c.Param("id")

	// 开始事务
	tx := global.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback() // 在发生 panic 时回滚事务
			res.FailWithMessage("发生错误，已回滚事务", c)
			c.Abort()
		}
	}()

	var hostLabels models.HostLabels
	// 注意：这里应该检查查询是否成功，并处理可能的错误
	tx.Model(&models.HostLabels{}).Where("label_model_id = ?", id).First(&hostLabels)

	if hostLabels.LabelModelID != 0 {
		tx.Rollback()
		res.FailWithMessage("标签下有主机,禁止直接删除", c)
		return
	}

	// 执行删除操作
	if err := tx.Delete(&models.LabelModel{}, "id = ?", id).Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("删除标签模型失败", c)
		return
	}

	if err := tx.Delete(&models.HostLabels{}, "label_model_id = ?", id).Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("删除标签关联失败", c)
		return
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		res.FailWithMessage("提交事务失败", c)
		return
	}

	res.OkWithMessage("删除成功", c)
}
