package hosts_api

import (
	"bytes"
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"ccops/utils/jwts"
	"ccops/utils/permission"
	"encoding/json"
	"fmt"
	"github.com/gin-gonic/gin"
	"io/ioutil"
	"net/http"
	"regexp"
)

// HostNameRequest 定义请求体
type HostNameRequest struct {
	HostName      string `json:"hostname"`
	HostServerUrl string `json:"hostServerUrl"`
}

func (HostsApi) HostRename(c *gin.Context) {
	_claims, _ := c.Get("claims")
	claims := _claims.(*jwts.CustomClaims)
	var cr HostNameRequest
	if err := c.ShouldBindJSON(&cr); err != nil {
		res.FailWithMessage(err.Error(), c)
		return
	}
	var hostId uint
	global.DB.Model(&models.HostModel{}).Where("host_server_url = ?", cr.HostServerUrl).Select("id").Scan(&hostId)
	if !permission.IsPermission(claims.UserID, hostId) {
		res.FailWithMessage("权限错误", c)
		return
	}
	// 校验 host_name 是否符合要求

	validHostName := regexp.MustCompile(`^[a-z0-9]+([-][a-z0-9]+)*$`)
	if !validHostName.MatchString(cr.HostName) {
		res.FailWithMessage("host_name 只能包含小写字母、数字和中划线，且不能以中划线开头或结尾", c)
		return
	}

	url := fmt.Sprintf("http://%s:41541/api/rename", cr.HostServerUrl)

	// 构建请求体
	requestBody, err := json.Marshal(cr)
	if err != nil {
		res.FailWithMessage("failed to marshal request body: "+err.Error(), c)
		return
	}

	// 发送 POST 请求
	resp, err := http.Post(url, "application/json", bytes.NewBuffer(requestBody))
	if err != nil {
		res.FailWithMessage("failed to send request: "+err.Error(), c)
		return
	}
	defer resp.Body.Close()

	// 检查响应状态
	if resp.StatusCode != http.StatusOK {
		res.FailWithMessage(fmt.Sprintf("received non-200 response: %d", resp.StatusCode), c)
		return
	}

	// 读取响应体
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		res.FailWithMessage("failed to read response body: "+err.Error(), c)
		return
	}

	// 处理响应
	var responseBody map[string]interface{}
	if err := json.Unmarshal(body, &responseBody); err != nil {
		res.FailWithMessage("failed to decode response: "+err.Error(), c)
		return
	}

	// 检查并返回成功消息
	if msg, ok := responseBody["message"].(string); ok {
		if msg == "更改成功" {
			if err := SaveHostRenameToDatabase(cr.HostServerUrl, cr.HostName); err != nil {
				res.FailWithMessage("failed to save to database: "+err.Error(), c)
				return
			}
			res.OkWithMessage(msg, c)
		} else {
			res.FailWithMessage("重命名失败: "+msg, c)
		}
	} else {
		res.FailWithMessage("unexpected response format", c)
	}
}

// 假设的数据库保存函数
func SaveHostRenameToDatabase(url, hostName string) error {
	err := global.DB.Model(&models.HostModel{}).Where("host_server_url = ?", url).Update("name", hostName).Error
	if err != nil {
		return err
	}
	return nil // 如果有错误，返回相应的错误信息
}
