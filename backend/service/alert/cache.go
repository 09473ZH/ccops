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
	// 创建新的缓存
	newGlobalRules := make(map[uint64]*alert.AlertRule)
	newHostRules := make(map[uint64]map[uint64]*alert.AlertRule)
	newLabelRules := make(map[uint64]map[uint64]*alert.AlertRule)
	newBlacklist := make(map[string]bool)

	// 查询所有启用的告警规则
	var rules []alert.AlertRule
	if err := global.DB.Where("enabled = ?", true).Find(&rules).Error; err != nil {
		log.Printf("刷新告警规则缓存失败: %v", err)
		return
	}

	// 查询所有规则目标
	var targets []alert.AlertRuleTarget
	if err := global.DB.Find(&targets).Error; err != nil {
		log.Printf("刷新告警规则目标缓存失败: %v", err)
		return
	}

	// 处理规则和目标
	for i := range rules {
		rule := &rules[i]
		if rule.Universal {
			// 全局规则
			newGlobalRules[rule.ID] = rule
		}
	}

	// 处理目标关联
	for _, target := range targets {
		rule, exists := newGlobalRules[target.AlertRuleID]
		if !exists {
			// 查找非全局规则
			for i := range rules {
				if rules[i].ID == target.AlertRuleID {
					rule = &rules[i]
					break
				}
			}
			if rule == nil {
				continue
			}
		}

		if target.Excluded {
			// 黑名单
			if target.TargetType == alert.TargetTypeHost {
				newBlacklist[formatBlacklistKey(target.AlertRuleID, target.TargetID)] = true
			}
		} else {
			// 白名单
			if target.TargetType == alert.TargetTypeHost {
				// 主机特定规则
				if _, exists := newHostRules[target.TargetID]; !exists {
					newHostRules[target.TargetID] = make(map[uint64]*alert.AlertRule)
				}
				newHostRules[target.TargetID][target.AlertRuleID] = rule
			} else if target.TargetType == alert.TargetTypeLabel {
				// 标签规则
				if _, exists := newLabelRules[target.TargetID]; !exists {
					newLabelRules[target.TargetID] = make(map[uint64]*alert.AlertRule)
				}
				newLabelRules[target.TargetID][target.AlertRuleID] = rule
			}
		}
	}

	// 使用写锁更新缓存
	c.Lock()
	c.globalRules = newGlobalRules
	c.hostRules = newHostRules
	c.labelRules = newLabelRules
	c.blacklist = newBlacklist
	c.lastUpdate = time.Now()
	c.version++
	c.Unlock()

	log.Printf("告警规则缓存刷新完成，全局规则：%d，主机规则：%d，标签规则：%d，版本号：%d",
		len(c.globalRules), len(c.hostRules), len(c.labelRules), c.version)
}

// GetRulesForHost 获取适用于指定主机的所有规则
func (c *AlertRuleCache) GetRulesForHost(hostID uint64, hostLabels []uint64) []*alert.AlertRule {
	c.RLock()
	currentVersion := c.version

	// 用map去重
	rulesMap := make(map[uint64]*alert.AlertRule)

	// 添加全局规则（排除黑名单）
	for ruleID, rule := range c.globalRules {
		if !c.blacklist[formatBlacklistKey(ruleID, hostID)] {
			rulesMap[ruleID] = rule
		}
	}

	// 添加主机特定规则
	if hostRules, exists := c.hostRules[hostID]; exists {
		for ruleID, rule := range hostRules {
			rulesMap[ruleID] = rule
		}
	}

	// 添加标签规则
	for _, labelID := range hostLabels {
		if labelRules, exists := c.labelRules[labelID]; exists {
			for ruleID, rule := range labelRules {
				rulesMap[ruleID] = rule
			}
		}
	}
	c.RUnlock()

	// 检查版本是否变化，如果变化则重新获取
	c.RLock()
	if currentVersion != c.version {
		c.RUnlock()
		return c.GetRulesForHost(hostID, hostLabels)
	}
	c.RUnlock()

	// 转换为切片
	rules := make([]*alert.AlertRule, 0, len(rulesMap))
	for _, rule := range rulesMap {
		rules = append(rules, rule)
	}

	return rules
}

// formatBlacklistKey 格式化黑名单key
func formatBlacklistKey(ruleID, hostID uint64) string {
	return fmt.Sprintf("%d_%d", ruleID, hostID)
}
