package core

import (
	"bytes"
	"ccops/global"
	"ccops/models"
	"errors"
	"fmt"
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"
)

// InitKeysConfiguration 初始化密钥配置：如果数据库中存在则使用已有密钥，否则生成新密钥对。
func InitKeysConfiguration() error {
	// 获取当前工作目录
	currentDir, err := os.Getwd()
	if err != nil {
		return errors.New("获取当前工作目录失败")
	}
	sshDir := filepath.Join(currentDir, ".ssh")

	// 确保.ssh目录存在并设置正确权限
	if _, err := os.Stat(sshDir); os.IsNotExist(err) {
		if err := os.Mkdir(sshDir, 0755); err != nil {
			return errors.New("创建.ssh目录失败")
		}
	} else {
		// 确保已存在目录的权限也是正确的
		if err := os.Chmod(sshDir, 0755); err != nil {
			return errors.New("修改.ssh目录权限失败")
		}
	}

	privateKeyPath := filepath.Join(sshDir, "ccops")
	publicKeyPath := filepath.Join(sshDir, "ccops.pub")

	// 检查数据库中是否已存在密钥对
	var privateKeyConfig models.Configuration
	var publicKeyConfig models.Configuration
	
	// 使用 Error 来检查记录是否存在
	hasPrivateKey := global.DB.Where("type = ? AND field_name = ?", 
		models.ConfigurationTypeKey, "PrivateKey").First(&privateKeyConfig).Error == nil
	hasPublicKey := global.DB.Where("type = ? AND field_name = ?", 
		models.ConfigurationTypeKey, "PublicKey").First(&publicKeyConfig).Error == nil

	// 如果数据库中已存在密钥对
	if hasPrivateKey && hasPublicKey {
		// 将数据库中的密钥写入文件
		if err := ioutil.WriteFile(privateKeyPath, []byte(privateKeyConfig.FieldValue), 0600); err != nil {
			return errors.New("写入私钥文件失败")
		}
		if err := ioutil.WriteFile(publicKeyPath, []byte(publicKeyConfig.FieldValue), 0644); err != nil {
			return errors.New("写入公钥文件失败")
		}
		
		fmt.Println("使用数据库中已存在的密钥对")
		return nil
	}

	// 如果数据库中不存在密钥对，则生成新的密钥对
	cmd := exec.Command("ssh-keygen", "-t", "ed25519", "-f", privateKeyPath, "-N", "", "-C", "ccops@cc.ops")
	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		fmt.Println(fmt.Sprint(err) + ": " + stderr.String())
		// 检查文件是否存在以确认密钥对生成
		if fileExists(privateKeyPath) && fileExists(publicKeyPath) {
			fmt.Println("密钥对已生成，忽略错误")
		} else {
			return errors.New("生成密钥对失败")
		}
	}

	// 设置密钥文件的权限
	if err := os.Chmod(privateKeyPath, 0600); err != nil {
		return errors.New("修改私钥文件权限失败")
	}
	if err := os.Chmod(publicKeyPath, 0644); err != nil {
		return errors.New("修改公钥文件权限失败")
	}

	// 读取生成的私钥和公钥
	privKey, err := ioutil.ReadFile(privateKeyPath)
	if err != nil {
		return errors.New("读取私钥文件失败")
	}

	pubKey, err := ioutil.ReadFile(publicKeyPath)
	if err != nil {
		return errors.New("读取公钥文件失败")
	}

	// 将密钥对存储到数据库中
	global.DB.Create(&models.Configuration{
		Type:             models.ConfigurationTypeKey,
		FieldName:        "PublicKey",
		FieldValue:       string(pubKey),
		FieldDescription: "公钥内容",
	})

	global.DB.Create(&models.Configuration{
		Type:             models.ConfigurationTypeKey,
		FieldName:        "PrivateKey",
		FieldValue:       string(privKey),
		FieldDescription: "私钥内容",
	})

	fmt.Println("成功生成新的密钥对并保存到数据库")
	return nil
}

// fileExists 检查给定路径的文件是否存在。
func fileExists(path string) bool {
	_, err := os.Stat(path)
	return !os.IsNotExist(err)
}
