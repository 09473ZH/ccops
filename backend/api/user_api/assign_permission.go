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
				res.FailWithMessage("更新权限失败", c)
				return
			}
		}

		// 执行新增操作
		if len(toAdd) > 0 {
			if err := tx.Create(&toAdd).Error; err != nil {
				tx.Rollback()
				res.FailWithMessage("更新权限失败", c)
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
}
