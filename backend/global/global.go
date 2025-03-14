package global

import (
	"ccops/config"
	"ccops/models/monitor"

	"github.com/cc14514/go-geoip2"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var (
	Config       *config.Config
	Log          *logrus.Logger
	DB           *gorm.DB
	AddrDB       *geoip2.DBReader
	MysqlLog     logger.Interface
	TimeSeriesDB *monitor.TimeSeriesDB
)
