package cron_ser

import (
	"ccops/global"
	"ccops/models"
	"fmt"
	"log"
	"net/http"
	"time"
)

// PingHosts 遍历数据库中的主机并执行检查操作
func PingHosts() {
	var hosts []models.HostModel

	// 查询数据库中的所有主机
	err := global.DB.Find(&hosts).Error
	if err != nil {
		log.Printf("Failed to query hosts: %v\n", err)
		return
	}

	// 遍历所有主机
	for _, host := range hosts {
		url := fmt.Sprintf("http://%s:41541/api/health", host.HostServerUrl) // 构建 URL
		if checkServer(url) {
			// 如果检查成功，更新主机的 start_time
			host.StartTime = time.Now()
			if err := global.DB.Model(&host).Where("id = ?", host.ID).Update("start_time", host.StartTime).Error; err != nil {
				log.Printf("Failed to update host %s login time: %v\n", host.Name, err)
			} else {
				log.Printf("Host %s is online, login time updated\n", host.Name)
			}
		} else {
			log.Printf("Host %s is offline or the server on port 41541 is not responding\n", host.Name)
		}
	}
}

// checkServer 发送 HTTP GET 请求到主机的 :41541/health 端口并检查响应状态
func checkServer(url string) bool {
	client := http.Client{
		Timeout: 5 * time.Second, // 设置超时时间为 5 秒
	}
	resp, err := client.Get(url)
	if err != nil {
		log.Printf("Error connecting to %s: %v\n", url, err)
		return false
	}
	defer resp.Body.Close()

	// 如果 HTTP 状态码是 200 (OK)，则表示服务正常
	if resp.StatusCode == http.StatusOK {
		return true
	}

	return false
}
