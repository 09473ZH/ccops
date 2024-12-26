package request

import (
	"agent/web/clglobal"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
)

// 定义一个结构体来表示公钥的响应格式
type PublicKeyResponse struct {
	PublicKey string `json:"public_key"`
}

// 发请求到全局变量里的地址获取服务端公钥
func GetPublicKey() (string, error) {

	url := fmt.Sprintf("%s/api/client/public_key", *clglobal.Address)
	resp, err := http.Get(url)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	// 检查 HTTP 状态码
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("请求失败，状态码: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	// 解析 JSON 响应体
	var publicKeyResponse PublicKeyResponse
	if err := json.Unmarshal(body, &publicKeyResponse); err != nil {
		return "", err
	}

	// 去掉公钥中的换行符
	cleanPublicKey := strings.ReplaceAll(publicKeyResponse.PublicKey, "\n", " ")

	// 返回公钥内容
	return cleanPublicKey, nil
}
