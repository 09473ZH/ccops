package configuration_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"ccops/utils/jwts"
	"ccops/utils/permission"
	"encoding/json"
	"io/ioutil"

	"github.com/gin-gonic/gin"
)

type ConfigurationUpdateReq struct {
	BaseUrlValue    *string `json:"baseUrlValue"`
	ApiKeyValue     *string `json:"apiKeyValue"`
	ModelNameValue  *string `json:"modelNameValue"`
	ServerUrlValue  *string `json:"serverUrlValue"`
	PublicKeyValue  *string `json:"publicKeyValue"`
	PrivateKeyValue *string `json:"privateKeyValue"`
}

func (ConfigurationApi) ConfigurationUpdateView(c *gin.Context) {
	_claims, _ := c.Get("claims")
	claims := _claims.(*jwts.CustomClaims)
	if !permission.IsAdmin(claims.UserID) {
		res.FailWithMessage("权限错误", c)
		return
	}

	// 读取请求体
	body, err := c.GetRawData()
	if err != nil {
		res.FailWithMessage("读取请求体失败", c)
		return
	}

	// 先解析到map，用于检查字段是否存在
	var requestData map[string]interface{}
	if err := json.Unmarshal(body, &requestData); err != nil {
		res.FailWithMessage("参数错误", c)
		return
	}

	// 再解析到结构体，用于获取具体值
	var cr ConfigurationUpdateReq
	if err := json.Unmarshal(body, &cr); err != nil {
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
	if _, exists := requestData["baseUrlValue"]; exists {
		if err := tx.Model(&models.Configuration{}).Where("field_name = ?", "BaseUrl").Updates(map[string]interface{}{
			"field_value": *cr.BaseUrlValue,
			"is_changed":  true,
		}).Error; err != nil {
			tx.Rollback()
			res.FailWithMessage("更新 BaseUrl 失败: "+err.Error(), c)
			return
		}
	}

	// ApiKey更新
	if _, exists := requestData["apiKeyValue"]; exists {
		if err := tx.Model(&models.Configuration{}).Where("field_name = ?", "ApiKey").Updates(map[string]interface{}{
			"field_value": *cr.ApiKeyValue,
			"is_changed":  true,
		}).Error; err != nil {
			tx.Rollback()
			res.FailWithMessage("更新 ApiKey 失败: "+err.Error(), c)
			return
		}
	}

	// ModelName更新
	if _, exists := requestData["modelNameValue"]; exists {
		if err := tx.Model(&models.Configuration{}).Where("field_name = ?", "ModelName").Updates(map[string]interface{}{
			"field_value": *cr.ModelNameValue,
			"is_changed":  true,
		}).Error; err != nil {
			tx.Rollback()
			res.FailWithMessage("更新 ModelName 失败: "+err.Error(), c)
			return
		}
	}

	// ServerUrl更新
	if _, exists := requestData["serverUrlValue"]; exists {
		if err := tx.Model(&models.Configuration{}).Where("field_name = ?", "ServerUrl").Updates(map[string]interface{}{
			"field_value": *cr.ServerUrlValue,
			"is_changed":  true,
		}).Error; err != nil {
			tx.Rollback()
			res.FailWithMessage("更新 ServerUrl 失败: "+err.Error(), c)
			return
		}
	}

	// PublicKey更新
	if _, exists := requestData["publicKeyValue"]; exists {
		if err := tx.Model(&models.Configuration{}).Where("field_name = ?", "PublicKey").Updates(map[string]interface{}{
			"field_value": *cr.PublicKeyValue,
			"is_changed":  true,
		}).Error; err != nil {
			tx.Rollback()
			res.FailWithMessage("更新 PublicKey 失败: "+err.Error(), c)
			return
		}
	}

	// PrivateKey更新
	if _, exists := requestData["privateKeyValue"]; exists {
		if err := tx.Model(&models.Configuration{}).Where("field_name = ?", "PrivateKey").Updates(map[string]interface{}{
			"field_value": *cr.PrivateKeyValue,
			"is_changed":  true,
		}).Error; err != nil {
			tx.Rollback()
			res.FailWithMessage("更新 PrivateKey 失败: "+err.Error(), c)
			return
		}

		// 更新 ./ssh/ccops 文件内容
		if err := ioutil.WriteFile("./.ssh/ccops", []byte(*cr.PrivateKeyValue), 0600); err != nil {
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
