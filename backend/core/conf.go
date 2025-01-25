package core

import (
	"ccops/config"
	"ccops/global"
	"fmt"
	"os"

	"gopkg.in/yaml.v2"

	"io/ioutil"
	"log"
)

const LocalConfigFile = "config/conf_yaml/settings-local.yaml"
const DevConfigFile = "config/conf_yaml/settings-dev.yaml"
const ProdConfigFile = "config/conf_yaml/settings-prod.yaml"

// InitConf 读取yaml文件的配置
func InitConf() {
	applyFile := DevConfigFile

	if os.Getenv("CCOPSENV") == "production" {
		applyFile = ProdConfigFile
		log.Println("Be in production environment")
	} else if os.Getenv("CCOPSENV") == "dev" {
		applyFile = DevConfigFile
		log.Println("Be in dev environment")
	} else {
		applyFile = LocalConfigFile
		if _, err := os.Stat(LocalConfigFile); err != nil {
			log.Panic("Local config file not found, please check the file")
		}
		log.Println("Be in local environment")
	}
	c := &config.Config{}
	yamlConf, err := ioutil.ReadFile(applyFile) //yaml格式的数据存进去了，是个byte字节切片1
	if err != nil {
		panic(fmt.Errorf("get yamlConf error: %s", err))
	}
	err = yaml.Unmarshal(yamlConf, c) //从yaml格式数据转成正常数据
	if err != nil {
		log.Fatalf("config Init Unmarshal: %v", err)
	}

	log.Println("config yamlFile load Init success.")
	global.Config = c
}
