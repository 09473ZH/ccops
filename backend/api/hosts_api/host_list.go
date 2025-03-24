package hosts_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"ccops/utils/jwts"
	"ccops/utils/permission"
	"time"

	"github.com/gin-gonic/gin"
)

type HostListRequest struct {
	models.PageInfo

	LabelIDs    []uint `form:"labelIds"`
	Logic       string `form:"logic"`       // "and" 表示交集, "or" 表示并集
	WithMetrics bool   `form:"withMetrics"` // 是否包含监控指标数据
}

type HostListResponse struct {
	ID              uint                `gorm:"primaryKey;comment:id" json:"id"`               // 主键ID
	CreatedAt       time.Time           `json:"createdAt"`                                     // 创建时间
	UpdatedAt       time.Time           `json:"updatedAt"`                                     // 更新时间
	Name            string              `gorm:"size:36;comment:主机名称" json:"name"`              // 主机名称
	OperatingSystem string              `gorm:"size:36;comment:主机操作系统" json:"operatingSystem"` // 主机操作系统
	HostServerUrl   string              `gorm:"size:128;comment:主机服务地址" json:"hostServerUrl"`  // 主机serverUrl
	CpuBrand        string              `gorm:"size:64;comment:cpu品牌" json:"cpuBrand"`         // cpu品牌
	Disk            []models.DiskModel  `gorm:"type:json;comment:主机磁盘列表" json:"disk"`          // 关联的 Disk 列表
	Label           []models.LabelModel `gorm:"many2many:host_labels" json:"label"`            // 关联的 Label 列表
	FetchTime       time.Time           `gorm:"comment:主机抓取时间" json:"fetchTime"`               // 主机抓取时间
	StartTime       time.Time           `gorm:"comment:主机启动时间" json:"startTime"`               // 主机启动时间
	PhysicalMemory  string              `gorm:"size:64;comment:物理内存" json:"physicalMemory"`    // 物理内存
	KernelVersion   string              `gorm:"size:64;comment:内核版本" json:"kernelVersion"`     // 内核版本，例如 "23.6.0"
	Metrics         interface{}         `gorm:"-" json:"metrics,omitempty"`                    // 监控指标数据
}

func (HostsApi) HostListView(c *gin.Context) {
	_claims, _ := c.Get("claims")
	claims := _claims.(*jwts.CustomClaims)
	var cr HostListRequest
	if err := c.ShouldBindQuery(&cr); err != nil {
		res.FailWithMessage("参数错误", c)
		return
	}

	// 设置默认值
	if cr.Page <= 0 {
		cr.Page = 1
	}
	if cr.Limit <= 0 {
		cr.Limit = 0 // 0 表示不限制数量
	}

	var hosts []HostListResponse
	var count int64

	// 基础查询
	query := global.DB.Model(&models.HostModel{}).
		Select("id, created_at,updated_at,name,host_server_url,operating_system, status, cpu_brand, fetch_time, start_time, physical_memory, kernel_version")

	// 如果不是管理员，只能查看有权限的主机
	if !permission.IsAdmin(claims.UserID) {
		permissionHostIds := permission.GetUserPermissionHostIds(claims.UserID)
		if len(permissionHostIds) == 0 {
			res.OkWithList([]HostListResponse{}, 0, c)
			return
		}
		query = query.Where("id IN ?", permissionHostIds)
	}

	// 模糊匹配
	if cr.Key != "" {
		query = query.Where("name LIKE ?", "%"+cr.Key+"%")
	}

	// 标签筛选
	if len(cr.LabelIDs) > 0 {
		if cr.Logic == "and" {
			// 交集筛选
			query = query.Joins("JOIN host_labels ON host_labels.host_model_id = host_models.id").
				Where("host_labels.label_model_id IN (?)", cr.LabelIDs).
				Group("host_models.id").
				Having("COUNT(DISTINCT host_labels.label_model_id) = ?", len(cr.LabelIDs))
		} else {
			// 并集筛选
			query = query.Joins("JOIN host_labels ON host_labels.host_model_id = host_models.id").
				Where("host_labels.label_model_id IN (?)", cr.LabelIDs).
				Group("host_models.id")
		}
	}

	// 计算总数
	query.Count(&count)

	// 分页查询
	offset := (cr.Page - 1) * cr.Limit
	if cr.Limit > 0 {
		query = query.Offset(offset).Limit(cr.Limit)
	}

	// 排序处理
	if cr.Sort != "" {
		query = query.Order(cr.Sort)
	} else {
		query = query.Order("created_at DESC") // 默认按创建时间降序
	}

	// 执行查询
	if err := query.Find(&hosts).Error; err != nil {
		res.FailWithMessage("查询失败", c)
		return
	}

	// 预加载关联数据（非外键关联，单独查询）
	for i := range hosts {
		var diskListInfo []models.DiskModel
		global.DB.Model(models.DiskModel{}).Where("host_id = ?", hosts[i].ID).Find(&diskListInfo)
		hosts[i].Disk = diskListInfo

		var labelListInfo []models.LabelModel
		global.DB.Model(&models.LabelModel{}).Joins("JOIN host_labels ON host_labels.label_model_id = label_models.id").
			Where("host_labels.host_model_id = ?", hosts[i].ID).Find(&labelListInfo)
		hosts[i].Label = labelListInfo

		// 如果请求包含监控数据，则获取最新的监控数据
		if cr.WithMetrics {
			if metrics := global.TimeSeriesDB.GetLatest(uint64(hosts[i].ID)); metrics != nil {
				hosts[i].Metrics = metrics
			}
		}
	}

	res.OkWithList(hosts, count, c)
}
