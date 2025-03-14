package cron_ser

import (
	"agent/query/monitor"
	"agent/web/request"
	"log"
	"time"
)

// startMetricsCollection 启动系统指标采集定时任务
func StartMetricsCollection() {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			metrics, err := monitor.CollectMetrics()
			if err != nil {
				log.Printf("采集系统指标时出错: %v", err)
				continue
			}

			// 将采集到的指标数据上传到服务端
			err = request.SendMetrics(metrics)
			if err != nil {
				log.Printf("上传系统指标时出错: %v", err)
			}
		}
	}
}
