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

// GetUserPermissionHostIds 获取用户所有有权限的主机ID（包括直接权限和标签权限）
func GetUserPermissionHostIds(userId uint) []uint {
	// 获取直接分配的主机权限
	var directHostIds []uint
	global.DB.Model(&models.HostPermission{}).
		Where("user_id = ?", userId).
		Pluck("host_id", &directHostIds)

	// 获取用户的标签
	var labelIds []uint
	global.DB.Model(&models.UserLabels{}).
		Where("user_id = ?", userId).
		Pluck("label_id", &labelIds)

	// 如果没有标签权限，直接返回直接权限
	if len(labelIds) == 0 {
		return directHostIds
	}

	// 获取标签下的所有主机ID
	var labelHostIds []uint
	global.DB.Table("host_labels").
		Where("label_id IN ?", labelIds).
		Pluck("host_id", &labelHostIds)

	// 合并两个切片并去重
	hostMap := make(map[uint]bool)
	for _, id := range directHostIds {
		hostMap[id] = true
	}
	for _, id := range labelHostIds {
		hostMap[id] = true
	}

	// 转换回切片
	var result []uint
	for id := range hostMap {
		result = append(result, id)
	}

	return result
}

// IsPermission 检查用户是否有权限操作指定主机
func IsPermission(userId uint, hostId uint) bool {
	// 首先检查是否是管理员，管理员有所有权限
	if IsAdmin(userId) {
		return true
	}

	// 获取用户所有有权限的主机ID
	permissionHostIds := GetUserPermissionHostIds(userId)

	// 检查目标主机是否在权限列表中
	for _, id := range permissionHostIds {
		if id == hostId {
			return true
		}
	}

	return false
}

// IsPermissionForHosts 检查用户是否有权限操作指定的所有主机
func IsPermissionForHosts(userId uint, hostIds []uint) bool {
	// 首先检查是否是管理员，管理员有所有权限
	if IsAdmin(userId) {
		return true
	}

	// 获取用户所有有权限的主机ID
	permissionHostIds := GetUserPermissionHostIds(userId)

	// 将权限主机ID转换为map，方便查找
	permissionMap := make(map[uint]bool)
	for _, id := range permissionHostIds {
		permissionMap[id] = true
	}

	// 检查所有请求的主机是否都在权限列表中
	for _, hostId := range hostIds {
		if !permissionMap[hostId] {
			return false
		}
	}

	return true
}
