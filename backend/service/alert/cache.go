package alert

import (
	"ccops/global"
	"ccops/models/alert"
	"fmt"
	"log"
	"sync"
	"time"
)

// AlertRuleCache 告警规则缓存
type AlertRuleCache struct {
	// 全局规则缓存，key是规则ID
	globalRules map[uint64]*alert.AlertRule
	// 主机特定规则缓存，key是主机ID，value是规则map(key是规则ID)
	hostRules map[uint64]map[uint64]*alert.AlertRule
	// 标签规则缓存，key是标签ID，value是规则map(key是规则ID)
	labelRules map[uint64]map[uint64]*alert.AlertRule
	// 黑名单缓存，key是规则ID_主机ID
	blacklist map[string]bool
	// 缓存版本号，用于并发控制
	version uint64
	// 上次更新时间
	lastUpdate time.Time
	// 缓存更新锁
	sync.RWMutex
}

var (
	ruleCache *AlertRuleCache
	once      sync.Once
)

// GetRuleCache 获取规则缓存单例
func GetRuleCache() *AlertRuleCache {
	once.Do(func() {
		ruleCache = &AlertRuleCache{
			globalRules: make(map[uint64]*alert.AlertRule),
			hostRules:   make(map[uint64]map[uint64]*alert.AlertRule),
			labelRules:  make(map[uint64]map[uint64]*alert.AlertRule),
			blacklist:   make(map[string]bool),
			version:     1,
		}
		// 首次初始化
		ruleCache.RefreshCache()

		// 启动定时刷新任务
		go ruleCache.startAutoRefresh()
	})
	return ruleCache
}

// startAutoRefresh 启动自动刷新任务
func (c *AlertRuleCache) startAutoRefresh() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		if time.Since(c.lastUpdate) >= 30*time.Second {
			c.RefreshCache()
		}
	}
}

// RefreshCache 刷新缓存
func (c *AlertRuleCache) RefreshCache() {
	c.Lock()
	defer c.Unlock()

	log.Printf("开始刷新告警规则缓存...")

	// 查询所有启用的告警规则
	var rules []alert.AlertRule
	if err := global.DB.Where("enabled = ?", true).Find(&rules).Error; err != nil {
		log.Printf("查询告警规则失败: %v", err)
		return
	}
	log.Printf("从数据库获取到 %d 条启用的告警规则", len(rules))

	// 查询所有规则目标
	var targets []alert.AlertRuleTarget
	if err := global.DB.Find(&targets).Error; err != nil {
		log.Printf("查询规则目标失败: %v", err)
		return
	}
	log.Printf("从数据库获取到 %d 条规则目标配置", len(targets))

	// 创建新的缓存映射
	newGlobalRules := make(map[uint64]*alert.AlertRule)
	newHostRules := make(map[uint64]map[uint64]*alert.AlertRule)
	newLabelRules := make(map[uint64]map[uint64]*alert.AlertRule)
	newBlacklist := make(map[string]bool)

	// 处理规则和目标
	for i := range rules {
		rule := &rules[i]
		log.Printf("处理规则: ID=%d, Name=%s, Universal=%v, Type=%s, Operator=%s, Threshold=%.2f",
			rule.ID, rule.Name, rule.Universal, rule.Type, rule.Operator, rule.Threshold)

		// 处理全局规则
		if rule.Universal {
			newGlobalRules[rule.ID] = rule
			log.Printf("添加全局规则: ID=%d", rule.ID)
		}

		// 初始化主机和标签的规则映射
		for _, target := range targets {
			if target.AlertRuleID != rule.ID {
				continue
			}

			if target.Excluded {
				// 处理黑名单
				if target.TargetType == alert.TargetTypeHost {
					blacklistKey := fmt.Sprintf("%d_%d", rule.ID, target.TargetID)
					newBlacklist[blacklistKey] = true
					log.Printf("添加黑名单: RuleID=%d, HostID=%d", rule.ID, target.TargetID)
				}
				continue
			}

			// 处理白名单
			if target.TargetType == alert.TargetTypeHost {
				if _, exists := newHostRules[target.TargetID]; !exists {
					newHostRules[target.TargetID] = make(map[uint64]*alert.AlertRule)
				}
				newHostRules[target.TargetID][rule.ID] = rule
				log.Printf("添加主机规则: RuleID=%d, HostID=%d", rule.ID, target.TargetID)
			} else {
				if _, exists := newLabelRules[target.TargetID]; !exists {
					newLabelRules[target.TargetID] = make(map[uint64]*alert.AlertRule)
				}
				newLabelRules[target.TargetID][rule.ID] = rule
				log.Printf("添加标签规则: RuleID=%d, LabelID=%d", rule.ID, target.TargetID)
			}
		}
	}

	// 更新缓存
	c.globalRules = newGlobalRules
	c.hostRules = newHostRules
	c.labelRules = newLabelRules
	c.blacklist = newBlacklist
	c.lastUpdate = time.Now()

	log.Printf("告警规则缓存已更新: %d个全局规则, %d个主机规则, %d个标签规则",
		len(c.globalRules), len(c.hostRules), len(c.labelRules))
}

// GetRulesForHost 获取适用于指定主机的规则
func (c *AlertRuleCache) GetRulesForHost(hostID uint64, hostLabels []uint64) []*alert.AlertRule {
	c.RLock()
	defer c.RUnlock()

	log.Printf("开始获取主机 %d 的告警规则...", hostID)

	// 用于去重的map
	rulesMap := make(map[uint64]*alert.AlertRule)

	// 添加全局规则
	for ruleID, rule := range c.globalRules {
		// 检查是否在黑名单中
		if !c.blacklist[fmt.Sprintf("%d_%d", ruleID, hostID)] {
			rulesMap[ruleID] = rule
			log.Printf("添加全局规则: ID=%d, Name=%s", rule.ID, rule.Name)
		}
	}

	// 添加主机特定规则
	if hostRules, exists := c.hostRules[hostID]; exists {
		for ruleID, rule := range hostRules {
			rulesMap[ruleID] = rule
			log.Printf("添加主机特定规则: ID=%d, Name=%s", rule.ID, rule.Name)
		}
	}

	// 添加标签规则
	for _, labelID := range hostLabels {
		if labelRules, exists := c.labelRules[labelID]; exists {
			for ruleID, rule := range labelRules {
				rulesMap[ruleID] = rule
				log.Printf("添加标签规则: ID=%d, Name=%s", rule.ID, rule.Name)
			}
		}
	}

	// 转换为切片
	rules := make([]*alert.AlertRule, 0, len(rulesMap))
	for _, rule := range rulesMap {
		rules = append(rules, rule)
	}

	log.Printf("主机 %d 共获取到 %d 条告警规则", hostID, len(rules))
	return rules
}

// formatBlacklistKey 格式化黑名单key
func formatBlacklistKey(ruleID, hostID uint64) string {
	return fmt.Sprintf("%d_%d", ruleID, hostID)
}
