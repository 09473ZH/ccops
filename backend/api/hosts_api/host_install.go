package hosts_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func (HostsApi) HostInstall(c *gin.Context) {
	var serverUrl string
	global.DB.Model(&models.Configuration{}).Where("field_name = ?", "ServerUrl").Select("field_value").Scan(&serverUrl)
	if serverUrl == "" {
		res.FailWithMessage("需要在系统配置中填入服务端地址", c)
		return
	}

	data := fmt.Sprintf(`#!/bin/bash

set -e

if [ -f /etc/debian_version ]; then
    export DEBIAN_FRONTEND=noninteractive 
    curl -L -o /tmp/osquery.deb http://cdn.corgi.plus/ccops/osquery_5.13.1-1.linux_amd64.deb 
    dpkg -i /tmp/osquery.deb 
elif [ -f /etc/redhat-release ]; then
    curl -L -o /tmp/osquery.rpm http://cdn.corgi.plus/ccops/osquery-5.13.1-1.linux.x86_64.rpm
    yum install -y /tmp/osquery.rpm
else
    echo "不支持的操作系统"
    exit 1
fi

curl -o /tmp/ccagent.tgz http://cdn.corgi.plus/ccops/ccagent.tgz 
tar zxvf /tmp/ccagent.tgz -C /usr/local/bin 
/usr/local/bin/ccagent -action install -server %s`, serverUrl)

	c.String(http.StatusOK, data)
}
