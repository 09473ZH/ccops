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
	"time"
)

// CommandCompleteRequest 命令补全请求结构
type CommandCompleteRequest struct {
	Query string `json:"query" binding:"required" msg:"请输入命令描述"`
}

// Message 对话消息结构
type Message struct {
	Role    string `json:"role"`    // system/user/assistant
	Content string `json:"content"` // 消息内容
}

// 系统提示词
const systemPrompt = `你是一个 Linux/Windows 命令行专家。用户会描述他们想要完成的任务或者记不完整的命令，
你需要帮助他们补全或找到正确的命令。请按以下格式回答：

1. 首先给出完整的命令名称
2. 然后提供具体的命令示例
3. 解释命令的作用
4. 列出常用参数说明
5. 如果命令有危险性，要特别说明

请用中文回答，回答要简洁明了。`

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

	// 处理 baseUrl 格式
	if !strings.HasPrefix(baseUrl, "http://") && !strings.HasPrefix(baseUrl, "https://") {
		baseUrl = "https://" + baseUrl
	}

	// 检查并修正 API 路径
	if !strings.Contains(baseUrl, "/v1/") {
		baseUrl = strings.TrimSuffix(baseUrl, "/") + "/v1"
	}
	baseUrl = strings.TrimSuffix(baseUrl, "/") + "/chat/completions"

	// 构建消息列表，只包含系统提示词和当前用户问题
	messages := []map[string]string{
		{
			"role":    "system",
			"content": systemPrompt,
		},
		{
			"role":    "user",
			"content": cr.Query,
		},
	}

	// 添加调试日志
	global.Log.Info("最终请求URL:", baseUrl)
	global.Log.Info("收到命令查询请求:", cr.Query)

	// 构建请求体
	requestBody := map[string]interface{}{
		"model":       modelName,
		"messages":    messages,
		"stream":      true,
		"temperature": 0.7,
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

	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	// 添加请求日志
	global.Log.Info("准备发送AI请求")

	resp, err := client.Do(req)
	if err != nil {
		global.Log.Error("AI请求失败:", err)
		res.FailWithMessageSSE("AI请求失败", c)
		return
	}

	// 响应状态日志
	global.Log.Info("AI响应状态:", resp.Status)

	defer resp.Body.Close()

	// 在发送第一个响应前，先发送一个心跳确认连接建立
	c.Writer.Write([]byte("event: ping\ndata: connected\n\n"))
	c.Writer.Flush()

	// 改进错误响应
	if resp.StatusCode != http.StatusOK {
		errMsg := fmt.Sprintf("AI服务响应错误(状态码:%d)", resp.StatusCode)
		global.Log.Error(errMsg)
		res.FailWithMessageSSE(errMsg, c)
		return
	}

	// 读取并转发AI的流式响应
	reader := bufio.NewReader(resp.Body)
	for {
		line, err := reader.ReadString('\n')
		if err != nil {
			if err == io.EOF {
				global.Log.Info("响应结束")
				break
			}
			global.Log.Error("读取响应失败:", err)
			res.FailWithMessageSSE("读取响应失败", c)
			break
		}

		// 确保响应行不为空
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		if strings.HasPrefix(line, "data: ") {
			data := strings.TrimPrefix(line, "data: ")
			if data == "[DONE]" {
				break
			}

			// 解析AI响应
			var response struct {
				Choices []struct {
					Delta struct {
						Content string `json:"content"`
					} `json:"delta"`
				} `json:"choices"`
			}

			if err := json.Unmarshal([]byte(data), &response); err != nil {
				global.Log.Error("解析响应失败:", err)
				continue
			}

			// 提取内容并发送
			if len(response.Choices) > 0 && response.Choices[0].Delta.Content != "" {
				content := response.Choices[0].Delta.Content
				// 使用封装好的 SSE 响应方法
				res.OkWithDataSSE(content, c)
			}
		}
	}
}
