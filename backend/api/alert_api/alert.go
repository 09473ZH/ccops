package alert_api

import (
	"ccops/api/alert_api/request"
	"ccops/api/alert_api/response"
	"ccops/global"
	"ccops/models"
	"ccops/models/alert"
	"ccops/models/res"
	"fmt"
	"github.com/gin-gonic/gin"
)

// CreateAlertRule 创建告警规则
// @Summary 创建告警规则
// @Description 创建新的告警规则
// @Tags 告警规则
// @Accept json
// @Produce json
// @Param data body request.CreateAlertRule true "告警规则信息"
// @Success 200 {object} res.Response
// @Router /api/alert/rules [post]
func (AlertApi) CreateAlertRule(c *gin.Context) {
	var req request.CreateAlertRule
	if err := c.ShouldBindJSON(&req); err != nil {
		res.FailWithMessage("参数错误", c)
		return
	}

	// 创建告警规则
	rules := make([]alert.Rule, len(req.Rules))
	for i, r := range req.Rules {
		rules[i] = alert.Rule{
			Type:          r.Type,
			Duration:      r.Duration,
			CycleInterval: r.CycleInterval,
			CycleStart:    r.CycleStart,
			MinValue:      r.MinValue,
			MaxValue:      r.MaxValue,
			Severity:      r.Severity,
			RecoverNotify: r.RecoverNotify,
		}
	}

	rule := &alert.AlertRule{
		Name:                req.Name,
		Description:         req.Description,
		Enable:              req.Enable,
		Rules:               rules,
		HostIDs:             req.HostIDs,
		LabelIDs:            req.LabelIDs,
		NotificationGroupID: req.NotificationGroupID,
		Tags:                req.Tags,
	}

	// 验证规则
	if err := alert.ValidateRule(rule); err != nil {
		res.FailWithMessage(err.Error(), c)
		return
	}

	// 验证主机ID和标签ID是否存在
	if err := validateHostsAndLabels(rule.HostIDs, rule.LabelIDs); err != nil {
		res.FailWithMessage(err.Error(), c)
		return
	}

	// 验证忽略的主机ID是否存在
	if err := validateHostsAndLabels(rule.IgnoreHostIDs, nil); err != nil {
		res.FailWithMessage(err.Error(), c)
		return
	}

	// 保存到数据库
	if err := global.DB.Create(rule).Error; err != nil {
		res.FailWithMessage("创建告警规则失败", c)
		return
	}

	res.OkWithMessage("创建成功", c)
}

// UpdateAlertRule 更新告警规则
// @Summary 更新告警规则
// @Description 更新现有的告警规则
// @Tags 告警规则
// @Accept json
// @Produce json
// @Param data body request.UpdateAlertRule true "告警规则信息"
// @Success 200 {object} res.Response
// @Router /api/alert/rules [put]
func (AlertApi) UpdateAlertRule(c *gin.Context) {
	var req request.UpdateAlertRule
	if err := c.ShouldBindJSON(&req); err != nil {
		res.FailWithMessage("参数错误", c)
		return
	}

	// 查找现有规则
	var rule alert.AlertRule
	if err := global.DB.First(&rule, req.ID).Error; err != nil {
		res.FailWithMessage("告警规则不存在", c)
		return
	}

	// 更新字段
	if req.Name != "" {
		rule.Name = req.Name
	}
	if req.Description != "" {
		rule.Description = req.Description
	}
	rule.Enable = req.Enable
	if len(req.Rules) > 0 {
		rules := make([]alert.Rule, len(req.Rules))
		for i, r := range req.Rules {
			rules[i] = alert.Rule{
				Type:          r.Type,
				Duration:      r.Duration,
				CycleInterval: r.CycleInterval,
				CycleStart:    r.CycleStart,
				MinValue:      r.MinValue,
				MaxValue:      r.MaxValue,
				Severity:      r.Severity,
				RecoverNotify: r.RecoverNotify,
			}
		}
		rule.Rules = rules
	}
	if req.HostIDs != nil {
		rule.HostIDs = req.HostIDs
	}
	if req.LabelIDs != nil {
		rule.LabelIDs = req.LabelIDs
	}

	if req.IgnoreHostIDs != nil {
		rule.IgnoreHostIDs = req.IgnoreHostIDs
	}

	if req.NotificationGroupID > 0 {
		rule.NotificationGroupID = req.NotificationGroupID
	}
	if req.Tags != nil {
		rule.Tags = req.Tags
	}

	// 验证规则
	if err := alert.ValidateRule(&rule); err != nil {
		res.FailWithMessage(err.Error(), c)
		return
	}

	// 验证主机ID和标签ID是否存在
	if err := validateHostsAndLabels(rule.HostIDs, rule.LabelIDs); err != nil {
		res.FailWithMessage(err.Error(), c)
		return
	}

	// 验证忽略的主机ID是否存在
	if err := validateHostsAndLabels(rule.IgnoreHostIDs, nil); err != nil {
		res.FailWithMessage(err.Error(), c)
		return
	}

	// 保存到数据库
	if err := global.DB.Save(&rule).Error; err != nil {
		res.FailWithMessage("更新告警规则失败", c)
		return
	}

	res.OkWithMessage("更新成功", c)
}

// validateHostsAndLabels 验证主机ID和标签ID是否存在
func validateHostsAndLabels(hostIDs []uint64, labelIDs []uint64) error {
	if len(hostIDs) > 0 {
		var count int64
		if err := global.DB.Model(&models.HostModel{}).Where("id IN ?", hostIDs).Count(&count).Error; err != nil {
			return fmt.Errorf("验证主机ID失败: %v", err)
		}
		if int(count) != len(hostIDs) {
			return fmt.Errorf("存在无效的主机ID")
		}
	}

	if len(labelIDs) > 0 {
		var count int64
		if err := global.DB.Model(&models.LabelModel{}).Where("id IN ?", labelIDs).Count(&count).Error; err != nil {
			return fmt.Errorf("验证标签ID失败: %v", err)
		}
		if int(count) != len(labelIDs) {
			return fmt.Errorf("存在无效的标签ID")
		}
	}

	return nil
}

// DeleteAlertRule 删除告警规则
// @Summary 删除告警规则
// @Description 删除指定的告警规则
// @Tags 告警规则
// @Accept json
// @Produce json
// @Param id path int true "规则ID"
// @Success 200 {object} res.Response
// @Router /api/alert/rules/{id} [delete]
func (AlertApi) DeleteAlertRule(c *gin.Context) {
	id := c.Param("id")
	if err := global.DB.Delete(&alert.AlertRule{}, id).Error; err != nil {
		res.FailWithMessage("删除告警规则失败", c)
		return
	}

	res.OkWithMessage("删除成功", c)
}

// GetAlertRule 获取告警规则详情
// @Summary 获取告警规则详情
// @Description 获取指定告警规则的详细信息
// @Tags 告警规则
// @Accept json
// @Produce json
// @Param id path int true "规则ID"
// @Success 200 {object} response.AlertRuleInfo
// @Router /api/alert/rules/{id} [get]
func (AlertApi) GetAlertRule(c *gin.Context) {
	id := c.Param("id")
	var rule alert.AlertRule
	if err := global.DB.First(&rule, id).Error; err != nil {
		res.FailWithMessage("告警规则不存在", c)
		return
	}

	info := response.AlertRuleInfo{
		ID:                  rule.ID,
		Name:                rule.Name,
		Description:         rule.Description,
		Enable:              rule.Enable,
		Rules:               rule.Rules,
		HostIDs:             rule.HostIDs,
		LabelIDs:            rule.LabelIDs,
		NotificationGroupID: rule.NotificationGroupID,
		Tags:                rule.Tags,
		CreatedAt:           rule.CreatedAt,
		UpdatedAt:           rule.UpdatedAt,
	}

	res.OkWithData(info, c)
}

// GetAlertRuleList 获取告警规则列表
// @Summary 获取告警规则列表
// @Description 获取告警规则列表，支持分页和筛选
// @Tags 告警规则
// @Accept json
// @Produce json
// @Param page query int true "页码"
// @Param pageSize query int true "每页数量"
// @Param name query string false "规则名称"
// @Param enable query bool false "是否启用"
// @Success 200 {object} response.AlertRuleList
// @Router /api/alert/rules [get]
func (AlertApi) GetAlertRuleList(c *gin.Context) {
	var query request.AlertRuleListQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		res.FailWithMessage("参数错误", c)
		return
	}

	// 构建查询条件
	db := global.DB.Model(&alert.AlertRule{})
	if query.Name != "" {
		db = db.Where("name LIKE ?", "%"+query.Name+"%")
	}
	if query.Enable != nil {
		db = db.Where("enable = ?", *query.Enable)
	}

	// 查询总数
	var total int64
	if err := db.Count(&total).Error; err != nil {
		res.FailWithMessage("查询失败", c)
		return
	}

	// 查询列表
	var rules []alert.AlertRule

	if err := db.Offset((query.Page - 1) * query.Limit).
		Limit(query.Limit).
		Order("created_at DESC").
		Find(&rules).Error; err != nil {
		res.FailWithMessage("查询失败", c)
		return
	}

	// 构建响应
	list := make([]response.AlertRuleInfo, len(rules))
	for i, rule := range rules {
		list[i] = response.AlertRuleInfo{
			ID:                  rule.ID,
			Name:                rule.Name,
			Description:         rule.Description,
			Enable:              rule.Enable,
			Rules:               rule.Rules,
			HostIDs:             rule.HostIDs,
			LabelIDs:            rule.LabelIDs,
			NotificationGroupID: rule.NotificationGroupID,
			Tags:                rule.Tags,
			CreatedAt:           rule.CreatedAt,
			UpdatedAt:           rule.UpdatedAt,
		}
	}

	res.OkWithData(response.AlertRuleList{
		Total: total,
		List:  list,
	}, c)
}

// GetAlertRecordList 获取告警记录列表
// @Summary 获取告警记录列表
// @Description 获取告警记录列表，支持分页和筛选
// @Tags 告警记录
// @Accept json
// @Produce json
// @Param page query int true "页码"
// @Param pageSize query int true "每页数量"
// @Param status query string false "状态"
// @Param ruleId query int false "规则ID"
// @Param hostId query int false "主机ID"
// @Param startTime query string false "开始时间"
// @Param endTime query string false "结束时间"
// @Success 200 {object} response.AlertRecordList
// @Router /api/alert/records [get]
func (AlertApi) GetAlertRecordList(c *gin.Context) {
	var query request.AlertRecordListQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		res.FailWithMessage("参数错误", c)
		return
	}

	// 构建查询条件

	db := global.DB.Debug().Model(&alert.AlertRecord{})
	if query.Status != 0 {
		db = db.Where("status = ?", query.Status)
	}
	if query.RuleID > 0 {
		db = db.Where("rule_id = ?", query.RuleID)
	}
	if query.HostID > 0 {
		db = db.Where("host_id = ?", query.HostID)
	}
	if !query.StartTime.IsZero() {
		db = db.Where("created_at >= ?", query.StartTime)
	}
	if !query.EndTime.IsZero() {
		db = db.Where("created_at <= ?", query.EndTime)
	}

	// 查询总数
	var total int64
	if err := db.Count(&total).Error; err != nil {
		res.FailWithMessage("查询失败", c)
		return
	}

	// 查询列表
	var records []alert.AlertRecord

	if err := db.Offset((query.Page - 1) * query.Limit).
		Limit(query.Limit).
		Order("created_at DESC").
		Find(&records).Error; err != nil {
		res.FailWithMessage("查询失败", c)
		return
	}

	// 获取所有相关的告警规则ID
	ruleIDs := make(map[uint64]struct{})
	for _, record := range records {
		ruleIDs[record.RuleID] = struct{}{}
	}

	// 批量查询告警规则
	var rules []alert.AlertRule
	if len(ruleIDs) > 0 {
		ruleIDList := make([]uint64, 0, len(ruleIDs))
		for ruleID := range ruleIDs {
			ruleIDList = append(ruleIDList, ruleID)
		}
		if err := global.DB.Where("id IN ?", ruleIDList).Find(&rules).Error; err != nil {
			res.FailWithMessage("查询告警规则失败", c)
			return
		}
	}

	// 构建规则ID到规则名称的映射
	ruleMap := make(map[uint64]string)
	for _, rule := range rules {
		ruleMap[rule.ID] = rule.Name
	}

	// 构建响应
	list := make([]response.AlertRecordInfo, len(records))
	for i, record := range records {
		// 将状态码转换为状态描述
		var statusStr string
		switch record.Status {
		case alert.AlertStatusNormal:
			statusStr = "正常"
		case alert.AlertStatusAlerting:
			statusStr = "告警中"
		case alert.AlertStatusResolved:
			statusStr = "已恢复"
		default:
			statusStr = "未知状态"
		}

		list[i] = response.AlertRecordInfo{
			ID:          record.ID,
			RuleID:      record.RuleID,
			RuleName:    ruleMap[record.RuleID],
			HostID:      record.HostID,
			Status:      statusStr,
			Value:       record.Value,
			StartTime:   record.StartTime,
			EndTime:     record.EndTime,
			Description: record.Description,
			CreatedAt:   record.CreatedAt,
		}
	}

	res.OkWithData(response.AlertRecordList{
		Total: total,
		List:  list,
	}, c)
}

// GetActiveAlerts 获取当前活跃的告警
// @Summary 获取当前活跃的告警
// @Description 获取所有未解决的告警记录
// @Tags 告警记录
// @Accept json
// @Produce json
// @Success 200 {array} response.AlertRecordInfo
// @Router /api/alert/records/active [get]
func (AlertApi) GetActiveAlerts(c *gin.Context) {
	var records []alert.AlertRecord
	if err := global.DB.Where("status = ?", alert.AlertStatusAlerting).
		Order("created_at DESC").
		Find(&records).Error; err != nil {
		res.FailWithMessage("查询失败", c)
		return
	}

	// 获取所有相关的告警规则ID
	ruleIDs := make(map[uint64]struct{})
	for _, record := range records {
		ruleIDs[record.RuleID] = struct{}{}
	}

	// 批量查询告警规则
	var rules []alert.AlertRule
	if len(ruleIDs) > 0 {
		ruleIDList := make([]uint64, 0, len(ruleIDs))
		for ruleID := range ruleIDs {
			ruleIDList = append(ruleIDList, ruleID)
		}
		if err := global.DB.Where("id IN ?", ruleIDList).Find(&rules).Error; err != nil {
			res.FailWithMessage("查询告警规则失败", c)
			return
		}
	}

	// 构建规则ID到规则名称的映射
	ruleMap := make(map[uint64]string)
	for _, rule := range rules {
		ruleMap[rule.ID] = rule.Name
	}

	// 构建响应
	list := make([]response.AlertRecordInfo, len(records))
	for i, record := range records {
		// 将状态码转换为状态描述
		var statusStr string
		switch record.Status {
		case alert.AlertStatusNormal:
			statusStr = "正常"
		case alert.AlertStatusAlerting:
			statusStr = "告警中"
		case alert.AlertStatusResolved:
			statusStr = "已恢复"
		default:
			statusStr = "未知状态"
		}

		list[i] = response.AlertRecordInfo{
			ID:          record.ID,
			RuleID:      record.RuleID,
			RuleName:    ruleMap[record.RuleID],
			HostID:      record.HostID,
			Status:      statusStr,
			Value:       record.Value,
			StartTime:   record.StartTime,
			EndTime:     record.EndTime,
			Description: record.Description,
			CreatedAt:   record.CreatedAt,
		}
	}

	res.OkWithData(list, c)
}
