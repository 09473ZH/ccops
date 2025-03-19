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
const DemoConfigFile = "config/conf_yaml/settings-demo.yaml"

// InitConf 读取yaml文件的配置
func InitConf() {
	applyFile := DevConfigFile
	env := os.Getenv("CCOPSENV")

	if env == "production" {
		applyFile = ProdConfigFile
		log.Println("Running in production environment")
	} else if env == "demo" {
		applyFile = DemoConfigFile
		log.Println("Running in demo environment")
	} else if env == "dev" {
		applyFile = DevConfigFile
		log.Println("Running in development environment")
	} else {
		applyFile = LocalConfigFile
		if _, err := os.Stat(LocalConfigFile); err != nil {
			log.Panic("Local configuration file not found")
		}
		log.Println("Running in local environment")
	}
	c := &config.Config{}
	yamlConf, err := ioutil.ReadFile(applyFile)
	if err != nil {
		panic(fmt.Errorf("failed to read configuration file: %s", err))
	}
	err = yaml.Unmarshal(yamlConf, c)
	if err != nil {
		log.Fatalf("failed to parse configuration file: %v", err)
	}

	log.Println("Configuration initialized successfully")
	global.Config = c
}
