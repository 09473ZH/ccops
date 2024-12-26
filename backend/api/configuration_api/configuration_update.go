package configuration_api

import (
	"bytes"
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"encoding/json"
	"fmt"
	"github.com/gin-gonic/gin"
	"io/ioutil"
	"net/http"
)

type ConfigurationUpdateReq struct {
	BaseUrlValue    string `json:"baseUrlValue"`
	ApiKeyValue     string `json:"apiKeyValue"`
	ModelNameValue  string `json:"modelNameValue"`
	ServerUrlValue  string `json:"serverUrlValue"`
	PublicKeyValue  string `json:"publicKeyValue"`
	PrivateKeyValue string `json:"privateKeyValue"`
}

func (ConfigurationApi) ConfigurationUpdateView(c *gin.Context) {
	var cr ConfigurationUpdateReq
	if err := c.ShouldBindJSON(&cr); err != nil {
		res.FailWithMessage("参数错误", c)
		return
	}

	// 开始事务
	tx := global.DB.Begin()
	if tx.Error != nil {
		res.FailWithMessage("事务开始失败", c)
		return
	}

	// BaseUrl更新
	var baseUrlConfig models.Configuration
	if err := tx.Where("field_name = ?", "BaseUrl").First(&baseUrlConfig).Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("获取当前BaseUrl配置失败: "+err.Error(), c)
		return
	}
	if baseUrlConfig.FieldValue != cr.BaseUrlValue {
		if err := tx.Model(&models.Configuration{}).Where("field_name = ?", "BaseUrl").Updates(models.Configuration{
			FieldValue: cr.BaseUrlValue,
			IsChanged:  true,
		}).Error; err != nil {
			tx.Rollback()
			res.FailWithMessage("更新 BaseUrl 失败: "+err.Error(), c)
			return
		}
	}

	// ApiKey更新
	var apiKeyConfig models.Configuration
	if err := tx.Where("field_name = ?", "ApiKey").First(&apiKeyConfig).Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("获取当前ApiKey配置失败: "+err.Error(), c)
		return
	}
	if apiKeyConfig.FieldValue != cr.ApiKeyValue {
		if err := tx.Model(&models.Configuration{}).Where("field_name = ?", "ApiKey").Updates(models.Configuration{
			FieldValue: cr.ApiKeyValue,
			IsChanged:  true,
		}).Error; err != nil {
			tx.Rollback()
			res.FailWithMessage("更新 ApiKey 失败: "+err.Error(), c)
			return
		}
	}

	// ModelName更新
	var modelNameConfig models.Configuration
	if err := tx.Where("field_name = ?", "ModelName").First(&modelNameConfig).Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("获取当前ModelName配置失败: "+err.Error(), c)
		return
	}
	if modelNameConfig.FieldValue != cr.ModelNameValue {
		if err := tx.Model(&models.Configuration{}).Where("field_name = ?", "ModelName").Updates(models.Configuration{
			FieldValue: cr.ModelNameValue,
			IsChanged:  true,
		}).Error; err != nil {
			tx.Rollback()
			res.FailWithMessage("更新 ModelName 失败: "+err.Error(), c)
			return
		}
	}

	// ServerUrl更新
	var serverUrlConfig models.Configuration
	if err := tx.Where("field_name = ?", "ServerUrl").First(&serverUrlConfig).Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("获取当前ServerUrl配置失败: "+err.Error(), c)
		return
	}
	if serverUrlConfig.FieldValue != cr.ServerUrlValue {
		if err := tx.Model(&models.Configuration{}).Where("field_name = ?", "ServerUrl").Updates(models.Configuration{
			FieldValue: cr.ServerUrlValue,
			IsChanged:  true,
		}).Error; err != nil {
			tx.Rollback()
			res.FailWithMessage("更新 ServerUrl 失败: "+err.Error(), c)
			return
		}
	}

	// PublicKey更新
	var publicKeyConfig models.Configuration
	if err := tx.Where("field_name = ?", "PublicKey").First(&publicKeyConfig).Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("获取当前PublicKey配置失败: "+err.Error(), c)
		return
	}
	if publicKeyConfig.FieldValue != cr.PublicKeyValue {
		if err := tx.Model(&models.Configuration{}).Where("field_name = ?", "PublicKey").Updates(models.Configuration{
			FieldValue: cr.PublicKeyValue,
			IsChanged:  true,
		}).Error; err != nil {
			tx.Rollback()
			res.FailWithMessage("更新 PublicKey 失败: "+err.Error(), c)
			return
		}

		// 获取所有客户端并更新公钥
		var hostList []string
		if err := tx.Model(&models.HostModel{}).Select("host_server_url").Find(&hostList).Error; err != nil {
			tx.Rollback()
			res.FailWithMessage("获取 hostList 失败: "+err.Error(), c)
			return
		}

		// 遍历每个客户端，发送公钥更新请求
		type publicKeyResponse struct {
			PublicKey string `json:"public_key"`
		}
		for _, host := range hostList {
			var publicKeyRep publicKeyResponse
			publicKeyRep.PublicKey = cr.PublicKeyValue
			url := fmt.Sprintf("http://%s:41541/api/update_public_key", host)
			requestBody, err := json.Marshal(publicKeyRep)
			if err != nil {
				tx.Rollback()
				res.FailWithMessage("marshal 公钥失败: "+err.Error(), c)
				return
			}

			// 发送 POST 请求
			resp, err := http.Post(url, "application/json", bytes.NewBuffer(requestBody))
			if err != nil {
				tx.Rollback()
				res.FailWithMessage("请求客户端失败: "+err.Error(), c)
				return
			}
			defer resp.Body.Close()

			// 检查响应状态
			if resp.StatusCode != http.StatusOK {
				tx.Rollback()
				res.FailWithMessage(fmt.Sprint("agent端更新失败"), c)
				return
			}

			// 读取响应体
			body, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				tx.Rollback()
				res.FailWithMessage("读取客户端响应失败: "+err.Error(), c)
				return
			}

			// 解析响应
			var responseBody map[string]interface{}
			if err := json.Unmarshal(body, &responseBody); err != nil {
				tx.Rollback()
				res.FailWithMessage("解析响应失败: "+err.Error(), c)
				return
			}

			// 验证响应
			if msg, ok := responseBody["message"].(string); ok {
				if msg != "success" {
					tx.Rollback()
					res.FailWithMessage("密钥更新失败: "+msg, c)
					return
				}
			} else {
				tx.Rollback()
				res.FailWithMessage("客户端响应格式不正确", c)
				return
			}
		}
	}

	// PrivateKey更新
	var privateKeyConfig models.Configuration
	if err := tx.Where("field_name = ?", "PrivateKey").First(&privateKeyConfig).Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("获取当前PrivateKey配置失败: "+err.Error(), c)
		return
	}
	if privateKeyConfig.FieldValue != cr.PrivateKeyValue {
		// 更新数据库中的私钥
		if err := tx.Model(&models.Configuration{}).Where("field_name = ?", "PrivateKey").Updates(models.Configuration{
			FieldValue: cr.PrivateKeyValue,
			IsChanged:  true,
		}).Error; err != nil {
			tx.Rollback()
			res.FailWithMessage("更新 PrivateKey 失败: "+err.Error(), c)
			return
		}

		// 更新 ./ssh/ccops 文件内容
		if err := ioutil.WriteFile("./.ssh/ccops", []byte(cr.PrivateKeyValue), 0600); err != nil {
			tx.Rollback()
			res.FailWithMessage("更新私钥文件失败: "+err.Error(), c)
			return
		}
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("提交事务失败: "+err.Error(), c)
		return
	}

	res.OkWithMessage("更新成功", c)
}
