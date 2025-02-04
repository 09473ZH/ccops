package user_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/ctype"
	"ccops/models/res"
	"ccops/utils/jwts"
	"ccops/utils/permission"

	"github.com/gin-gonic/gin"
)

type AssignPermissionReq struct {
	UserId          uint   `json:"userId"`
	Role            string `json:"role"`
	PermissionHosts []uint `json:"permissionHosts"`
	Labels          []uint `json:"labels"`
}

func (UserApi) AssignPermission(c *gin.Context) {
	_claims, _ := c.Get("claims")
	claims := _claims.(*jwts.CustomClaims)
	if !permission.IsAdmin(claims.UserID) {
		res.FailWithMessage("权限不足", c)
		return
	}
	var cr AssignPermissionReq
	if err := c.ShouldBindJSON(&cr); err != nil {
		res.FailWithMessage(err.Error(), c)
		return
	}
	if cr.Role == ctype.PermissionAdmin {
		global.DB.Model(&models.UserModel{}).Where("id = ?", cr.UserId).Update("role", ctype.PermissionAdmin)
		res.OkWithMessage("分配权限成功", c)
		return
	} else if cr.Role == ctype.PermissionServiceManager {
		// 开启事务
		tx := global.DB.Begin()

		// 处理主机权限
		// 获取用户当前的权限列表
		var currentPermissions []models.HostPermission
		tx.Where("user_id = ?", cr.UserId).Find(&currentPermissions)

		// 将当前权限转换为map，方便查找
		currentMap := make(map[uint]bool)
		for _, p := range currentPermissions {
			currentMap[p.HostId] = true
		}

		// 将新权限转换为map
		newMap := make(map[uint]bool)
		for _, hostId := range cr.PermissionHosts {
			newMap[hostId] = true
		}

		// 找出需要删除的权限
		var toDelete []uint
		for _, p := range currentPermissions {
			if !newMap[p.HostId] {
				toDelete = append(toDelete, p.HostId)
			}
		}

		// 找出需要新增的权限
		var toAdd []models.HostPermission
		for hostId := range newMap {
			if !currentMap[hostId] {
				toAdd = append(toAdd, models.HostPermission{
					UserId: cr.UserId,
					HostId: hostId,
				})
			}
		}

		// 执行删除操作
		if len(toDelete) > 0 {
			if err := tx.Where("user_id = ? AND host_id IN ?", cr.UserId, toDelete).
				Delete(&models.HostPermission{}).Error; err != nil {
				tx.Rollback()
				res.FailWithMessage("更新主机权限失败", c)
				return
			}
		}

		// 执行新增操作
		if len(toAdd) > 0 {
			if err := tx.Create(&toAdd).Error; err != nil {
				tx.Rollback()
				res.FailWithMessage("更新主机权限失败", c)
				return
			}
		}

		// 处理标签权限
		// 获取用户当前的标签列表
		var currentLabels []models.UserLabels
		tx.Where("user_id = ?", cr.UserId).Find(&currentLabels)

		// 将当前标签转换为map
		currentLabelMap := make(map[uint]bool)
		for _, l := range currentLabels {
			currentLabelMap[l.LabelID] = true
		}

		// 将新标签转换为map
		newLabelMap := make(map[uint]bool)
		for _, labelId := range cr.Labels {
			newLabelMap[labelId] = true
		}

		// 找出需要删除的标签
		var toDeleteLabels []uint
		for _, l := range currentLabels {
			if !newLabelMap[l.LabelID] {
				toDeleteLabels = append(toDeleteLabels, l.LabelID)
			}
		}

		// 找出需要新增的标签
		var toAddLabels []models.UserLabels
		for labelId := range newLabelMap {
			if !currentLabelMap[labelId] {
				toAddLabels = append(toAddLabels, models.UserLabels{
					UserID:  cr.UserId,
					LabelID: labelId,
				})
			}
		}

		// 执行标签删除操作
		if len(toDeleteLabels) > 0 {
			if err := tx.Where("user_id = ? AND label_id IN ?", cr.UserId, toDeleteLabels).
				Delete(&models.UserLabels{}).Error; err != nil {
				tx.Rollback()
				res.FailWithMessage("更新标签权限失败", c)
				return
			}
		}

		// 执行标签新增操作
		if len(toAddLabels) > 0 {
			if err := tx.Create(&toAddLabels).Error; err != nil {
				tx.Rollback()
				res.FailWithMessage("更新标签权限失败", c)
				return
			}
		}

		// 更新用户角色
		if err := tx.Model(&models.UserModel{}).
			Where("id = ?", cr.UserId).
			Update("role", ctype.PermissionServiceManager).Error; err != nil {
			tx.Rollback()
			res.FailWithMessage("更新权限失败", c)
			return
		}

		// 提交事务
		tx.Commit()

		res.OkWithMessage("分配权限成功", c)
		return
	}
	res.FailWithMessage("未知用户类型", c)
}
