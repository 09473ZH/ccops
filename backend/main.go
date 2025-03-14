package main

import (
	"ccops/core"
	"ccops/flags"
	"ccops/global"
	"ccops/models/monitor"
	"ccops/router"
	utils "ccops/utils"
	"fmt"
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
	// 初始化路由
	router := router.InitRouter()

	addr := global.Config.System.Addr()

	utils.PrintSystem()

	err1 := router.Run(addr)
	if err1 != nil {
		global.Log.Fatalf(err1.Error())
	}
}
