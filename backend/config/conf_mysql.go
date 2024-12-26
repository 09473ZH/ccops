package config

import "strconv"

type Mysql struct {
	Host     string `yaml:"host"`
	Port     int    `yaml:"port"`
	Config   string `yaml:"config"` // 高级配置，例如 charset
	DB       string `yaml:"db"`
	User     string `yaml:"user"`
	Password string `yaml:"password"`
	LogLevel string `yaml:"log_level"` // 日志等级，debug就是输出全部sql，dev(开发环境), release(测试/即将发布环境)
}

func (m Mysql) Dsn() string { //                                 整数转字符串

	return m.User + ":" + m.Password + "@tcp(" + m.Host + ":" + strconv.Itoa(m.Port) + ")/" + m.DB + "?" + m.Config

}
