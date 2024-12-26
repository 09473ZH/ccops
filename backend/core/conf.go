package core

import (
	"ccops/config"
	"ccops/global"
	"fmt"
	"gopkg.in/yaml.v2"
	"os"

	"io/ioutil"
	"log"
)

const ConfigFile = "config/conf_yaml/settings.yaml"
const DevConfigFile = "config/conf_yaml/settings-dev.yaml"
const ProdConfigFile = "config/conf_yaml/settings-prod.yaml"

// InitConf 读取yaml文件的配置
func InitConf() {
	applyFile := ConfigFile
	//fmt.Println(applyFile)

	if os.Getenv("CCOPSENV") == "production" {
		applyFile = ProdConfigFile
		log.Println("Be in production environment")
	} else if os.Getenv("CCOPSENV") == "dev" {
		applyFile = DevConfigFile
		log.Println("Be in dev environment")
	} else {
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
