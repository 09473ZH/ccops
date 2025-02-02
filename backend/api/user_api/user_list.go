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

	// 查询所有主机
	var allHosts []models.HostModel
	global.DB.Find(&allHosts)

	// 分页查询
	offset := (req.Page - 1) * req.Limit
	if err := global.DB.Preload("Hosts").Select("created_at", "updated_at", "id", "username", "email", "role", "is_enabled").Order("created_at ASC").Offset(offset).Limit(req.Limit).Find(&users).Error; err != nil {
		res.FailWithMessage("获取用户列表失败", c)
		return
	}

	// 如果用户是管理员，加载所有主机
	for i := range users {
		if users[i].Role == "系统管理员" {
			users[i].Hosts = allHosts
		}
	}

	res.OkWithList(users, count, c)
}
