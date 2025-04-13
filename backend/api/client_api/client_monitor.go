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
		fmt.Printf("!")
		res.FailWithMessage("读取请求体失败", c)
		return
	}
	ip := c.ClientIP()

	// 将请求体重新设置回去
	c.Request.Body = ioutil.NopCloser(bytes.NewBuffer(bodyBytes))

	var metrics monitor.MetricPoint
	if err := c.ShouldBindJSON(&metrics); err != nil {
		fmt.Printf(err.Error())
		res.FailWithMessage("参数错误", c)
		return
	}

	// 查找主机ID
	global.DB.Model(&models.HostModel{}).Where("host_server_url = ?", ip).Select("id").First(&metrics.HostID)

	// 将指标数据插入到时序数据库中
	global.TimeSeriesDB.Insert(&metrics)

	// 检查告警规则
	alertService := alert.GetAlertService()
	if err := alertService.CheckMetrics(&metrics); err != nil {
		fmt.Printf("告警检查失败: %v\n", err)
	}

	// 获取该主机的最新数据
	global.TimeSeriesDB.GetLatest(metrics.HostID)

	// 获取该主机的所有数据并打印统计信息
	global.TimeSeriesDB.GetAllData(metrics.HostID)

	res.OkWithMessage("指标数据接收成功", c)
}
