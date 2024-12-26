package role_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type PlaybookCreateRequest struct {
	Name        string   `json:"name" binding:"required"`
	Description string   `json:"description"`
	Tags        []string `json:"tags"`
}

func (RoleApi) CreateRoleView(c *gin.Context) {
	var cr PlaybookCreateRequest
	if err := c.ShouldBindJSON(&cr); err != nil {
		res.FailWithMessage(err.Error(), c)
		return
	}

	var role models.RoleModel

	// 启动事务
	tx := global.DB.Begin()
	if tx.Error != nil {
		res.FailWithMessage("无法开启数据库事务", c)
		return
	}

	// 判断配置是否已存在
	if err := tx.Model(&models.RoleModel{}).Where("name = ?", cr.Name).First(&role).Error; err != nil && err != gorm.ErrRecordNotFound {
		tx.Rollback() // 回滚事务
		res.FailWithMessage("查询配置失败", c)
		return
	}

	if role.ID != 0 {
		tx.Rollback() // 回滚事务
		res.FailWithMessage("配置名称已存在", c)
		return
	}

	// 校验通过，创建配置
	role.Name = cr.Name
	role.Description = cr.Description
	role.Tags = cr.Tags
	if err := tx.Create(&role).Error; err != nil {
		tx.Rollback() // 回滚事务
		res.FailWithMessage("创建配置失败", c)
		return
	}

	// 创建配置版本
	var playbookRevision models.RoleRevisionModel
	playbookRevision.RoleID = role.ID
	if err := tx.Create(&playbookRevision).Error; err != nil {
		tx.Rollback() // 回滚事务
		res.FailWithMessage("创建配置版本失败", c)
		return
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		res.FailWithMessage("提交事务失败", c)
		return
	}

	// 返回成功响应
	res.OkWithMessage("配置创建成功", c)
}
