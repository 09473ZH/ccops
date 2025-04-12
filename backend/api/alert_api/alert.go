package alert_api

import (
	"ccops/api/alert_api/request"
	"ccops/api/alert_api/response"
	"ccops/global"
	"ccops/models/alert"
	"ccops/models/res"
	alertService "ccops/service/alert"

	"time"

	"log"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
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

	// 验证白名单和黑名单配置
	if !req.Universal {
		// 非全局规则必须有白名单
		if len(req.WhitelistHostIDs) == 0 && len(req.WhitelistLabelIDs) == 0 {
			res.FailWithMessage("非全局规则必须指定白名单（主机或主机组）", c)
			return
		}
	}

	// 开启事务
	tx := global.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if req.NotificationId > 0 {
		// 验证通知配置是否存在
		var notifyCount int64
		if err := tx.Model(&alert.Notification{}).Where("id = ?", req.NotificationId).Count(&notifyCount).Error; err != nil {
			tx.Rollback()
			res.FailWithMessage("验证通知配置失败", c)
			return
		}
		if notifyCount == 0 {
			tx.Rollback()
			res.FailWithMessage("指定的通知配置不存在", c)
			return
		}
	}

	// 创建告警规则
	rule := &alert.AlertRule{
		Name:           req.Name,
		Description:    req.Description,
		Universal:      req.Universal,
		Enabled:        req.Enabled,
		Priority:       req.Priority,
		Type:           req.Type,
		Duration:       req.Duration,
		Operator:       req.Operator,
		Threshold:      req.Threshold,
		RecoverNotify:  req.RecoverNotify,
		NotificationId: req.NotificationId,
	}

	// 保存规则
	if err := tx.Create(rule).Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("创建告警规则失败", c)
		return
	}

	// 处理白名单和黑名单
	if rule.Universal {
		// 1. 全局规则：只处理黑名单
		// 添加主机黑名单
		for _, hostID := range req.BlacklistHostIDs {
			target := &alert.AlertRuleTarget{
				AlertRuleID: rule.ID,
				TargetID:    hostID,
				TargetType:  alert.TargetTypeHost,
				Excluded:    true, // 黑名单
			}
			if err := tx.Create(target).Error; err != nil {
				tx.Rollback()
				res.FailWithMessage("创建主机黑名单失败", c)
				return
			}
		}

		// 添加标签黑名单
		for _, labelID := range req.BlacklistLabelIDs {
			target := &alert.AlertRuleTarget{
				AlertRuleID: rule.ID,
				TargetID:    labelID,
				TargetType:  alert.TargetTypeLabel,
				Excluded:    true, // 黑名单
			}
			if err := tx.Create(target).Error; err != nil {
				tx.Rollback()
				res.FailWithMessage("创建标签黑名单失败", c)
				return
			}
		}
	} else {
		// 2. 非全局规则：处理白名单和黑名单
		// 添加主机白名单
		for _, hostID := range req.WhitelistHostIDs {
			target := &alert.AlertRuleTarget{
				AlertRuleID: rule.ID,
				TargetID:    hostID,
				TargetType:  alert.TargetTypeHost,
				Excluded:    false, // 白名单
			}
			if err := tx.Create(target).Error; err != nil {
				tx.Rollback()
				res.FailWithMessage("创建主机白名单失败", c)
				return
			}
		}

		// 添加标签白名单
		for _, labelID := range req.WhitelistLabelIDs {
			target := &alert.AlertRuleTarget{
				AlertRuleID: rule.ID,
				TargetID:    labelID,
				TargetType:  alert.TargetTypeLabel,
				Excluded:    false, // 白名单
			}
			if err := tx.Create(target).Error; err != nil {
				tx.Rollback()
				res.FailWithMessage("创建标签白名单失败", c)
				return
			}
		}

		// 添加主机黑名单（用于排除白名单中的特定主机）
		for _, hostID := range req.BlacklistHostIDs {
			target := &alert.AlertRuleTarget{
				AlertRuleID: rule.ID,
				TargetID:    hostID,
				TargetType:  alert.TargetTypeHost,
				Excluded:    true, // 黑名单
			}
			if err := tx.Create(target).Error; err != nil {
				tx.Rollback()
				res.FailWithMessage("创建主机黑名单失败", c)
				return
			}
		}

		// 添加标签黑名单（用于排除白名单中的特定标签组）
		for _, labelID := range req.BlacklistLabelIDs {
			target := &alert.AlertRuleTarget{
				AlertRuleID: rule.ID,
				TargetID:    labelID,
				TargetType:  alert.TargetTypeLabel,
				Excluded:    true, // 黑名单
			}
			if err := tx.Create(target).Error; err != nil {
				tx.Rollback()
				res.FailWithMessage("创建标签黑名单失败", c)
				return
			}
		}
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("创建告警规则失败", c)
		return
	}

	// 刷新规则缓存
	alertService.GetRuleCache().RefreshCache()

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

	// 验证白名单和黑名单配置
	if !req.Universal {
		// 非全局规则必须有白名单
		if len(req.WhitelistHostIDs) == 0 && len(req.WhitelistLabelIDs) == 0 {
			res.FailWithMessage("非全局规则必须指定白名单（主机或主机组）", c)
			return
		}
	}

	// 开启事务
	tx := global.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 查找现有规则
	var rule alert.AlertRule
	if err := tx.First(&rule, req.ID).Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("告警规则不存在", c)
		return
	}

	// 如果更新了通知配置，验证新的通知配置是否存在
	if req.NotificationId != 0 && req.NotificationId != rule.NotificationId {
		var notifyCount int64
		if err := tx.Model(&alert.Notification{}).Where("id = ?", req.NotificationId).Count(&notifyCount).Error; err != nil {
			tx.Rollback()
			res.FailWithMessage("验证通知配置失败", c)
			return
		}
		if notifyCount == 0 {
			tx.Rollback()
			res.FailWithMessage("指定的通知配置不存在", c)
			return
		}
		rule.NotificationId = req.NotificationId
	}

	// 更新字段
	if req.Name != "" {
		rule.Name = req.Name
	}
	if req.Description != "" {
		rule.Description = req.Description
	}
	rule.Universal = req.Universal
	rule.Enabled = req.Enabled
	if req.Priority != "" {
		rule.Priority = req.Priority
	}
	if req.Type != "" {
		rule.Type = req.Type
	}
	if req.Duration > 0 {
		rule.Duration = req.Duration
	}
	if req.Operator != "" {
		rule.Operator = req.Operator
	}
	if req.Threshold != 0 {
		rule.Threshold = req.Threshold
	}
	rule.RecoverNotify = req.RecoverNotify

	// 保存规则基本信息
	if err := tx.Save(&rule).Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("更新告警规则失败", c)
		return
	}

	// 删除现有的所有目标关联
	if err := tx.Delete(&alert.AlertRuleTarget{}, "alert_rule_id = ?", rule.ID).Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("删除现有规则目标失败", c)
		return
	}

	// 处理白名单和黑名单
	if rule.Universal {
		// 1. 全局规则：只处理黑名单
		// 添加主机黑名单
		for _, hostID := range req.BlacklistHostIDs {
			target := &alert.AlertRuleTarget{
				AlertRuleID: rule.ID,
				TargetID:    hostID,
				TargetType:  alert.TargetTypeHost,
				Excluded:    true, // 黑名单
			}
			if err := tx.Create(target).Error; err != nil {
				tx.Rollback()
				res.FailWithMessage("创建主机黑名单失败", c)
				return
			}
		}

		// 添加标签黑名单
		for _, labelID := range req.BlacklistLabelIDs {
			target := &alert.AlertRuleTarget{
				AlertRuleID: rule.ID,
				TargetID:    labelID,
				TargetType:  alert.TargetTypeLabel,
				Excluded:    true, // 黑名单
			}
			if err := tx.Create(target).Error; err != nil {
				tx.Rollback()
				res.FailWithMessage("创建标签黑名单失败", c)
				return
			}
		}
	} else {
		// 2. 非全局规则：处理白名单和黑名单
		// 添加主机白名单
		for _, hostID := range req.WhitelistHostIDs {
			target := &alert.AlertRuleTarget{
				AlertRuleID: rule.ID,
				TargetID:    hostID,
				TargetType:  alert.TargetTypeHost,
				Excluded:    false, // 白名单
			}
			if err := tx.Create(target).Error; err != nil {
				tx.Rollback()
				res.FailWithMessage("创建主机白名单失败", c)
				return
			}
		}

		// 添加标签白名单
		for _, labelID := range req.WhitelistLabelIDs {
			target := &alert.AlertRuleTarget{
				AlertRuleID: rule.ID,
				TargetID:    labelID,
				TargetType:  alert.TargetTypeLabel,
				Excluded:    false, // 白名单
			}
			if err := tx.Create(target).Error; err != nil {
				tx.Rollback()
				res.FailWithMessage("创建标签白名单失败", c)
				return
			}
		}

		// 添加主机黑名单（用于排除白名单中的特定主机）
		for _, hostID := range req.BlacklistHostIDs {
			target := &alert.AlertRuleTarget{
				AlertRuleID: rule.ID,
				TargetID:    hostID,
				TargetType:  alert.TargetTypeHost,
				Excluded:    true, // 黑名单
			}
			if err := tx.Create(target).Error; err != nil {
				tx.Rollback()
				res.FailWithMessage("创建主机黑名单失败", c)
				return
			}
		}

		// 添加标签黑名单（用于排除白名单中的特定标签组）
		for _, labelID := range req.BlacklistLabelIDs {
			target := &alert.AlertRuleTarget{
				AlertRuleID: rule.ID,
				TargetID:    labelID,
				TargetType:  alert.TargetTypeLabel,
				Excluded:    true, // 黑名单
			}
			if err := tx.Create(target).Error; err != nil {
				tx.Rollback()
				res.FailWithMessage("创建标签黑名单失败", c)
				return
			}
		}
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("更新告警规则失败", c)
		return
	}

	// 刷新规则缓存
	alertService.GetRuleCache().RefreshCache()

	res.OkWithMessage("更新成功", c)
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

	// 开启事务
	tx := global.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 删除规则目标关联
	if err := tx.Delete(&alert.AlertRuleTarget{}, "alert_rule_id = ?", id).Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("删除告警规则目标失败", c)
		return
	}

	// 删除规则
	if err := tx.Delete(&alert.AlertRule{}, id).Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("删除告警规则失败", c)
		return
	}

	if err := tx.Commit().Error; err != nil {
		res.FailWithMessage("删除告警规则失败", c)
		return
	}

	// 刷新规则缓存
	alertService.GetRuleCache().RefreshCache()

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

	// 查询告警规则基本信息
	var rule alert.AlertRule
	if err := global.DB.First(&rule, id).Error; err != nil {
		res.FailWithMessage("告警规则不存在", c)
		return
	}

	// 查询规则目标
	var targets []alert.AlertRuleTarget
	if err := global.DB.Where("alert_rule_id = ?", rule.ID).Find(&targets).Error; err != nil {
		res.FailWithMessage("获取规则目标失败", c)
		return
	}

	// 初始化响应结构
	info := response.AlertRuleInfo{
		ID:             rule.ID,
		Name:           rule.Name,
		Description:    rule.Description,
		Universal:      rule.Universal,
		Enabled:        rule.Enabled,
		Priority:       rule.Priority,
		Type:           rule.Type,
		Duration:       rule.Duration,
		Operator:       rule.Operator,
		Threshold:      rule.Threshold,
		RecoverNotify:  rule.RecoverNotify,
		NotificationId: rule.NotificationId,
		CreatedAt:      rule.CreatedAt,
		UpdatedAt:      rule.UpdatedAt,
	}

	// 收集所有主机和标签ID
	hostIDs := make([]uint64, 0)
	labelIDs := make([]uint64, 0)
	for _, target := range targets {
		if target.TargetType == alert.TargetTypeHost {
			hostIDs = append(hostIDs, target.TargetID)
		} else {
			labelIDs = append(labelIDs, target.TargetID)
		}
	}

	// 查询主机信息
	if len(hostIDs) > 0 {
		var hosts []struct {
			ID   uint64 `gorm:"column:id"`
			Name string `gorm:"column:name"`
		}
		if err := global.DB.Table("host_models").
			Select("id, name").
			Where("id IN ?", hostIDs).
			Find(&hosts).Error; err != nil {
			res.FailWithMessage("获取主机信息失败", c)
			return
		}

		// 构建主机ID到名称的映射
		hostMap := make(map[uint64]string)
		for _, host := range hosts {
			hostMap[host.ID] = host.Name
		}

		// 分类主机到黑白名单
		for _, target := range targets {
			if target.TargetType == alert.TargetTypeHost {
				targetInfo := response.TargetInfo{
					ID:   target.TargetID,
					Name: hostMap[target.TargetID],
				}
				if target.Excluded {
					info.BlacklistHosts = append(info.BlacklistHosts, targetInfo)
				} else {
					info.WhitelistHosts = append(info.WhitelistHosts, targetInfo)
				}
			}
		}
	}

	// 查询标签信息
	if len(labelIDs) > 0 {
		var labels []struct {
			ID   uint64 `gorm:"column:id"`
			Name string `gorm:"column:name"`
		}
		if err := global.DB.Table("label_models").
			Select("id, name").
			Where("id IN ?", labelIDs).
			Find(&labels).Error; err != nil {
			res.FailWithMessage("获取标签信息失败", c)
			return
		}

		// 构建标签ID到名称的映射
		labelMap := make(map[uint64]string)
		for _, label := range labels {
			labelMap[label.ID] = label.Name
		}

		// 分类标签到黑白名单
		for _, target := range targets {
			if target.TargetType == alert.TargetTypeLabel {
				targetInfo := response.TargetInfo{
					ID:   target.TargetID,
					Name: labelMap[target.TargetID],
				}
				if target.Excluded {
					info.BlacklistLabels = append(info.BlacklistLabels, targetInfo)
				} else {
					info.WhitelistLabels = append(info.WhitelistLabels, targetInfo)
				}
			}
		}
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
// @Param limit query int true "每页数量"
// @Param name query string false "规则名称"
// @Param enabled query bool false "是否启用"
// @Param priority query string false "告警等级"
// @Param type query string false "规则类型"
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
	if query.Enabled != nil {
		db = db.Where("enabled = ?", *query.Enabled)
	}
	if query.Priority != "" {
		db = db.Where("priority = ?", query.Priority)
	}
	if query.Type != "" {
		db = db.Where("type = ?", query.Type)
	}

	// 获取总数
	var total int64
	if err := db.Count(&total).Error; err != nil {
		res.FailWithMessage("获取告警规则总数失败", c)
		return
	}

	// 获取列表
	var rules []alert.AlertRule
	if err := db.Offset((query.Page - 1) * query.Limit).
		Limit(query.Limit).
		Find(&rules).Error; err != nil {
		res.FailWithMessage("获取告警规则列表失败", c)
		return
	}

	// 转换为响应格式
	list := make([]response.AlertRuleInfo, len(rules))
	for i, rule := range rules {
		list[i] = response.AlertRuleInfo{
			ID:             rule.ID,
			Name:           rule.Name,
			Description:    rule.Description,
			Universal:      rule.Universal,
			Enabled:        rule.Enabled,
			Priority:       rule.Priority,
			Type:           rule.Type,
			Duration:       rule.Duration,
			Operator:       rule.Operator,
			Threshold:      rule.Threshold,
			RecoverNotify:  rule.RecoverNotify,
			NotificationId: rule.NotificationId,
			CreatedAt:      rule.CreatedAt,
			UpdatedAt:      rule.UpdatedAt,
		}
	}

	res.OkWithData(response.AlertRuleList{
		Count: total,
		List:  list,
	}, c)
}

// GetAlertRecordList 获取告警记录列表
// @Summary 获取告警记录列表
// @Description 获取告警记录列表，支持分页和条件筛选
// @Tags 告警记录
// @Accept json
// @Produce json
// @Param page query int true "页码"
// @Param limit query int true "每页数量"
// @Param status query int false "状态: 1-告警中, 2-已恢复"
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

	// 构建基础查询条件
	db := global.DB.Model(&alert.AlertRecord{})
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

	// 查询告警中的记录数
	var alertingTotal int64
	if err := db.Where("status = ?", alert.AlertStatusAlerting).Count(&alertingTotal).Error; err != nil {
		res.FailWithMessage("查询失败", c)
		return
	}

	// 查询受影响的主机数量（使用子查询）
	subQuery := global.DB.Model(&alert.AlertRecord{}).Select("DISTINCT host_id")
	var hostTotal int64
	if err := global.DB.Table("(?) as t", subQuery).Count(&hostTotal).Error; err != nil {
		res.FailWithMessage("查询失败", c)
		return
	}

	// 查询列表
	var records []alert.AlertRecord
	if err := db.Scopes(func(d *gorm.DB) *gorm.DB {
		return d.Offset((query.Page - 1) * query.Limit).Limit(query.Limit)
	}).Order("created_at DESC").Find(&records).Error; err != nil {
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
	ruleMap := make(map[uint64]*alert.AlertRule)
	if len(ruleIDs) > 0 {
		ruleIDList := make([]uint64, 0, len(ruleIDs))
		for ruleID := range ruleIDs {
			ruleIDList = append(ruleIDList, ruleID)
		}
		if err := global.DB.Where("id IN ?", ruleIDList).Find(&rules).Error; err != nil {
			res.FailWithMessage("查询告警规则失败", c)
			return
		}
		for i := range rules {
			ruleMap[rules[i].ID] = &rules[i]
		}
	}

	// 获取所有相关的主机ID
	hostIDs := make(map[uint64]struct{})
	for _, record := range records {
		hostIDs[record.HostID] = struct{}{}
	}

	// 批量查询主机信息
	hostMap := make(map[uint64]string)
	if len(hostIDs) > 0 {
		hostIDList := make([]uint64, 0, len(hostIDs))
		for hostID := range hostIDs {
			hostIDList = append(hostIDList, hostID)
		}
		var hosts []struct {
			ID   uint64 `gorm:"column:id"`
			Name string `gorm:"column:name"`
		}
		if err := global.DB.Table("host_models").
			Select("id, name").
			Where("id IN ?", hostIDList).
			Find(&hosts).Error; err != nil {
			res.FailWithMessage("查询主机信息失败", c)
			return
		}
		for _, host := range hosts {
			hostMap[host.ID] = host.Name
		}
	}

	// 构建响应列表
	list := make([]response.AlertRecordInfo, len(records))
	for i, record := range records {
		// 将状态码转换为状态描述
		var statusStr string
		switch record.Status {
		case alert.AlertStatusAlerting:
			statusStr = "告警中"
		case alert.AlertStatusResolved:
			statusStr = "已恢复"
		default:
			statusStr = "未知状态"
		}

		// 获取规则信息
		rule := ruleMap[record.RuleID]
		ruleName := ""
		priority := ""
		if rule != nil {
			ruleName = rule.Name
			priority = rule.Priority
		}

		list[i] = response.AlertRecordInfo{
			ID:           record.ID,
			RuleID:       record.RuleID,
			RuleName:     ruleName,
			Priority:     priority,
			HostID:       record.HostID,
			HostName:     hostMap[record.HostID],
			Status:       statusStr,
			StatusCode:   record.Status,
			Value:        record.Value,
			RecoverValue: record.RecoverValue,
			StartTime:    record.StartTime,
			EndTime:      record.EndTime,
			Description:  record.Description,
			CreatedAt:    record.CreatedAt,
		}
	}

	res.OkWithData(response.AlertRecordList{
		Count:         total,
		AlertingTotal: alertingTotal,
		HostTotal:     hostTotal,
		List:          list,
	}, c)
}

// GetAlertStatistics 获取告警统计信息
// @Summary 获取告警统计信息
// @Description 获取告警统计信息，包括各类告警数量、不同优先级告警数量等
// @Tags 告警记录
// @Accept json
// @Produce json
// @Param status query int false "状态: 1-告警中, 2-已恢复"
// @Param ruleId query int false "规则ID"
// @Param hostId query int false "主机ID"
// @Param startTime query string false "开始时间"
// @Param endTime query string false "结束时间"
// @Success 200 {object} response.AlertStatistics
// @Router /api/alert/statistics [get]
func (AlertApi) GetAlertStatistics(c *gin.Context) {
	var query request.AlertRecordListQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		res.FailWithMessage("参数错误", c)
		return
	}

	// 构建基础查询条件
	db := global.DB.Model(&alert.AlertRecord{})
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

	var stats response.AlertStatistics

	// 查询总告警数
	if err := db.Count(&stats.TotalAlerts).Error; err != nil {
		res.FailWithMessage("查询失败", c)
		return
	}

	// 查询活跃告警数
	if err := db.Where("status = ?", alert.AlertStatusAlerting).
		Count(&stats.ActiveAlerts).Error; err != nil {
		res.FailWithMessage("查询失败", c)
		return
	}

	// 查询受影响主机数（使用子查询）
	subQuery := global.DB.Model(&alert.AlertRecord{}).
		Where("status = ?", alert.AlertStatusAlerting).
		Select("DISTINCT host_id")
	var affectedHosts int64
	if err := global.DB.Table("(?) as t", subQuery).
		Count(&affectedHosts).Error; err != nil {
		res.FailWithMessage("查询失败", c)
		return
	}
	stats.AffectedHosts = affectedHosts

	// 查询已解决告警数
	if err := db.Where("status = ?", alert.AlertStatusResolved).
		Count(&stats.ResolvedAlerts).Error; err != nil {
		res.FailWithMessage("查询失败", c)
		return
	}

	// 查询各优先级告警数
	subQuery = global.DB.Model(&alert.AlertRecord{}).
		Select("alert_records.*, alert_rules.priority").
		Joins("LEFT JOIN alert_rules ON alert_records.rule_id = alert_rules.id").
		Where("alert_records.status = ?", alert.AlertStatusAlerting)

	if err := subQuery.Where("alert_rules.priority = ?", alert.PriorityP0).
		Count(&stats.P0Alerts).Error; err != nil {
		res.FailWithMessage("查询失败", c)
		return
	}

	if err := subQuery.Where("alert_rules.priority = ?", alert.PriorityP1).
		Count(&stats.P1Alerts).Error; err != nil {
		res.FailWithMessage("查询失败", c)
		return
	}

	if err := subQuery.Where("alert_rules.priority = ?", alert.PriorityP2).
		Count(&stats.P2Alerts).Error; err != nil {
		res.FailWithMessage("查询失败", c)
		return
	}

	if err := subQuery.Where("alert_rules.priority = ?", alert.PriorityP3).
		Count(&stats.P3Alerts).Error; err != nil {
		res.FailWithMessage("查询失败", c)
		return
	}

	// 查询最近时间段的告警数
	now := time.Now()
	if err := db.Where("created_at >= ?", now.Add(-time.Hour)).
		Count(&stats.LastHourAlerts).Error; err != nil {
		res.FailWithMessage("查询失败", c)
		return
	}

	if err := db.Where("created_at >= ?", now.Add(-24*time.Hour)).
		Count(&stats.Last24HrAlerts).Error; err != nil {
		res.FailWithMessage("查询失败", c)
		return
	}

	if err := db.Where("created_at >= ?", now.Add(-7*24*time.Hour)).
		Count(&stats.Last7DaysAlerts).Error; err != nil {
		res.FailWithMessage("查询失败", c)
		return
	}

	res.OkWithData(stats, c)
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
		case alert.AlertStatusAlerting:
			statusStr = "告警中"
		case alert.AlertStatusResolved:
			statusStr = "已恢复"
		default:
			statusStr = "未知状态"
		}

		list[i] = response.AlertRecordInfo{
			ID:           record.ID,
			RuleID:       record.RuleID,
			RuleName:     ruleMap[record.RuleID],
			HostID:       record.HostID,
			Status:       statusStr,
			StatusCode:   record.Status,
			Value:        record.Value,
			RecoverValue: record.RecoverValue,
			StartTime:    record.StartTime,
			EndTime:      record.EndTime,
			Description:  record.Description,
			CreatedAt:    record.CreatedAt,
		}
	}

	res.OkWithData(list, c)
}

// GetAlertAggregation 获取告警聚合信息
// @Summary 获取告警聚合信息
// @Description 获取按规则聚合的告警信息，包括每个规则当前触发的主机数等
// @Tags 告警记录
// @Accept json
// @Produce json
// @Success 200 {object} response.AlertAggregationList
// @Router /api/alert/records/aggregation [get]
func (AlertApi) GetAlertAggregation(c *gin.Context) {
	// 1. 查询所有处于告警状态的记录，按规则分组
	type Result struct {
		RuleID     uint64
		RuleName   string
		Priority   string
		AlertCount int64
		HostCount  int64
	}
	var results []Result

	err := global.DB.Model(&alert.AlertRecord{}).
		Select("alert_records.rule_id, alert_rules.name as rule_name, alert_rules.priority, "+
			"COUNT(*) as alert_count, COUNT(DISTINCT alert_records.host_id) as host_count").
		Joins("LEFT JOIN alert_rules ON alert_records.rule_id = alert_rules.id").
		Where("alert_records.status = ?", alert.AlertStatusAlerting).
		Group("alert_records.rule_id").
		Find(&results).Error

	if err != nil {
		res.FailWithMessage("查询告警聚合信息失败", c)
		return
	}

	// 2. 构建响应数据
	list := make([]response.AlertAggregation, 0, len(results))
	for _, result := range results {
		// 查询该规则下所有告警状态的主机信息
		var hosts []struct {
			ID            uint64
			Name          string
			HostServerUrl string `gorm:"column:host_server_url" json:"ip"`
		}
		err := global.DB.Table("alert_records").
			Select("host_models.id, host_models.name, host_models.host_server_url").
			Joins("LEFT JOIN host_models ON alert_records.host_id = host_models.id").
			Where("alert_records.rule_id = ? AND alert_records.status = ?",
				result.RuleID, alert.AlertStatusAlerting).
			Group("host_models.id").
			Find(&hosts).Error

		if err != nil {
			log.Printf("查询主机信息失败: %v", err)
			continue
		}

		// 构建主机信息列表
		hostInfos := make([]response.HostInfo, 0, len(hosts))
		for _, host := range hosts {
			hostInfos = append(hostInfos, response.HostInfo{
				ID:            host.ID,
				Name:          host.Name,
				HostServerUrl: host.HostServerUrl,
			})
		}

		// 添加聚合信息
		list = append(list, response.AlertAggregation{
			RuleID:      result.RuleID,
			RuleName:    result.RuleName,
			Priority:    result.Priority,
			HostCount:   result.HostCount,
			AffectHosts: hostInfos,
		})
	}

	res.OkWithData(response.AlertAggregationList{
		Total: int64(len(list)),
		List:  list,
	}, c)
}

// GetMetricTypeList 获取可用的指标类型列表
// @Summary 获取可用的指标类型列表
// @Description 获取所有可用的监控指标类型
// @Tags 告警规则
// @Accept json
// @Produce json
// @Success 200 {object} response.MetricTypeList
// @Router /api/alert/metrics [get]
func (AlertApi) GetMetricTypeList(c *gin.Context) {
	metricTypes := []response.MetricTypeInfo{
		{Type: "cpu", Name: "CPU使用率"},
		{Type: "load1", Name: "1分钟负载"},
		{Type: "load5", Name: "5分钟负载"},
		{Type: "load15", Name: "15分钟负载"},

		{Type: "memory", Name: "内存使用率"},
		{Type: "memory_avail", Name: "可用内存"},
		{Type: "memory_free", Name: "空闲内存"},

		{Type: "disk_usage", Name: "磁盘使用率"},
		{Type: "disk_free", Name: "磁盘剩余空间"},
		{Type: "disk_read", Name: "磁盘读取速率"},
		{Type: "disk_write", Name: "磁盘写入速率"},
		{Type: "disk_volume", Name: "分区使用率"},

		{Type: "network_in", Name: "总网络入站速度"},
		{Type: "network_out", Name: "总网络出站速度"},
		{Type: "netcard_in", Name: "单网卡入站速度"},
		{Type: "netcard_out", Name: "单网卡出站速度"},
		{Type: "netcard_status", Name: "网卡状态"},

		{Type: "online", Name: "在线状态"},
		{Type: "ssl", Name: "SSL证书过期"},
		{Type: "process", Name: "进程状态"},
	}

	res.OkWithData(response.MetricTypeList{
		List: metricTypes,
	}, c)
}
