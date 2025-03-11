package update

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"syscall"
	"time"
)

func AddRootPublicKey(pubKey string) error {
	// 确保 /root/.ssh 目录存在
	sshDir := "/root/.ssh"
	if err := os.MkdirAll(sshDir, 0700); err != nil {
		return fmt.Errorf("创建 .ssh 目录失败：%s", err)
	}

	// 确保 authorized_keys 文件存在
	authKeysFile := sshDir + "/authorized_keys"
	if _, err := os.OpenFile(authKeysFile, os.O_CREATE, 0600); err != nil {
		return fmt.Errorf("创建 authorized_keys 文件失败：%s", err)
	}

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

// SelfUpgrade 从指定 URL 下载新版本的 agent 并替换当前运行的可执行文件
func SelfUpgrade(downloadURL string) error {
	// 获取当前可执行文件路径
	execPath, err := os.Executable()
	if err != nil {
		return fmt.Errorf("获取当前可执行文件路径失败: %w", err)
	}

	// 创建临时目录用于下载
	tempDir := filepath.Join(os.TempDir(), "agent_upgrade")
	if err := os.MkdirAll(tempDir, 0755); err != nil {
		return fmt.Errorf("创建临时目录失败: %w", err)
	}
	defer os.RemoveAll(tempDir) // 完成后清理临时目录

	// 临时文件路径
	tempFilePath := filepath.Join(tempDir, "agent.new")

	// 下载新版本
	resp, err := http.Get(downloadURL)
	if err != nil {
		return fmt.Errorf("下载新版本失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("下载失败，HTTP状态码: %d", resp.StatusCode)
	}

	// 创建临时文件
	tempFile, err := os.OpenFile(tempFilePath, os.O_CREATE|os.O_WRONLY, 0755)
	if err != nil {
		return fmt.Errorf("创建临时文件失败: %w", err)
	}

	// 写入下载的内容到临时文件
	_, err = io.Copy(tempFile, resp.Body)
	tempFile.Close()
	if err != nil {
		return fmt.Errorf("写入下载内容失败: %w", err)
	}

	// 确保临时文件有可执行权限
	if err := os.Chmod(tempFilePath, 0755); err != nil {
		return fmt.Errorf("设置可执行权限失败: %w", err)
	}

	// 验证下载的文件是否为有效的可执行文件
	if err := validateExecutable(tempFilePath); err != nil {
		return fmt.Errorf("验证下载的可执行文件失败: %w", err)
	}

	// 替换当前可执行文件
	// 由于正在运行的程序无法直接替换自身文件，我们需要创建一个替换脚本
	scriptContent := fmt.Sprintf(`#!/bin/sh
# 等待当前进程退出
sleep 1
# 替换可执行文件
cp "%s" "%s"
# 确保权限正确
chmod 755 "%s"
# 删除此脚本
rm -- "$0"
`, tempFilePath, execPath, execPath)

	// 创建替换脚本
	scriptPath := filepath.Join(tempDir, "replace.sh")
	if err := os.WriteFile(scriptPath, []byte(scriptContent), 0755); err != nil {
		return fmt.Errorf("创建替换脚本失败: %w", err)
	}

	// 在后台运行替换脚本
	cmd := exec.Command("/bin/sh", scriptPath)
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Setpgid: true,
	}
	if err := cmd.Start(); err != nil {
		return fmt.Errorf("启动替换脚本失败: %w", err)
	}

	// 打印日志并退出，让 systemd 重新启动服务
	fmt.Println("升级脚本已启动，程序即将退出以完成升级...")

	// 这里不需要等待脚本完成，因为我们即将退出
	// 退出前确保所有日志都已写入
	os.Stdout.Sync()
	os.Stderr.Sync()

	// 正常退出，systemd 会重新启动服务
	os.Exit(0)

	return nil // 这行代码永远不会执行，但需要保留以满足函数签名
}

// validateExecutable 验证文件是否为有效的可执行文件
func validateExecutable(filePath string) error {
	// 简单检查文件是否可执行
	cmd := exec.Command(filePath, "--version")
	var stderr bytes.Buffer
	cmd.Stderr = &stderr

	// 设置超时，防止命令长时间运行
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cmd = exec.CommandContext(ctx, filePath, "--version")
	err := cmd.Run()

	// 如果命令执行成功或者是因为找不到参数而失败，都认为是有效的可执行文件
	// 大多数可执行文件在接收到未知参数时会返回错误，但这表明文件可以执行
	if err == nil || stderr.Len() > 0 {
		return nil
	}

	return fmt.Errorf("文件不是有效的可执行文件: %w", err)
}
