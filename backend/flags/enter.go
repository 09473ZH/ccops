package flags

import (
	"flag"
)

type Option struct {
	DB   bool
	Dump bool   // 导出数据库
	Load string // 导入数据库文件
}

// Parse 解析命令行参数
func Parse() (option *Option) {
	option = new(Option)

	flag.BoolVar(&option.DB, "db", false, "初始化数据库") //只要执行-db 默认转为true
	flag.BoolVar(&option.Dump, "dump", false, "导出sql数据库")
	flag.StringVar(&option.Load, "load", "", "导入sql数据库")
	flag.Parse()
	return option
}

// Run 根据命令执行不同的函数
func (option Option) Run() bool {
	if option.DB {
		DB()
		return true
	}
	if option.Dump {
		Dump()
		return true
	}
	if option.Load != "" {
		Load(option.Load)
		return true
	}
	return false
}
