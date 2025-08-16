package websocket

import (
	"agent/query"
	"agent/ssh"
	"encoding/json"
	"fmt"
	"log"
	"net/url"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type AgentClient struct {
	serverURL     string
	conn          *websocket.Conn
	sshSessions   map[string]*ssh.SSHTunnel // session_id -> tunnel
	hostInfo      *query.HostDetailInfo
	mu            sync.RWMutex
	sessionsMu    sync.RWMutex // 保护 sshSessions
	connected     bool
	reconnectChan chan bool
	stopChan      chan bool
	writeMu       sync.Mutex // 添加写入锁
}

type AgentMessage struct {
	Type      string      `json:"type"`
	Data      interface{} `json:"data,omitempty"`
	HostID    string      `json:"host_id,omitempty"`
	SessionID string      `json:"session_id,omitempty"`
	Error     string      `json:"error,omitempty"`
}

type TerminalData struct {
	Data   interface{} `json:"data"`  // 可以是[]byte、string或[]interface{}
	Binary bool        `json:"binary"`
}

type TerminalResize struct {
	Width  int `json:"width"`
	Height int `json:"height"`
}

// NewAgentClient 创建新的Agent WebSocket客户端
func NewAgentClient(serverURL string) *AgentClient {
	return &AgentClient{
		serverURL:     serverURL,
		sshSessions:   make(map[string]*ssh.SSHTunnel),
		reconnectChan: make(chan bool, 1),
		stopChan:      make(chan bool, 1),
	}
}

// Start 启动Agent客户端
func (a *AgentClient) Start() error {
	// 获取主机信息
	hostInfo, err := query.QueryHostDetailInfo()
	if err != nil {
		return fmt.Errorf("failed to get host info: %v", err)
	}
	a.hostInfo = &hostInfo

	// 不再在这里创建tunnel，而是在每个会话开始时创建

	// 启动连接循环
	go a.connectionLoop()

	// 简化版本，不需要复杂的重连逻辑

	log.Println("Agent client started")
	return nil
}

// connectionLoop 连接循环
func (a *AgentClient) connectionLoop() {
	for {
		select {
		case <-a.stopChan:
			log.Println("Agent client stopping...")
			return
		default:
			if err := a.connect(); err != nil {
				log.Printf("Connection failed: %v", err)
				time.Sleep(5 * time.Second)
				continue
			}

			// 连接成功，处理消息
			a.handleMessages()

			// 连接断开，清理并等待重连
			a.cleanup()
			log.Println("Connection lost, attempting to reconnect...")
			time.Sleep(3 * time.Second)
		}
	}
}

// connect 连接到服务器
func (a *AgentClient) connect() error {
	// 构建WebSocket URL
	u, err := url.Parse(a.serverURL)
	if err != nil {
		return err
	}

	// 将http/https转换为ws/wss
	if u.Scheme == "http" {
		u.Scheme = "ws"
	} else if u.Scheme == "https" {
		u.Scheme = "wss"
	}

	u.Path = "/api/agents/connect"

	log.Printf("Connecting to %s", u.String())

	// 建立WebSocket连接
	conn, _, err := websocket.DefaultDialer.Dial(u.String(), nil)
	if err != nil {
		return err
	}

	a.mu.Lock()
	a.conn = conn
	a.connected = true
	a.mu.Unlock()

	// 发送注册消息
	regMsg := AgentMessage{
		Type:   "register",
		HostID: a.hostInfo.HostName,
		Data:   a.hostInfo,
	}

	if err := a.sendMessage(regMsg); err != nil {
		conn.Close()
		return fmt.Errorf("failed to send register message: %v", err)
	}

	log.Println("Agent registered successfully")
	return nil
}

// handleMessages 处理WebSocket消息
func (a *AgentClient) handleMessages() {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("Message handler panic: %v", r)
		}
	}()

	for {
		a.mu.RLock()
		conn := a.conn
		a.mu.RUnlock()

		if conn == nil {
			break
		}

		_, message, err := conn.ReadMessage()
		if err != nil {
			log.Printf("Read message error: %v", err)
			break
		}

		var msg AgentMessage
		if err := json.Unmarshal(message, &msg); err != nil {
			log.Printf("Failed to unmarshal message: %v", err)
			continue
		}

		a.handleMessage(msg)
	}
}

// handleMessage 处理单个消息
func (a *AgentClient) handleMessage(msg AgentMessage) {
	switch msg.Type {
	case "register_ack":
		log.Println("Registration acknowledged by server")
	case "ssh_start":
		a.handleSSHStart(msg)
	case "ssh_data":
		a.handleSSHData(msg)
	case "ssh_resize":
		a.handleSSHResize(msg)
	case "ssh_stop":
		a.handleSSHStop(msg)
	case "ping":
		// 忽略心跳消息
	default:
		log.Printf("Unknown message type: %s", msg.Type)
	}
}

// handleSSHStart 处理SSH启动请求
func (a *AgentClient) handleSSHStart(msg AgentMessage) {
	sessionID := msg.SessionID
	if sessionID == "" {
		log.Println("SSH start request missing session_id")
		return
	}

	a.sessionsMu.Lock()
	defer a.sessionsMu.Unlock()

	// 检查会话是否已存在
	if tunnel, exists := a.sshSessions[sessionID]; exists && tunnel.IsConnected() {
		log.Printf("SSH session %s already connected", sessionID)
		return
	}

	// 创建新的tunnel
	tunnel := ssh.NewSSHTunnel("", "")
	tunnel.SetDataCallback(func(data []byte) error {
		return a.onSSHData(sessionID, data)
	})
	tunnel.SetErrorCallback(func(err error) {
		a.onSSHError(sessionID, err)
	})

	if err := tunnel.Connect(); err != nil {
		log.Printf("Failed to start SSH tunnel for session %s: %v", sessionID, err)
		a.sendMessage(AgentMessage{
			Type:      "ssh_error",
			SessionID: sessionID,
			Error:     fmt.Sprintf("Failed to start SSH: %v", err),
		})
		return
	}

	a.sshSessions[sessionID] = tunnel

	log.Printf("Sending ssh_ready message to server for session %s", sessionID)
	if err := a.sendMessage(AgentMessage{
		Type:      "ssh_ready",
		SessionID: sessionID,
	}); err != nil {
		log.Printf("Failed to send ssh_ready message: %v", err)
		return
	}
	log.Printf("SSH tunnel started for session %s", sessionID)
}

// handleSSHData 处理SSH数据
func (a *AgentClient) handleSSHData(msg AgentMessage) {
	sessionID := msg.SessionID
	if sessionID == "" {
		log.Println("SSH data request missing session_id")
		return
	}

	a.sessionsMu.RLock()
	tunnel, exists := a.sshSessions[sessionID]
	a.sessionsMu.RUnlock()

	if !exists || !tunnel.IsConnected() {
		log.Printf("SSH tunnel for session %s not connected, ignoring data", sessionID)
		return
	}

	// 解析终端数据
	dataBytes, err := json.Marshal(msg.Data)
	if err != nil {
		log.Printf("Failed to marshal terminal data: %v", err)
		return
	}

	var termData TerminalData
	if err := json.Unmarshal(dataBytes, &termData); err != nil {
		log.Printf("Failed to unmarshal terminal data: %v", err)
		return
	}

	// 将数据转换为 []byte
	var inputData []byte
	switch data := termData.Data.(type) {
	case []interface{}:
		// Python发送的整数数组
		inputData = make([]byte, len(data))
		for i, v := range data {
			if num, ok := v.(float64); ok {
				inputData[i] = byte(num)
			}
		}
	case string:
		// 字符串数据
		inputData = []byte(data)
	case []byte:
		// 直接是字节数组
		inputData = data
	default:
		log.Printf("Unknown data type: %T", data)
		return
	}

	if err := tunnel.SendInput(inputData); err != nil {
		log.Printf("Failed to send input to SSH session %s: %v", sessionID, err)
	}
}

// handleSSHResize 处理终端大小调整
func (a *AgentClient) handleSSHResize(msg AgentMessage) {
	sessionID := msg.SessionID
	if sessionID == "" {
		log.Println("SSH resize request missing session_id")
		return
	}

	a.sessionsMu.RLock()
	tunnel, exists := a.sshSessions[sessionID]
	a.sessionsMu.RUnlock()

	if !exists || !tunnel.IsConnected() {
		return
	}

	dataBytes, err := json.Marshal(msg.Data)
	if err != nil {
		log.Printf("Failed to marshal resize data: %v", err)
		return
	}

	var resize TerminalResize
	if err := json.Unmarshal(dataBytes, &resize); err != nil {
		log.Printf("Failed to unmarshal resize data: %v", err)
		return
	}

	if err := tunnel.ResizeTerminal(resize.Width, resize.Height); err != nil {
		log.Printf("Failed to resize terminal for session %s: %v", sessionID, err)
	}
}

// handleSSHStop 处理SSH停止请求
func (a *AgentClient) handleSSHStop(msg AgentMessage) {
	sessionID := msg.SessionID
	if sessionID == "" {
		log.Println("SSH stop request missing session_id")
		return
	}

	a.sessionsMu.Lock()
	defer a.sessionsMu.Unlock()

	tunnel, exists := a.sshSessions[sessionID]
	if !exists {
		log.Printf("SSH session %s not found", sessionID)
		return
	}

	if err := tunnel.Close(); err != nil {
		log.Printf("Failed to close SSH tunnel for session %s: %v", sessionID, err)
	}

	delete(a.sshSessions, sessionID)
	log.Printf("SSH tunnel stopped for session %s", sessionID)
}

// 心跳处理已简化

// onSSHData SSH输出数据回调
func (a *AgentClient) onSSHData(sessionID string, data []byte) error {
	return a.sendMessage(AgentMessage{
		Type:      "ssh_output",
		SessionID: sessionID,
		Data: TerminalData{
			Data:   data,  // Go会自动序列化为base64
			Binary: true,
		},
	})
}

// onSSHError SSH错误回调
func (a *AgentClient) onSSHError(sessionID string, err error) {
	log.Printf("SSH error for session %s: %v", sessionID, err)
	a.sendMessage(AgentMessage{
		Type:      "ssh_error",
		SessionID: sessionID,
		Error:     err.Error(),
	})
}

// sendMessage 发送消息到服务器
func (a *AgentClient) sendMessage(msg AgentMessage) error {
	a.mu.RLock()
	conn := a.conn
	connected := a.connected
	a.mu.RUnlock()

	if !connected || conn == nil {
		return fmt.Errorf("not connected")
	}

	data, err := json.Marshal(msg)
	if err != nil {
		return err
	}

	// 使用写入锁防止并发写入
	a.writeMu.Lock()
	defer a.writeMu.Unlock()
	
	return conn.WriteMessage(websocket.TextMessage, data)
}

// cleanup 清理连接资源
func (a *AgentClient) cleanup() {
	a.mu.Lock()
	defer a.mu.Unlock()

	a.connected = false

	// 关闭所有SSH会话
	a.sessionsMu.Lock()
	for sessionID, tunnel := range a.sshSessions {
		if tunnel != nil && tunnel.IsConnected() {
			tunnel.Close()
		}
		delete(a.sshSessions, sessionID)
	}
	a.sessionsMu.Unlock()

	if a.conn != nil {
		a.conn.Close()
		a.conn = nil
	}
}

// 重连逻辑已简化

// Stop 停止Agent客户端
func (a *AgentClient) Stop() {
	log.Println("Stopping agent client...")
	
	close(a.stopChan)
	a.cleanup()
	
	log.Println("Agent client stopped")
}

// IsConnected 检查连接状态
func (a *AgentClient) IsConnected() bool {
	a.mu.RLock()
	defer a.mu.RUnlock()
	return a.connected
}

// GetHostInfo 获取主机信息
func (a *AgentClient) GetHostInfo() *query.HostDetailInfo {
	return a.hostInfo
}