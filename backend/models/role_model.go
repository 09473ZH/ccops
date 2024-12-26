package models

import (
	"ccops/global"
	"fmt"
	"gorm.io/datatypes"
)

type RoleModel struct {
	MODEL
	Name                string                      `gorm:"size:128;comment:配置名称" json:"name"`         // 配置名称
	Description         string                      `gorm:"type:text;comment:配置描述" json:"description"` // 配置描述
	Tags                datatypes.JSONSlice[string] `gorm:"type:json;comment:配置标签" json:"tags"`        // 配置标签
	Revision            []RoleRevisionModel         `gorm:"-" json:"revision"`
	ExistActiveRevision bool                        `gorm:"-" json:"existActiveRevision"`
}

// 获取配置名称
func GetRoleNamesByIds(roleIDs []uint) (map[uint]string, error) {
	var roles []RoleModel
	roleMap := make(map[uint]string)

	if err := global.DB.Model(&RoleModel{}).Where("id IN ?", roleIDs).Find(&roles).Error; err != nil {
		return nil, fmt.Errorf("获取角色名称失败: %w", err)
	}

	for _, role := range roles {
		roleMap[role.ID] = role.Name
	}
	return roleMap, nil
}
