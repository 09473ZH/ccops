package main

import (
	"agent/query"
	"agent/web/clglobal"
	"agent/web/request"
	"agent/web/router"
	"flag"
	"log"
	"time"

	"github.com/kardianos/service"
)

type program struct{}

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
	log.Println("服务运行，延时 1 秒运行，等待网络")
	time.Sleep(1 * time.Second)

	clglobal.Address = server
	err := request.SendHostInfoRequest()
	if err != nil {
		log.Fatalf("查询主机信息时出错: %v", err)
	}
	request.CheckAndUpdatePublicKey() // 检查并更新公钥

	// 启动 Gin 路由
	router.StartGin() // 调用 web/router 包中的函数

}

func (p *program) Stop(s service.Service) error {
	// 停止服务时的逻辑
	return nil
}

func runAction(s service.Service) {
	switch *action {
	case "install":
		// 先尝试卸载现有服务
		// 检查服务是否存在
		_, err := s.Status()
		if err == nil {
			log.Println("检测到现有服务，正在卸载...")
			err = s.Stop()
			if err != nil {
				log.Println("停止服务时出错:", err)
			}
			err = s.Uninstall()
			if err != nil {
				log.Println("卸载服务时出错:", err)
			} else {
				log.Println("现有服务已成功卸载")
			}
		}

		// 然后重新安装服务
		err = s.Install()
		if err != nil {
			log.Println("安装服务时出错:", err)
			return
		}
		log.Println("服务安装成功。正在启动服务...")
		err = s.Start()
		if err != nil {
			log.Println("启动服务时出错:", err)
			return
		}

		log.Println("服务启动成功。")
	case "uninstall":
		err := s.Stop()
		if err != nil {
			log.Println("Error stopping service:", err)
			return
		}
		log.Println("Service stopped successfully.")
		err = s.Uninstall()
		if err != nil {
			log.Println("Error uninstalling service:", err)
			return
		}
		log.Println("Service uninstalled successfully.")
	case "run":
		err := s.Run()
		if err != nil {
			log.Println("Error running service:", err)
		}
	default:
		log.Println("Invalid action. Use 'install', 'uninstall', or 'run'.")
	}
}

func main() {
	flag.Parse()
	if *version {
		log.Println("ccagent version：", query.GetAgnetVersion())
		return
	}
	if *action != "uninstall" {
		if *server == "" {
			log.Println("Server address is required. Use -server <address>, like -server http://ccops.corgi.plus")
			return
		} else {
			log.Println("服务端地址是：", *server)
		}
	}

	svcConfig := &service.Config{
		Name:        "ccagent",
		DisplayName: "CC Agent Service",
		Description: "Agent service of ccagent",
		Arguments:   []string{"-action", "run", "-server", *server},
		// 在系统层面设置自动启动
		Dependencies: []string{"Requires=network.target", "After=network-online.target"},
	}

	s, err := service.New(&program{}, svcConfig)
	if err != nil {
		log.Println("Error creating service:", err)
		return
	}

	runAction(s)
}
