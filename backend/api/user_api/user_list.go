package user_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"

	"github.com/gin-gonic/gin"
)

// 定义请求结构体
type UserListRequest struct {
	Page  int `form:"page"`
	Limit int `form:"limit"`
}

func (UserApi) UserList(c *gin.Context) {
	var req UserListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		res.FailWithMessage("参数错误", c)
		return
	}

	// 设置默认值
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.Limit <= 0 {
		req.Limit = 10 // 默认每页10条
	}

	var users []models.UserModel
	var count int64

	// 计算总数
	global.DB.Model(&models.UserModel{}).Count(&count)

	// 分页查询用户，不再查询 Hosts
	offset := (req.Page - 1) * req.Limit
	if err := global.DB.Select("created_at", "updated_at", "id", "username", "email", "role", "is_enabled", "is_init").
		Order("created_at ASC").
		Offset(offset).
		Limit(req.Limit).
		Find(&users).Error; err != nil {
		res.FailWithMessage("获取用户列表失败", c)
		return
	}

	// 获取所有用户ID
	var userIds []uint
	for _, user := range users {
		userIds = append(userIds, user.ID)
	}

	// 批量查询用户-主机关联
	var hostPermissions []struct {
		UserID uint
		HostID uint `gorm:"column:id"`
	}
	global.DB.Table("host_permissions").
		Select("host_permissions.user_id, host_models.id").
		Joins("LEFT JOIN host_models ON host_models.id = host_permissions.host_id").
		Where("host_permissions.user_id IN ?", userIds).
		Scan(&hostPermissions)

	// 查询所有主机ID（用于系统管理员）
	var allHostIds []uint
	global.DB.Model(&models.HostModel{}).Select("id").Find(&allHostIds)

	// 查询所有标签ID（用于系统管理员）
	var allLabelIds []uint
	global.DB.Model(&models.LabelModel{}).Select("id").Find(&allLabelIds)

	// 批量查询用户-标签关联
	var labelPermissions []struct {
		UserID  uint
		LabelID uint `gorm:"column:id"`
	}
	global.DB.Table("user_labels").
		Select("user_labels.user_id, label_models.id").
		Joins("LEFT JOIN label_models ON label_models.id = user_labels.label_id").
		Where("user_labels.user_id IN ?", userIds).
		Scan(&labelPermissions)

	// 构建用户权限映射
	userPermissionsMap := make(map[uint]*models.UserPermission)
	for _, user := range users {
		userPermissionsMap[user.ID] = &models.UserPermission{
			HostIds:  make([]uint, 0),
			LabelIds: make([]uint, 0),
		}
	}

	// 填充主机权限
	for _, hp := range hostPermissions {
		userPermissionsMap[hp.UserID].HostIds = append(userPermissionsMap[hp.UserID].HostIds, hp.HostID)
	}

	// 填充标签权限
	for _, lp := range labelPermissions {
		userPermissionsMap[lp.UserID].LabelIds = append(userPermissionsMap[lp.UserID].LabelIds, lp.LabelID)
	}

	// 更新用户权限
	for i := range users {
		if users[i].Role == "系统管理员" {
			// 系统管理员拥有所有主机和标签权限
			users[i].Permissions = models.UserPermission{
				HostIds:  allHostIds,
				LabelIds: allLabelIds,
			}
		} else {
			// 普通用户使用查询到的权限
			if perms, exists := userPermissionsMap[users[i].ID]; exists {
				users[i].Permissions = *perms
			} else {
				// 确保即使没有权限也返回空数组而不是 null
				users[i].Permissions = models.UserPermission{
					HostIds:  make([]uint, 0),
					LabelIds: make([]uint, 0),
				}
			}
		}
	}

	res.OkWithList(users, count, c)
}
