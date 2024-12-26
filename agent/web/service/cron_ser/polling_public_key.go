package cron_ser

import (
	"agent/web/request"
	"log"
	"time"
)

// 定时任务入口函数，公钥更新检查
func StartPollingPublicKey() {

	ticker := time.NewTicker(3 * time.Minute)
	defer ticker.Stop()

	// 每当 ticker 触发时，执行查询和处理逻辑
	for {
		select {
		case <-ticker.C:
			// 查询主机详细信息
			err := request.CheckAndUpdatePublicKey()
			if err != nil {
				log.Printf("查询主机信息时出错: %v", err)
				continue // 继续下一次循环
			}

		}
	}
}
