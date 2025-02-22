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
		ID     uint   `gorm:"column:id"`
		Name   string `gorm:"column:name"`
	}
	global.DB.Table("host_permissions").
		Select("host_permissions.user_id, host_models.id, host_models.name").
		Joins("LEFT JOIN host_models ON host_models.id = host_permissions.host_id").
		Where("host_permissions.user_id IN ?", userIds).
		Scan(&hostPermissions)

	// 查询所有主机（用于系统管理员）
	var allHostModels []struct {
		ID   uint   `gorm:"column:id"`
		Name string `gorm:"column:name"`
	}
	global.DB.Model(&models.HostModel{}).Select("id, name").Find(&allHostModels)

	// 查询所有标签（用于系统管理员）
	var allLabelModels []struct {
		ID   uint   `gorm:"column:id"`
		Name string `gorm:"column:name"`
	}
	global.DB.Model(&models.LabelModel{}).Select("id, name").Find(&allLabelModels)

	// 批量查询用户-标签关联
	var labelPermissions []struct {
		UserID uint
		models.LabelModel
	}
	global.DB.Table("user_labels").
		Select("user_labels.user_id, label_models.*").
		Joins("LEFT JOIN label_models ON label_models.id = user_labels.label_id").
		Where("user_labels.user_id IN ?", userIds).
		Scan(&labelPermissions)

	// 构建用户权限映射
	userPermissionsMap := make(map[uint]*models.Permissions)
	for _, user := range users {
		userPermissionsMap[user.ID] = &models.Permissions{
			Hosts:  make([]models.NameID, 0),
			Labels: make([]models.NameID, 0),
		}
	}

	// 填充主机权限
	for _, hp := range hostPermissions {
		userPermissionsMap[hp.UserID].Hosts = append(userPermissionsMap[hp.UserID].Hosts, models.NameID{
			ID:   hp.ID,
			Name: hp.Name,
		})
	}

	// 填充标签权限
	for _, lp := range labelPermissions {
		userPermissionsMap[lp.UserID].Labels = append(userPermissionsMap[lp.UserID].Labels, models.NameID{
			ID:   lp.ID,
			Name: lp.Name,
		})
	}

	// 更新用户权限
	for i := range users {
		if users[i].Role == "系统管理员" {
			// 系统管理员拥有所有主机权限
			users[i].Permissions.Hosts = make([]models.NameID, len(allHostModels))
			for j, host := range allHostModels {
				users[i].Permissions.Hosts[j] = models.NameID{
					ID:   host.ID,
					Name: host.Name,
				}
			}
			// 系统管理员拥有所有标签权限
			users[i].Permissions.Labels = make([]models.NameID, len(allLabelModels))
			for j, label := range allLabelModels {
				users[i].Permissions.Labels[j] = models.NameID{
					ID:   label.ID,
					Name: label.Name,
				}
			}
		} else {
			// 普通用户使用查询到的权限
			if perms, exists := userPermissionsMap[users[i].ID]; exists {
				users[i].Permissions = *perms
			} else {
				// 确保即使没有权限也返回空数组而不是 null
				users[i].Permissions = models.Permissions{
					Hosts:  make([]models.NameID, 0),
					Labels: make([]models.NameID, 0),
				}
			}
		}
	}

	res.OkWithList(users, count, c)
}
