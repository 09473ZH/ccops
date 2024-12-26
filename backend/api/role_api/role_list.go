package role_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"github.com/gin-gonic/gin"
)

func (RoleApi) RoleList(c *gin.Context) {
	var (
		pageInfo models.PageInfo
		RoleList []models.RoleModel
		total    int64
	)

	// 绑定请求参数到 PageInfo 结构体
	if err := c.ShouldBind(&pageInfo); err != nil {
		res.FailWithMessage("参数错误", c)
		return
	}

	// 设置默认的 Limit 值
	if pageInfo.Limit == 0 {
		pageInfo.Limit = 10 // 可以根据需要设置默认值，例如 10 或 20
	}

	// 构建查询条件
	query := global.DB.Model(&models.RoleModel{})

	// 模糊匹配 Name
	if pageInfo.Key != "" {
		query = query.Where("name LIKE ?", "%"+pageInfo.Key+"%")
	}

	// 处理 Tags 筛选（假设 Tags 是 JSON 字段）
	if pageInfo.Tags != nil && len(pageInfo.Tags) > 0 {
		query = query.Where("tags @> ?", pageInfo.Tags) // 使用 PostgreSQL 的 JSONB 操作符
	}

	// 获取总记录数
	query.Count(&total)

	// 分页查询
	query = query.Offset((pageInfo.Page - 1) * pageInfo.Limit).Limit(pageInfo.Limit)

	// 执行查询
	if err := query.Select("id, created_at, updated_at, name, description, tags").Order("created_at DESC").Find(&RoleList).Error; err != nil {
		res.FailWithMessage("查询失败", c)
		return
	}

	var newResults []models.RoleModel
	for _, role := range RoleList {
		var roleRevision models.RoleRevisionModel
		global.DB.Model(&models.RoleRevisionModel{}).Where("role_id = ? AND is_active = ?", role.ID, 1).First(&roleRevision)
		if roleRevision.ID > 0 {
			role.ExistActiveRevision = true
		} else {
			role.ExistActiveRevision = false
		}
		newResults = append(newResults, role)

	}

	// 返回结果
	res.OkWithList(newResults, total, c)
}
