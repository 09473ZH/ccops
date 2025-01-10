package permission

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/ctype"
)

func IsAdmin(id uint) bool {
	var role string
	global.DB.Model(&models.UserModel{}).Where("id = ?", id).Select("role").Scan(&role)
	if role == ctype.PermissionAdmin {
		return true
	}

	return false

}

// IsPermission 检查用户是否有权限操作指定主机
func IsPermission(userId uint, hostId uint) bool {
	// 首先检查是否是管理员，管理员有所有权限
	if IsAdmin(userId) {
		return true
	}

	var count int64
	global.DB.Model(&models.HostPermission{}).
		Where("user_id = ? AND host_id = ?", userId, hostId).
		Count(&count)

	return count > 0
}

// IsPermissionForHosts 检查用户是否有权限操作指定的所有主机
func IsPermissionForHosts(userId uint, hostIds []uint) bool {
	// 首先检查是否是管理员，管理员有所有权限
	if IsAdmin(userId) {
		return true
	}

	// 查询用户在请求的主机列表中有多少个权限
	var permissionCount int64
	global.DB.Model(&models.HostPermission{}).
		Where("user_id = ? AND host_id IN ?", userId, hostIds).
		Count(&permissionCount)

	return permissionCount >= int64(len(hostIds))
}
