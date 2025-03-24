package client_api

import (
	"bytes"
	"ccops/global"
	"ccops/models"
	"ccops/models/monitor"
	"ccops/models/res"
	"ccops/service/alert"
	"fmt"
	"io/ioutil"

	"github.com/gin-gonic/gin"
)

// 接收客户端上报的系统指标数据
func (ClientApi) ClientMetricsReceive(c *gin.Context) {
	// 读取并打印请求体
	bodyBytes, err := c.GetRawData()
	if err != nil {
		res.FailWithMessage("读取请求体失败", c)
		return
	}
	ip := c.ClientIP()

	// 将请求体重新设置回去
	c.Request.Body = ioutil.NopCloser(bytes.NewBuffer(bodyBytes))

	var metrics monitor.MetricPoint
	if err := c.ShouldBindJSON(&metrics); err != nil {
		res.FailWithMessage("参数错误", c)
		return
	}

	// 查找主机ID
	global.DB.Model(&models.HostModel{}).Where("host_server_url = ?", ip).Select("id").First(&metrics.HostID)
	fmt.Printf("\n[接收到新的监控数据] 主机ID: %d, IP: %s\n", metrics.HostID, ip)
	fmt.Printf("基础指标:\n")
	fmt.Printf("  CPU使用率: %.2f%%\n", metrics.CPU.UsagePercent)
	fmt.Printf("  内存使用: %.2f%% (总共: %.2f GB, 已用: %.2f GB, 剩余: %.2f GB)\n",
		metrics.Memory.UsagePercent,
		float64(metrics.Memory.TotalBytes)/(1024*1024*1024),
		float64(metrics.Memory.UsedBytes)/(1024*1024*1024),
		float64(metrics.Memory.FreeBytes)/(1024*1024*1024))

	fmt.Printf("网络信息:\n")
	for _, net := range metrics.Network.Interfaces {
		fmt.Printf("  网卡 %s:\n", net.Name)
		fmt.Printf("    MAC: %s, IPv4: %s\n", net.MacAddress, net.IPv4Address)
		fmt.Printf("    实时速率: 入站 %.2f MB/s, 出站 %.2f MB/s\n",
			net.RecvRate/(1024*1024),
			net.SendRate/(1024*1024))
	}

	// 将指标数据插入到时序数据库中
	global.TimeSeriesDB.Insert(&metrics)

	// 检查告警规则
	alertService := alert.GetAlertService()
	if err := alertService.CheckMetrics(&metrics); err != nil {
		fmt.Printf("告警检查失败: %v\n", err)
	}

	// 获取该主机的最新数据
	latestData := global.TimeSeriesDB.GetLatest(metrics.HostID)
	if latestData != nil {
		fmt.Printf("\n[时序数据库] 最新数据点时间戳: %d\n", latestData.CollectedAt)
	}

	// 获取该主机的所有数据并打印统计信息
	allData := global.TimeSeriesDB.GetAllData(metrics.HostID)
	fmt.Printf("[时序数据库] 主机 %d 的数据点数量: %d\n", metrics.HostID, len(allData))

	res.OkWithMessage("指标数据接收成功", c)
}
