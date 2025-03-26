package alert

import (
	"log"
	"time"
)

// StartCronTasks 启动告警相关的定时任务
func StartCronTasks() {
	// 启动规则缓存刷新任务
	go startRuleCacheRefresh()
}

// startRuleCacheRefresh 启动规则缓存刷新任务
func startRuleCacheRefresh() {
	ticker := time.NewTicker(2 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			log.Printf("开始刷新告警规则缓存")
			GetRuleCache().RefreshCache()
		}
	}
}
