package hosts_api

import (
	"bufio"
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"encoding/json"
	"fmt"
	"github.com/gin-gonic/gin"
	"io"
	"net/http"
	"strings"
)

// CommandCompleteRequest 命令补全请求结构
type CommandCompleteRequest struct {
	Query       string    `json:"query" binding:"required" msg:"请输入命令描述"`
	SystemType  string    `json:"systemType" binding:"required" msg:"请指定系统类型"` // linux/windows
	History     []Message `json:"history"` // 添加历史记录字段
}

// Message 对话消息结构
type Message struct {
	Role    string `json:"role"`    // system/user/assistant
	Content string `json:"content"` // 消息内容
}

// 系统提示词
const systemPrompt = `你是一个 Linux/Windows 命令行专家。用户会描述他们想要完成的任务或者记不完整的命令，
你需要帮助他们补全或找到正确的命令。请确保：
1. 给出完整的命令示例
2. 简要解释命令的作用
3. 如果命令有危险性，要特别说明
4. 尽量提供命令的常用参数说明
请用中文回答。`

// CommandCompleteView 处理命令补全的流式响应
func (HostsApi) CommandCompleteView(c *gin.Context) {
	var cr CommandCompleteRequest
	if err := c.ShouldBindJSON(&cr); err != nil {
		res.FailWithError(err, &cr, c)
		return
	}

	// 获取AI配置
	var baseUrl, apiKey, modelName string
	global.DB.Model(&models.Configuration{}).Where("field_name = ?", "BaseUrl").Select("field_value").First(&baseUrl)
	global.DB.Model(&models.Configuration{}).Where("field_name = ?", "ApiKey").Select("field_value").First(&apiKey)
	global.DB.Model(&models.Configuration{}).Where("field_name = ?", "ModelName").Select("field_value").First(&modelName)

	if baseUrl == "" || apiKey == "" || modelName == "" {
		res.FailWithMessageSSE("AI配置不完整", c)
		return
	}

	// 构建用户提示词
	userPrompt := fmt.Sprintf("系统类型：%s\n用户需求：%s", cr.SystemType, cr.Query)

	// 构建消息列表
	messages := []map[string]string{
		{
			"role":    "system",
			"content": systemPrompt,
		},
	}

	// 添加历史记录
	for _, msg := range cr.History {
		messages = append(messages, map[string]string{
			"role":    msg.Role,
			"content": msg.Content,
		})
	}

	// 添加当前用户问题
	messages = append(messages, map[string]string{
		"role":    "user",
		"content": userPrompt,
	})

	// 构建请求体
	requestBody := map[string]interface{}{
		"model":    modelName,
		"messages": messages,
		"stream":   true,
	}

	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		res.FailWithMessageSSE("请求构建失败", c)
		return
	}

	// 创建HTTP请求
	req, err := http.NewRequest("POST", baseUrl, strings.NewReader(string(jsonBody)))
	if err != nil {
		res.FailWithMessageSSE("请求创建失败", c)
		return
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	// 设置SSE响应头
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Transfer-Encoding", "chunked")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		res.FailWithMessageSSE("AI请求失败", c)
		return
	}
	defer resp.Body.Close()

	// 读取并转发AI的流式响应
	reader := bufio.NewReader(resp.Body)
	for {
		line, err := reader.ReadString('\n')
		if err != nil {
			if err == io.EOF {
				break
			}
			global.Log.Error("读取AI响应失败:", err)
			break
		}

		// 处理数据行
		if strings.HasPrefix(line, "data: ") {
			data := strings.TrimPrefix(line, "data: ")
			if data == "[DONE]" {
				break
			}

			// 解析AI响应
			var response map[string]interface{}
			if err := json.Unmarshal([]byte(data), &response); err != nil {
				continue
			}

			// 提取内容
			if choices, ok := response["choices"].([]interface{}); ok && len(choices) > 0 {
				if choice, ok := choices[0].(map[string]interface{}); ok {
					if delta, ok := choice["delta"].(map[string]interface{}); ok {
						if content, ok := delta["content"].(string); ok {
							// 使用已有的SSE响应方法发送内容
							res.OkWithDataSSE(content, c)
						}
					}
				}
			}
		}
	}
} 