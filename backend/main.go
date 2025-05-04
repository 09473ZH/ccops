package main

import (
	"ccops/core"
	"ccops/flags"
	"ccops/global"
	"ccops/models/monitor"
	"ccops/router"
	"ccops/service/alert"
	utils "ccops/utils"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {

	//测试同步
	// 读取配置文件
	core.InitConf()
	// 初始化日志
	global.Log = core.InitLogger()
	// 连接数据库
	global.DB = core.InitGorm()

	// 命令行参数绑定
	option := flags.Parse()
	if option.Run() {
		return
	}
	err := core.InitAll()
	if err != nil {
		fmt.Println(err)
	}
	// 添加 TimeSeriesDB 实例
	global.TimeSeriesDB = monitor.NewTimeSeriesDB()

	// 启动告警定时任务
	alert.StartCronTasks()

	// 初始化路由
	router := router.InitRouter()

	addr := global.Config.System.Addr()

	utils.PrintSystem()

	// 设置信号处理
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		sig := <-sigChan
		global.Log.Infof("收到信号: %v, 开始执行清理操作...", sig)

		// 执行清理操作
		if global.DB != nil {
			db, err := global.DB.DB()
			if err == nil {
				db.Close()
				global.Log.Info("数据库连接已关闭")
			}
		}

		// 等待一段时间确保其他goroutine完成
		time.Sleep(time.Second)

		global.Log.Info("清理完成，程序退出")
		os.Exit(0)
	}()

	// 启动HTTP服务
	err1 := router.Run(addr)
	if err1 != nil {
		global.Log.Fatalf("服务启动失败: %v", err1)
	}
}
