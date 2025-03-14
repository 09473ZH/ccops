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
	fmt.Printf("  CPU使用率: %.2f%%\n", metrics.CPUUsage)
	fmt.Printf("  内存使用: %.2f%% (总共: %.2f GB, 已用: %.2f GB, 可用: %.2f GB)\n",
		metrics.Memory.UsedPercent,
		float64(metrics.Memory.Total)/(1024*1024*1024),
		float64(metrics.Memory.Used)/(1024*1024*1024),
		float64(metrics.Memory.Available)/(1024*1024*1024))
	fmt.Printf("  Swap使用: %.2f%% (总共: %.2f GB, 已用: %.2f GB)\n",
		metrics.Memory.SwapPercent,
		float64(metrics.Memory.SwapTotal)/(1024*1024*1024),
		float64(metrics.Memory.SwapUsed)/(1024*1024*1024))

	fmt.Printf("磁盘信息:\n")
	for _, disk := range metrics.DiskUsages {
		fmt.Printf("  %s (%s): %.2f%% 已用 (总共: %.2f GB, 可用: %.2f GB)\n",
			disk.Path, disk.FSType,
			disk.UsedPercent,
			float64(disk.Total)/(1024*1024*1024),
			float64(disk.Free)/(1024*1024*1024))
	}

	fmt.Printf("网络信息:\n")
	for _, net := range metrics.NetworkStatus {
		fmt.Printf("  网卡 %s:\n", net.Name)
		fmt.Printf("    MAC: %s, IPv4: %s, IPv6: %s\n", net.MAC, net.IPv4, net.IPv6)
		fmt.Printf("    实时速率: 入站 %.2f MB/s, 出站 %.2f MB/s\n",
			net.BytesRecvRate/(1024*1024),
			net.BytesSentRate/(1024*1024))
		fmt.Printf("    错误统计: 入站错误 %d, 出站错误 %d, 入站丢包 %d, 出站丢包 %d\n",
			net.Errin, net.Errout, net.Dropin, net.Dropout)
		fmt.Printf("    TCP连接数: %d\n", len(net.TCPConnections))
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
		fmt.Printf("\n[时序数据库] 最新数据点时间戳: %d\n", latestData.Timestamp)
	}

	// 获取该主机的所有数据并打印统计信息
	allData := global.TimeSeriesDB.GetAllData(metrics.HostID)
	fmt.Printf("[时序数据库] 主机 %d 的数据点数量: %d\n", metrics.HostID, len(allData))

	res.OkWithMessage("指标数据接收成功", c)
}
