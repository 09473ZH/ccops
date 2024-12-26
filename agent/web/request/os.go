package request

import (
	"agent/query"
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

	fmt.Println("Successfully sent info data to server.")
	return nil
}
