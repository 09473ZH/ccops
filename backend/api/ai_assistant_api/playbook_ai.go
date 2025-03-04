package ai_assistant_api

import (
	"bytes"
	"ccops/global"
	"ccops/models"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// AnsibleRequest 定义请求结构
type AnsibleRequest struct {
	Requirement string `json:"requirement"`
}

// AnsibleResponse 定义响应结构
type AnsibleResponse struct {
	TaskContent string `json:"task_content"`
	Description string `json:"description"`
}

// OpenAIRequest 定义发送给OpenAI的请求结构
type OpenAIRequest struct {
	Model           string         `json:"model"`
	Messages        []ChatMessage  `json:"messages"`
	Stream          bool           `json:"stream"`
	Temperature     float64        `json:"temperature"`
	Response_format ResponseFormat `json:"response_format"`
}

type ResponseFormat struct {
	Type string `json:"type"`
}

type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

const systemPrompt = `你是一个 Ansible 专家。请根据用户的需求生成简单且实用的 Ansible role 代码。

直接返回JSON格式（不要包含markdown代码块标记），格式要求：
{
  "task_content": "- name: 任务描述\n  模块:\n    参数: 值",
  "description": "简要说明这个 role 的功能"
}

示例：
{
  "task_content": "- name: Install htop\n  apt:\n    name: htop\n    state: present\n    update_cache: yes",
  "description": "此 role 用于在 Ubuntu 系统上安装 htop 工具。"
}

注意：
1. 保持代码简单，优先使用单个任务完成需求
2. 只在必要时才添加额外的任务步骤
3. JSON 中的换行使用 \n 转义
4. YAML 缩进使用两个空格
5. 直接返回JSON，不要使用markdown代码块格式`

// OpenAIConfig 添加配置结构体
type OpenAIConfig struct {
	ID        uint   `gorm:"primarykey"`
	BaseURL   string `gorm:"column:base_url"`
	ApiKey    string `gorm:"column:api_key"`
	ModelName string `gorm:"column:model_name"`
}

// 清理 Markdown 代码块的辅助函数
func cleanMarkdownCodeBlock(content string) string {
	// 移除 ```json 和 ``` 标记
	content = strings.TrimPrefix(content, "```json\n")
	content = strings.TrimPrefix(content, "```\n")
	content = strings.TrimSuffix(content, "\n```")
	content = strings.TrimSpace(content)
	return content
}

// 在构建请求URL之前添加URL格式验证和修正
func ensureValidBaseURL(baseURL string) string {
	if !strings.HasPrefix(baseURL, "http://") && !strings.HasPrefix(baseURL, "https://") {
		return "https://" + baseURL
	}
	return baseURL
}

// GenerateAnsibleRole 处理生成Ansible role的请求
func (AIAssistantApi) GenerateAnsibleRole(c *gin.Context) {

	// 从数据库获取OpenAI配置

	var config OpenAIConfig
	var llm []models.Configuration
	global.DB.Model(&models.Configuration{}).Where("type = ?", "llm").Find(&llm)
	for _, l := range llm {
		if l.FieldName == "BaseUrl" {
			config.BaseURL = l.FieldValue
			continue
		}
		if l.FieldName == "ApiKey" {
			config.ApiKey = l.FieldValue
			continue
		}
		if l.FieldName == "ModelName" {
			config.ModelName = l.FieldValue
			continue
		}
	}

	// 确保 BaseURL 格式正确
	config.BaseURL = ensureValidBaseURL(config.BaseURL)

	var req AnsibleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "请求格式错误",
		})
		return
	}

	openAIReq := OpenAIRequest{
		Model: config.ModelName, // 使用数据库中的模型名称
		Messages: []ChatMessage{
			{
				Role:    "system",
				Content: systemPrompt,
			},
			{
				Role:    "user",
				Content: fmt.Sprintf("请生成一个 Ansible role 来实现以下功能：%s", req.Requirement),
			},
		},
		Stream:      false,
		Temperature: 0.7,
		Response_format: ResponseFormat{
			Type: "json_object",
		},
	}

	client := &http.Client{
		Timeout: 60 * time.Second,
	}

	jsonData, err := json.Marshal(openAIReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "请求处理错误",
		})
		return
	}

	// 使用数据库中的BaseURL
	openaiReq, err := http.NewRequest("POST", config.BaseURL+"/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("创建请求失败: %v", err),
			"details": map[string]string{
				"baseURL": config.BaseURL,
				"model":   config.ModelName,
			},
		})
		return
	}

	openaiReq.Header.Set("Content-Type", "application/json")
	// 使用数据库中的ApiKey
	openaiReq.Header.Set("Authorization", "Bearer "+config.ApiKey)

	// 在发送请求前添加配置信息日志
	fmt.Printf("正在调用OpenAI API，配置信息：BaseURL=%s, Model=%s\n", config.BaseURL, config.ModelName)

	resp, err := client.Do(openaiReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("API调用失败: %v", err),
			"details": map[string]string{
				"baseURL": config.BaseURL,
				"model":   config.ModelName,
			},
		})
		return
	}
	defer resp.Body.Close()

	// 添加状态码检查
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":    fmt.Sprintf("API返回非200状态码: %d", resp.StatusCode),
			"response": string(body),
			"details": map[string]string{
				"baseURL":    config.BaseURL,
				"model":      config.ModelName,
				"statusCode": fmt.Sprintf("%d", resp.StatusCode),
			},
		})
		return
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "读取响应失败",
		})
		return
	}

	// 在解析响应之前添加日志
	fmt.Printf("OpenAI原始响应: %s\n", string(body))

	var openAIResp struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}

	if err := json.Unmarshal(body, &openAIResp); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":        fmt.Sprintf("解析OpenAI响应失败: %v", err),
			"raw_response": string(body),
		})
		return
	}

	// 在解析结果之前添加日志
	fmt.Printf("OpenAI返回的content内容: %s\n", openAIResp.Choices[0].Message.Content)

	// 清理 Markdown 代码块
	cleanContent := cleanMarkdownCodeBlock(openAIResp.Choices[0].Message.Content)
	fmt.Printf("清理后的content内容: %s\n", cleanContent)

	var result AnsibleResponse
	if err := json.Unmarshal([]byte(cleanContent), &result); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":           fmt.Sprintf("解析结果失败: %v", err),
			"content":         openAIResp.Choices[0].Message.Content,
			"cleaned_content": cleanContent,
		})
		return
	}

	c.JSON(http.StatusOK, result)
}
