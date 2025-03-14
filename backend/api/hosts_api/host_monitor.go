package hosts_api

import (
	"ccops/global"
	"ccops/models/res"

	"github.com/gin-gonic/gin"
)

// GetLatestMonitorData 获取最新的监控数据
// @Summary 获取所有机器的最新监控数据
// @Description 获取所有机器的最新系统监控数据
// @Tags 主机监控
// @Accept json
// @Produce json
// @Success 200 {object} map[uint64]*monitor.MetricPoint
// @Router /api/hosts/monitor/latest [get]
func (HostsApi) GetLatestMonitorData(c *gin.Context) {
	// 获取所有主机的最新数据点
	latest := global.TimeSeriesDB.GetAllLatest()
	if latest == nil || len(latest) == 0 {
		res.FailWithMessage("暂无监控数据", c)
		return
	}

	res.OkWithData(latest, c)
}
