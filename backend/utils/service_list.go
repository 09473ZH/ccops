package utils

import (
	"ccops/global"
	"ccops/models"
	"fmt"
	"gorm.io/gorm"
)

type Option struct {
	models.PageInfo          // 分页查询
	Likes           []string // 需要模糊匹配的字段列表
	Debug           bool     // 是否打印sql
	Where           *gorm.DB // 额外的查询
	Preload         []string // 预加载的字段列表
}

// ComList 查询列表
func ComList[T any](model T, option Option) (list []T, count int64, err error) {
	// 查model中非空字段
	query := global.DB.Where(model)
	if option.Debug {
		query = query.Debug() // 如果query等于这个，后面的每条操作数据库的语句都会打印出它的sql语句
	}

	// 默认按照时间往后排
	if option.Sort == "" {
		option.Sort = "created_at desc" // 降序排列
	}

	// 如果有高级查询就加上
	if option.Where != nil {
		query = query.Where(option.Where)
	}

	// 模糊匹配
	if option.Key != "" {
		likeQuery := global.DB.Where("")

		for index, column := range option.Likes {
			// 第一个模糊匹配和前面的关系是and关系，后面的和前面的模糊匹配是or的关系
			if index == 0 {
				likeQuery.Where(fmt.Sprintf("%s like ?", column), fmt.Sprintf("%%%s%%", option.Key))
			} else {
				likeQuery.Or(fmt.Sprintf("%s like ?", column), fmt.Sprintf("%%%s%%", option.Key))
			}
		}
		// 整个模糊匹配它是一个整体
		query = query.Where(likeQuery)
	}

	// 查列表，获取总数
	count = query.Find(&list).RowsAffected

	// 预加载
	for _, preload := range option.Preload {
		query = query.Preload(preload)
	}

	// 计算偏移
	// 偏移量表示从查询结果中的第几条记录开始获取数据
	// 例如这里的页码是2，那就是从第十条，但不包含第十条开始获取数据，也就是11条开始
	offset := (option.Page - 1) * option.Limit

	// 如果option.Limit为零，不做限制
	if option.Limit > 0 {
		err = query.Limit(option.Limit).
			Offset(offset).
			Order(option.Sort).Find(&list).Error
	} else {
		err = query.Offset(offset).
			Order(option.Sort).Find(&list).Error
	}

	return list, int64(len(list)), err
}
