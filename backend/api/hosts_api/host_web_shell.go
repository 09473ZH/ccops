package hosts_api

import (
	"ccops/global"
	"ccops/models"

	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"golang.org/x/crypto/ssh"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type wsWriter struct {
	conn *websocket.Conn
	mu   sync.Mutex
}

func (w *wsWriter) writeMessage(messageType int, data []byte) error {
	w.mu.Lock()
	defer w.mu.Unlock()
	return w.conn.WriteMessage(messageType, data)
}

var (
	// 正常关闭的错误
	normalCloseCodes = map[int]bool{
		websocket.CloseNormalClosure:    true, // 1000
		websocket.CloseGoingAway:        true, // 1001
		websocket.CloseNoStatusReceived: true, // 1005
	}
)

// 添加一个辅助函数来判断是否是正常关闭
func isNormalClose(err error) bool {
	if websocket.IsCloseError(err, websocket.CloseNormalClosure, websocket.CloseGoingAway, websocket.CloseNoStatusReceived) {
		return true
	}
	return false
}

func (HostsApi) HandleWebSocket(c *gin.Context) {

	//_claims, _ := c.Get("claims")
	//claims := _claims.(*jwts.CustomClaims)
	hostID := c.Param("id")

	//id, _ := strconv.ParseUint(hostID, 10, 64)
	//if !permission.IsPermission(claims.UserID, uint(id)) {
	//	res.FailWithMessage("权限错误", c)
	//	return
	//}
	var host models.HostModel
	global.DB.Model(&models.HostModel{}).First(&host, hostID)

	ws, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("升级到 WebSocket 协议失败: %v", err)
		return
	}
	defer ws.Close()

	keyPath := "./.ssh/ccops"
	key, err := ioutil.ReadFile(keyPath)
	if err != nil {
		log.Printf("读取私钥失败: %v", err)
		absPath, _ := filepath.Abs(keyPath)
		log.Printf("尝试读取的私钥路径: %s", absPath)
		ws.WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("读取私钥失败: %v", err)))
		return
	}

	//将私钥文件的内容转换成可用于 SSH 认证的格式。
	signer, err := ssh.ParsePrivateKey(key)
	if err != nil {
		ws.WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("解析私钥失败: %v", err)))
		return
	}

	config := &ssh.ClientConfig{
		User: "root",
		Auth: []ssh.AuthMethod{
			ssh.PublicKeys(signer),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         10 * time.Second,
	}

	address := fmt.Sprintf("%s:22", host.HostServerUrl)

	client, err := ssh.Dial("tcp", address, config)
	if err != nil {
		ws.WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("SSH 连接失败: %v", err)))
		return
	}
	defer client.Close()

	session, err := client.NewSession()
	if err != nil {
		ws.WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("创建 SSH 会话失败: %v", err)))
		return
	}
	defer session.Close()

	// 使用更大的默认终端尺寸并设置合适的终端模式
	if err := session.RequestPty("xterm", 40, 120, ssh.TerminalModes{
		ssh.ECHO:          1,     // 启用回显
		ssh.TTY_OP_ISPEED: 14400, // 输入速度
		ssh.TTY_OP_OSPEED: 14400, // 输出速度
		ssh.ICANON:        0,     // 禁用规范模式，实现实时输入
	}); err != nil {
		ws.WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("请求 PTY 失败: %v", err)))
		return
	}

	stdin, err := session.StdinPipe()
	if err != nil {
		ws.WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("创建 stdin 管道失败: %v", err)))
		return
	}

	stdout, err := session.StdoutPipe()
	if err != nil {
		ws.WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("创建 stdout 管道失败: %v", err)))
		return
	}

	stderr, err := session.StderrPipe()
	if err != nil {
		ws.WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("创建 stderr 管道失败: %v", err)))
		return
	}

	if err := session.Shell(); err != nil {
		ws.WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("启动 shell 失败: %v", err)))
		return
	}

	// 设置空闲超时
	// const idleTimeout = 10 * time.Minute
	// idleTimer := time.NewTimer(idleTimeout)
	// defer idleTimer.Stop()

	// 更新最后活动时间的函数（只在真实操作时调用）
	updateLastActivity := func() {
		// if !idleTimer.Stop() {
		//     select {
		//     case <-idleTimer.C:
		//     default:
		//     }
		// }
		// idleTimer.Reset(idleTimeout)
	}

	// 在创建 WebSocket 连接后，初始化 wsWriter
	writer := &wsWriter{conn: ws}

	// 添加一个 done channel 用于协调关闭
	done := make(chan struct{})
	defer close(done)

	// 修改输出处理的 goroutine
	go func() {
		buf := make([]byte, 4096)
		for {
			select {
			case <-done:
				return
			default:
				n, err := stdout.Read(buf)
				if err != nil {
					return
				}
				if n > 0 {
					updateLastActivity()
					if err := writer.writeMessage(websocket.TextMessage, buf[:n]); err != nil {
						if !isNormalClose(err) {
							log.Printf("写入stdout失败: %v", err)
						}
						return
					}
				}
			}
		}
	}()

	go func() {
		buf := make([]byte, 4096)
		for {
			select {
			case <-done:
				return
			default:
				n, err := stderr.Read(buf)
				if err != nil {
					return
				}
				if n > 0 {
					updateLastActivity()
					if err := writer.writeMessage(websocket.TextMessage, buf[:n]); err != nil {
						if !isNormalClose(err) {
							log.Printf("写入stderr失败: %v", err)
						}
						return
					}
				}
			}
		}
	}()

	// 修改空闲超时监听的 goroutine
	//go func() {
	//	for {
	//		select {
	//		case <-done:
	//			return
	//		case <-idleTimer.C:
	//			writer.writeMessage(websocket.TextMessage, []byte("\r\n\033[33m会话已超时（10分钟无操作），连接已断开。\033[0m\r\n"))
	//			writer.writeMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, "idle timeout"))
	//			ws.Close()
	//			session.Close()
	//			return
	//		}
	//	}
	//}()
	fmt.Println(1)
	// 修改主循环的错误处理
	for {
		_, message, err := ws.ReadMessage()
		if err != nil {
			if !isNormalClose(err) {
				log.Printf("读取 WebSocket 消息失败: %v", err)
			}
			return
		}

		// 处理心跳包
		if len(message) == 1 && message[0] == 0 {
			err = writer.writeMessage(websocket.TextMessage, []byte{0})
			if err != nil {
				log.Printf("发送心跳响应失败: %v", err)
				return
			}
			continue
		}

		// 处理终端大小调整命令
		if len(message) > 3 && message[0] == 0x1b && message[1] == '[' && message[2] == '8' {
			dims := strings.Split(string(message[4:]), ",")
			if len(dims) == 2 {
				rows, _ := strconv.Atoi(dims[0])
				cols, _ := strconv.Atoi(dims[1])
				session.WindowChange(rows, cols)
				updateLastActivity() // 调整终端大小算作活动
				continue
			}
		}

		// 更新活动时间（真实输入）
		updateLastActivity()

		// 直接写入消息
		_, err = stdin.Write(message)
		if err != nil {
			log.Printf("写入命令失败: %v", err)
			return
		}
	}
}
