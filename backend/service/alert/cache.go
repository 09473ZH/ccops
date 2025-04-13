package alert

import (
	"ccops/global"
	"ccops/models/alert"
	"fmt"
	"log"
	"sync"
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
	})
	return ruleCache
}

// RefreshCache 刷新缓存
func (c *AlertRuleCache) RefreshCache() {
	c.Lock()
	defer c.Unlock()

	// 查询所有启用的告警规则
	var rules []alert.AlertRule
	if err := global.DB.Where("enabled = ?", true).Find(&rules).Error; err != nil {
		log.Printf("查询告警规则失败: %v", err)
		return
	}

	// 查询所有规则目标
	var targets []alert.AlertRuleTarget
	if err := global.DB.Find(&targets).Error; err != nil {
		log.Printf("查询规则目标失败: %v", err)
		return
	}

	// 创建新的缓存映射
	newGlobalRules := make(map[uint64]*alert.AlertRule)
	newHostRules := make(map[uint64]map[uint64]*alert.AlertRule)
	newLabelRules := make(map[uint64]map[uint64]*alert.AlertRule)
	newBlacklist := make(map[string]bool)

	// 处理规则和目标
	for i := range rules {
		rule := &rules[i]
		// 处理全局规则
		if rule.Universal {
			newGlobalRules[rule.ID] = rule

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

				}
				continue
			}

			// 处理白名单
			if target.TargetType == alert.TargetTypeHost {
				if _, exists := newHostRules[target.TargetID]; !exists {
					newHostRules[target.TargetID] = make(map[uint64]*alert.AlertRule)
				}
				newHostRules[target.TargetID][rule.ID] = rule

			} else {
				if _, exists := newLabelRules[target.TargetID]; !exists {
					newLabelRules[target.TargetID] = make(map[uint64]*alert.AlertRule)
				}
				newLabelRules[target.TargetID][rule.ID] = rule

			}
		}
	}

	// 更新缓存
	c.globalRules = newGlobalRules
	c.hostRules = newHostRules
	c.labelRules = newLabelRules
	c.blacklist = newBlacklist

}

// GetRulesForHost 获取适用于指定主机的规则
func (c *AlertRuleCache) GetRulesForHost(hostID uint64, hostLabels []uint64) []*alert.AlertRule {
	c.RLock()
	defer c.RUnlock()

	// 用于去重的map
	rulesMap := make(map[uint64]*alert.AlertRule)

	// 添加全局规则
	for ruleID, rule := range c.globalRules {
		// 检查是否在黑名单中
		if !c.blacklist[fmt.Sprintf("%d_%d", ruleID, hostID)] {
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

	// 转换为切片
	rules := make([]*alert.AlertRule, 0, len(rulesMap))
	for _, rule := range rulesMap {
		rules = append(rules, rule)
	}

	return rules
}
