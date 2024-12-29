package hosts_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"fmt"
	"github.com/gin-gonic/gin"
)

type HostTypeQuery struct {
	OsFamily string `form:"osFamily"` //debian/redhat

}

func (HostsApi) HostInstall(c *gin.Context) {
	var cr HostTypeQuery
	err := c.ShouldBindQuery(&cr)
	if err != nil {
		res.FailWithMessage(err.Error(), c)
		return
	}
	var serverUrl string
	var data string
	global.DB.Model(&models.Configuration{}).Where("field_name = ?", "ServerUrl").Select("field_value").Scan(&serverUrl)
	if serverUrl == "" {
		res.FailWithMessage("需要在系统配置中填入服务端地址", c)
		return
	}
	if cr.OsFamily == "debian" {
		data = fmt.Sprintf("export DEBIAN_FRONTEND=noninteractive && curl -L -o /tmp/osquery.deb http://cdn.corgi.plus/ccops/osquery_5.13.1-1.linux_amd64.deb && dpkg -i /tmp/osquery.deb && curl -o /tmp/ccagent.tgz http://cdn.corgi.plus/ccops/ccagent.tgz && tar zxvf /tmp/ccagent.tgz -C /usr/local/bin && /usr/local/bin/ccagent -action install -server %s", serverUrl)
	} else if cr.OsFamily == "redhat" {
		data = fmt.Sprintf("curl -L -o /tmp/osquery.rpm http://cdn.corgi.plus/ccops/osquery-5.13.1-1.linux.x86_64.rpm && sudo yum install /tmp/osquery.rpm && curl -o /tmp/ccagent.tgz http://cdn.corgi.plus/ccops/ccagent.tgz && tar zxvf /tmp/ccagent.tgz -C /usr/local/bin && /usr/local/bin/ccagent -action install -server %s", serverUrl)
	} else {
		res.FailWithMessage("osFamily 未知参数值", c)
		return
	}
	res.OkWithData(data, c)

}
