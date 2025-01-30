package hosts_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"ccops/utils/jwts"
	"ccops/utils/permission"
	"fmt"
	"github.com/gin-gonic/gin"
)

type removeRequest struct {
	HostIds []uint `json:"HostIds"`
}

// 删的时候关联删除hostuser,disk,software,还有多对多的label
func (HostsApi) HostRemoveView(c *gin.Context) {
	_claims, _ := c.Get("claims")
	claims := _claims.(*jwts.CustomClaims)
	var cr removeRequest
	err := c.ShouldBindJSON(&cr)
	if err != nil {
		res.FailWithCode(res.ArgumentError, c)
		return
	}
	if !permission.IsPermissionForHosts(claims.UserID, cr.HostIds) {
		res.FailWithMessage("权限错误", c)
		return
	}

	var hostModel []models.HostModel
	count := global.DB.Find(&hostModel, "id IN ?", cr.HostIds).RowsAffected //RowsAffected有几行受到了影响
	if count == 0 {
		res.FailWithMessage("主机不存在", c)
		return
	}

	// 开启事务
	tx := global.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			res.FailWithMessage("删除失败", c)
		}
	}()

	// 执行删除操作
	if err := tx.Model(&models.HostUserModel{}).Where("host_id IN ?", cr.HostIds).Delete(&models.HostUserModel{}).Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("删除失败", c)
		return
	}
	if err := tx.Model(&models.DiskModel{}).Where("host_id IN ?", cr.HostIds).Delete(&models.DiskModel{}).Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("删除失败", c)
		return
	}
	if err := tx.Model(&models.SoftwareModel{}).Where("host_id IN ?", cr.HostIds).Delete(&models.SoftwareModel{}).Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("删除失败", c)
		return
	}
	if err := tx.Model(&models.HostLabels{}).Where("host_model_id IN ?", cr.HostIds).Delete(&models.HostLabels{}).Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("删除失败", c)
		return
	}
	if err := tx.Delete(&hostModel).Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("删除失败", c)
		return
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		res.FailWithMessage("删除失败", c)
		return
	}

	res.OkWithMessage(fmt.Sprintf("共删除 %d 个主机", count), c)
}
