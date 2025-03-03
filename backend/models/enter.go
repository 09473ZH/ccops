package models

import "time"

type MODEL struct {
	ID        uint      `gorm:"primaryKey;comment:id" json:"id,select($any)" structs:"-"` // 主键ID
	CreatedAt time.Time `gorm:"comment:创建时间" json:"createdAt,select($any)" structs:"-"`   // 创建时间
	UpdatedAt time.Time `gorm:"comment:更新时间" json:"updatedAt" structs:"-"`                // 更新时间
}
type RemoveRequest struct {
	IDList []uint `json:"idList"`
}

type IDRequest struct {
	ID uint `json:"id" form:"id" uri:"id"`
}

type ESIDRequest struct {
	ID string `json:"id" form:"id" uri:"id"`
}
type ESIDListRequest struct {
	IDList []string `json:"idList" binding:"required"`
}

type PageInfo struct {
	Page  int      `form:"page"`
	Key   string   `form:"key"`
	Limit int      `form:"limit"`
	Sort  string   `form:"sort"`
	Tags  []string `form:"tags"` // 标签筛选
}

const (
	AdminRole   = 1 //管理员
	UserRole    = 2 //普通用户
	TouristRole = 3 //游客
)

type Options[T any] struct {
	Label string `json:"label"`
	Value T      `json:"value"`
}
type NewOptions[T any] struct {
	Label string `json:"label"`
	Value T      `json:"value"`
}

// RemoveDuplicatesUint 接收一个 []uint 类型的切片，并返回一个去重后的新切片
func RemoveDuplicatesUint(slice []uint) []uint {
	// 创建一个map来跟踪已经遇到的元素
	seen := make(map[uint]struct{})
	// 创建一个新的切片来存储唯一元素
	result := []uint{}

	// 遍历原始切片
	for _, v := range slice {
		// 如果元素尚未在map中出现，则将其添加到结果切片和map中
		if _, ok := seen[v]; !ok {
			seen[v] = struct{}{}
			result = append(result, v)
		}
	}

	return result
}

type NameID struct {
	Name string `json:"name"`
	ID   uint   `json:"id"`
}
