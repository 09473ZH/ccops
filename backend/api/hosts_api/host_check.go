package hosts_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"fmt"
	"github.com/gin-gonic/gin"
	"log"
	"net/http"

	"time"
)

type FlushRequest struct {
	Id uint `json:"id"`
}

// 健康检查2.0——主动请求os
// 主动申请更新主机信息,传id就更指定主机信息，不传就更新所有主机信息
// 本质是给某个主机或全部主机发送一个更新主机信息的请求
func (HostsApi) HostFlushInfoView(c *gin.Context) {
	var cr FlushRequest
	err := c.ShouldBindJSON(&cr)
	if err != nil {
		res.FailWithMessage("参数错误", c)
		return
	}

	if cr.Id == 0 {
		// 给所有主机发更新请求
		PingHosts(nil)
	} else {
		// 给指定主机发更新请求
		PingHosts(&cr.Id)
	}
}

// PingHosts 遍历数据库中的主机并执行检查操作
func PingHosts(optionalVal *uint) {
	if optionalVal == nil {
		// 查询数据库中的所有主机
		var hosts []models.HostModel

		err := global.DB.Find(&hosts).Error
		if err != nil {
			log.Printf("Failed to query hosts: %v\n", err)
			return
		}

		// 遍历所有主机
		for _, host := range hosts {
			url := fmt.Sprintf("http://%s:41541/api/os", host.HostServerUrl) // 构建 URL
			client := http.Client{
				Timeout: 5 * time.Second,
			}
			resp, err := client.Get(url)
			if err != nil {
				log.Printf("Error connecting to %s: %v\n", url, err)
				continue
			}
			defer func() {
				if resp != nil {
					resp.Body.Close()
				}
			}()
		}
	} else {
		// 指定查某个
		var host models.HostModel
		err := global.DB.Take(&host, *optionalVal).Error
		if err != nil {
			log.Printf("Failed to query host with ID %d: %v\n", *optionalVal, err)
			return
		}

		url := fmt.Sprintf("http://%s:41541/api/os", host.HostServerUrl) // 构建 URL
		client := http.Client{
			Timeout: 5 * time.Second,
		}
		resp, err := client.Get(url)
		if err != nil {
			log.Printf("Error connecting to %s: %v\n", url, err)
			return
		}
		defer func() {
			if resp != nil {
				resp.Body.Close()
			}
		}()
	}
}
