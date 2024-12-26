package core_api

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"log"
	"net/http"
)

type ChatUser struct {
	Conn     *websocket.Conn
	UserName string
}

var ConnGroupMap = map[string]ChatUser{}

func (CoreApi) ChatGroupView(c *gin.Context) {
	var upGrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			// 鉴权，这里全部放行
			return true
		},
	}

	// 将http升级至websocket，拿到一个websocket连接对象指针
	conn, err := upGrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to upgrade connection"})
		return
	}
	addr := conn.RemoteAddr().String()

	// 记录新连接的用户
	chatUser := ChatUser{
		Conn:     conn,
		UserName: "User_" + addr,
	}
	ConnGroupMap[addr] = chatUser
	fmt.Printf("User %s connected, total users: %d\n", chatUser.UserName, len(ConnGroupMap))

	// 处理客户端消息
	handleMessages(conn, addr)

	// 处理用户断开连接
	defer func() {
		conn.Close()
		delete(ConnGroupMap, addr)
		fmt.Printf("User %s disconnected, total users: %d\n", chatUser.UserName, len(ConnGroupMap))
	}()
}

func handleMessages(conn *websocket.Conn, addr string) {
	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("Unexpected closure: %v", err)
			} else {
				log.Printf("Read error: %v", err)
			}
			return
		}
		fmt.Printf("Received message from %s: %s\n", addr, msg)
		// 这里可以处理消息，例如广播到其他用户
	}
}
