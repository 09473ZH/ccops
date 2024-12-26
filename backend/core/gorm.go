package core

import (
	"ccops/global"
	"fmt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"os"
	"time"
)

func InitGorm() *gorm.DB {
	if global.Config.Mysql.Host == "" {
		global.Log.Warnln("未配置mysql，取消gorm连接")
		return nil
	}

	var dsn string
	dsn = os.Getenv("dsn")
	if dsn == "" {
		// 本地
		dsn = global.Config.Mysql.Dsn()
	}

	var mysqlLogger logger.Interface
	if global.Config.System.Env == "debug" {
		// 开发环境显示所有的sql
		mysqlLogger = logger.Default.LogMode(logger.Info)
	} else {
		mysqlLogger = logger.Default.LogMode(logger.Error) // 只打印错误的sql
	}
	global.MysqlLog = logger.Default.LogMode(logger.Error)

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: mysqlLogger,
	})

	if err != nil {
		global.Log.Fatalf(fmt.Sprintf("[%s] mysql连接失败", dsn))
	}
	sqlDB, _ := db.DB()
	sqlDB.SetMaxIdleConns(10)               // 最大空闲连接数
	sqlDB.SetMaxOpenConns(100)              // 最多可容纳
	sqlDB.SetConnMaxLifetime(time.Hour * 4) // 连接最大复用时间，不能超过mysql的wait_timeout
	return db
}
