package request

import (
	"agent/query"
	"agent/query/monitor/models"
	"agent/web/clglobal"
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

// 发送 HTTP 请求到指定 URL
func SendHostInfoRequest() error {
	//注册部分

	var info query.HostDetailInfo
	info, err := query.QueryHostDetailInfo()
	if err != nil {
		log.Println("Failed to query host detail info:", err)
		return err
	}
	url := fmt.Sprintf("%s/api/client/receive", *clglobal.Address)
	jsonData, err := json.Marshal(info) // 确保发送正确的 JSON 数据
	if err != nil {
		return err
	}

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("received non-OK response: %s", resp.Status)
	}

	log.Println("Successfully sent info data to server.")
	return nil
}

// SendMetrics 发送系统指标数据到服务端
func SendMetrics(metrics *models.SystemMetrics) error {
	url := fmt.Sprintf("%s/api/client/metrics", *clglobal.Address)
	jsonData, err := json.Marshal(metrics)
	if err != nil {
		return err
	}

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("发送指标数据失败，状态码: %d", resp.StatusCode)
		return fmt.Errorf("发送指标数据失败，状态码: %d", resp.StatusCode)
	}

	// 记录网络状态
	for _, netStat := range metrics.Network.Interfaces {
		log.Printf("网卡 %s 状态: 入站速率 %.2f MB/s, 出站速率 %.2f MB/s",
			netStat.Name,
			netStat.RecvRate/1024/1024,
			netStat.SendRate/1024/1024)
	}

	return nil
}
