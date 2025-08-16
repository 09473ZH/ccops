package main

import (
	"agent/query"
	"agent/websocket"
	"flag"
	"log"
	"time"

	"github.com/kardianos/service"
)

type program struct{
	wsClient *websocket.AgentClient
}

// 提取 flag 定义到外面
var (
	action  = flag.String("action", "", "Install or uninstall the service (use 'install' or 'uninstall' or 'run')")
	server  = flag.String("server", "", "Server address")
	version = flag.Bool("version", false, "Show version")
)

func (p *program) Start(s service.Service) error {
	// 启动服务时的逻辑
	go p.run()
	return nil
}

func (p *program) run() {
	log.Println("Agent starting...")
	time.Sleep(1 * time.Second)

	// 只启动 WebSocket 客户端
	p.wsClient = websocket.NewAgentClient(*server)
	if err := p.wsClient.Start(); err != nil {
		log.Printf("Failed to start WebSocket client: %v", err)
		return
	}

	log.Println("Agent running successfully")
	
	// 保持主程序运行
	select {}
}

func (p *program) Stop(s service.Service) error {
	// 停止服务时的逻辑
	if p.wsClient != nil {
		log.Println("Stopping WebSocket client...")
		p.wsClient.Stop()
	}
	return nil
}

func runAction(s service.Service) {
	switch *action {
	case "install":
		installService(s)
	case "uninstall":
		uninstallService(s)
	case "run":
		if err := s.Run(); err != nil {
			log.Printf("Error running service: %v", err)
		}
	default:
		log.Println("Invalid action. Use 'install', 'uninstall', or 'run'.")
	}
}

func installService(s service.Service) {
	// 强制重新安装：先停止并卸载（忽略错误）
	s.Stop()
	s.Uninstall()
	
	if err := s.Install(); err != nil {
		log.Printf("Error installing service: %v", err)
		return
	}
	log.Println("Service installed successfully")
	
	if err := s.Start(); err != nil {
		log.Printf("Error starting service: %v", err)
		return
	}
	log.Println("Service started successfully")
}

func uninstallService(s service.Service) {
	if err := s.Stop(); err != nil {
		log.Printf("Error stopping service: %v", err)
	}
	
	if err := s.Uninstall(); err != nil {
		log.Printf("Error uninstalling service: %v", err)
		return
	}
	log.Println("Service uninstalled successfully")
}

func main() {
	flag.Parse()
	
	if *version {
		log.Println("ccagent version:", query.GetAgentVersion())
		return
	}
	
	// 验证参数
	if *action != "uninstall" && *server == "" {
		log.Println("Server address is required. Use -server <address>, like -server http://ccops.corgi.plus")
		return
	}
	
	if *server != "" {
		log.Println("Server address:", *server)
	}

	svcConfig := &service.Config{
		Name:        "ccagent",
		DisplayName: "CC Agent Service", 
		Description: "Agent service of ccagent",
		Arguments:   []string{"-action", "run", "-server", *server},
		Dependencies: []string{"Requires=network.target", "After=network-online.target"},
	}

	s, err := service.New(&program{}, svcConfig)
	if err != nil {
		log.Printf("Error creating service: %v", err)
		return
	}

	runAction(s)
}
