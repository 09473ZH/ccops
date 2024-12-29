package update

import (
	"bytes"
	"fmt"
	"os/exec"
)

func AddRootPublicKey(pubKey string) error {
	// 检查公钥是否已经存在
	checkCmd := fmt.Sprintf("grep -q '%s' /root/.ssh/authorized_keys", pubKey)
	checkErr := exec.Command("sh", "-c", checkCmd).Run()
	if checkErr == nil {
		// 公钥已存在
		return nil
	}

	// 如果公钥不存在，先删除含有 @cc.ops 后缀的旧公钥
	cleanCmd := exec.Command("sh", "-c", "sed -i '/@cc.ops$/d' /root/.ssh/authorized_keys")
	var cleanStderr bytes.Buffer
	cleanCmd.Stderr = &cleanStderr
	if err := cleanCmd.Run(); err != nil {
		return fmt.Errorf("清理旧公钥失败：%s, 错误信息：%s", err.Error(), cleanStderr.String())
	}

	// 写入新公钥
	var stderr bytes.Buffer
	writeCmd := exec.Command("sh", "-c", fmt.Sprintf("echo '%s' >> /root/.ssh/authorized_keys", pubKey))
	writeCmd.Stderr = &stderr

	err := writeCmd.Run()
	if err != nil {
		return fmt.Errorf("写入公钥失败：%s, 错误信息：%s", err.Error(), stderr.String())
	}
	return nil
}

func RenameHost(newName string) error {
	var stderr bytes.Buffer
	cmd := exec.Command("sudo", "hostnamectl", "set-hostname", newName)
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		return fmt.Errorf("设置主机名失败：%s, 错误信息：%s", err.Error(), stderr.String())
	}
	return nil
}
