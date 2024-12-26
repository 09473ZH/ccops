package task_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"github.com/gin-gonic/gin"
)

// 定义新的结构体，用于响应
type TaskListResponse struct {
	models.TaskModel
	Hosts []HostInfo `json:"hosts"`
}
type HostInfo struct {
	HostId   uint   `json:"hostId"`
	HostName string `json:"hostname"`
	HostIp   string `json:"hostIp"`
}

func (TaskApi) TaskListView(c *gin.Context) {
	var (
		reps     []TaskListResponse
		pageInfo models.PageInfo
		tasks    []models.TaskModel
		total    int64
	)

	// 绑定请求参数到 PageInfo 结构体
	if err := c.ShouldBind(&pageInfo); err != nil {
		res.FailWithMessage("参数错误", c)
		return
	}

	// 构建查询条件
	query := global.DB.Model(&models.TaskModel{})

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
	err := query.Order("created_at DESC").Find(&tasks).Error
	if err != nil {
		res.FailWithMessage("查询失败", c)
		return
	}

	// 获取所有相关的 host 信息
	var hostAssociations []models.TargetAssociationModel
	global.DB.Model(&models.TargetAssociationModel{}).
		Select("task_id, host_ip"). // 只选择必要的字段
		Where("task_id IN (?)", getTaskIDs(tasks)).
		Find(&hostAssociations)

	var hostIPs []string
	for _, assoc := range hostAssociations {
		hostIPs = append(hostIPs, assoc.HostIP)
	}

	var hosts []models.HostModel
	global.DB.Model(&models.HostModel{}).Where("host_server_url IN (?)", hostIPs).Find(&hosts)

	// 构建 host 信息的 map
	hostMap := make(map[string]HostInfo)
	for _, host := range hosts {
		hostMap[host.HostServerUrl] = HostInfo{
			HostId:   host.ID,
			HostName: host.Name,
			HostIp:   host.HostServerUrl,
		}
	}

	// 组装响应数据
	for _, task := range tasks {
		var rep TaskListResponse
		rep.TaskModel = task
		for _, assoc := range hostAssociations {
			if assoc.TaskID == task.ID {
				if hostInfo, exists := hostMap[assoc.HostIP]; exists {
					rep.Hosts = append(rep.Hosts, hostInfo)
				}
			}
		}
		reps = append(reps, rep)
	}

	res.OkWithList(reps, total, c)
}

// 获取任务ID的辅助函数
func getTaskIDs(tasks []models.TaskModel) []uint {
	var ids []uint
	for _, task := range tasks {
		ids = append(ids, task.ID)
	}
	return ids
}
