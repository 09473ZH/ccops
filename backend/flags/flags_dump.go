package flags

import (
	"bytes"
	"ccops/global"
	"fmt"
	"github.com/sirupsen/logrus"
	"os/exec"
)

func Dump() {
	mysql := global.Config.Mysql

	sqlPath := fmt.Sprintf("ccops.sql")

	// 调用系统命令， 执行mysqldump进行数据库导出
	cmder := fmt.Sprintf("mysqldump -h%s -P%d -u%s -p%s %s > %s", mysql.Host, mysql.Port, mysql.User, mysql.Password, mysql.DB, sqlPath)
	cmd := exec.Command("sh", "-c", cmder)

	var out, stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr

	err := cmd.Run()

	if err != nil {
		logrus.Errorln(err.Error(), stderr.String())
		return
	}
	logrus.Infof("sql文件 %s 导出成功", sqlPath)
}
