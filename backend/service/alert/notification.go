package alert

import (
	"bytes"
	"ccops/models/alert"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"time"

	"gorm.io/gorm"

	"ccops/global"
	"ccops/models"
)

// NotificationType 通知类型
type NotificationType int

const (
	NotificationTypeAlert   NotificationType = 1 // 告警通知
	NotificationTypeRecover NotificationType = 2 // 恢复通知
)

func WebhookNotification(alertId uint, hostId uint, value float64, notifyType NotificationType, notifyTime time.Time) error {
	var (
		rule   alert.AlertRule
		notify alert.Notification
		host   models.HostModel
	)

	log.Printf("开始处理告警通知: alertId=%d, hostId=%d, value=%.2f, notifyType=%d",
		alertId, hostId, value, notifyType)

	type notifyBody struct {
		MsgType string `json:"msgtype"`
		Text    struct {
			Content string `json:"content"`
		} `json:"text"`
	}

	// 使用事务处理所有数据库查询
	err := global.DB.Transaction(func(tx *gorm.DB) error {
		// 查询告警规则
		if err := tx.Model(&alert.AlertRule{}).
			Where("id = ?", alertId).
			First(&rule).Error; err != nil {
			log.Printf("获取告警规则失败: %v", err)
			return fmt.Errorf("获取告警规则失败: %w", err)
		}
		log.Printf("获取到告警规则: id=%d, name=%s, notificationId=%d",
			rule.ID, rule.Name, rule.NotificationId)

		// 查询通知配置
		if err := tx.Model(&alert.Notification{}).
			Where("id = ? AND enabled = ?", rule.NotificationId, true).
			First(&notify).Error; err != nil {
			log.Printf("获取通知配置失败: %v", err)
			return fmt.Errorf("获取通知配置失败或通知未启用: %w", err)
		}
		log.Printf("获取到通知配置: id=%d, webhook=%s", notify.ID, notify.WebhookUrl)

		// 查询主机信息
		if err := tx.Model(&models.HostModel{}).
			Where("id = ?", hostId).
			First(&host).Error; err != nil {
			log.Printf("获取主机信息失败: %v", err)
			return fmt.Errorf("获取主机信息失败: %w", err)
		}
		log.Printf("获取到主机信息: id=%d, name=%s, ip=%s",
			host.ID, host.Name, host.HostServerUrl)

		return nil
	})

	if err != nil {
		return err
	}

	// 格式化时间为易读格式
	timeStr := notifyTime.Format("2006-01-02 15:04:05")

	// 根据通知类型构建不同的通知内容
	var info string
	// 构建告警等级标识
	var prioritySymbol string
	switch rule.Priority {
	case "P0":
		prioritySymbol = "🔴"
	case "P1":
		prioritySymbol = "⚠️"
	case "P2":
		prioritySymbol = "ℹ️"
	default:
		prioritySymbol = "❗"
	}

	// 基础信息模板
	baseInfo := fmt.Sprintf("━━━━━━━━━━ CCOPS监控通知 ━━━━━━━━━━\n"+
		"📅 触发时间：%s\n"+
		"🏷️ 告警ID：#%d\n"+
		"🔔 告警级别：%s %s\n"+
		"\n📌 监控对象信息\n"+
		"   主机名称：%s\n"+
		"   IP地址：%s\n"+
		"\n📊 告警规则详情\n"+
		"   规则名称：%s\n"+
		"   监控类型：%s\n"+
		"   触发条件：%s %.2f\n",
		timeStr,
		alertId,
		rule.Priority,
		prioritySymbol,
		host.Name,
		host.HostServerUrl,
		rule.Name,
		rule.Type,
		rule.Operator,
		rule.Threshold)

	switch notifyType {
	case NotificationTypeAlert:
		info = fmt.Sprintf("%s"+
			"   当前数值：%.2f\n"+
			"\n📝 告警说明\n"+
			"   %s\n"+
			"━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
			baseInfo,
			value,
			notify.Message)
	case NotificationTypeRecover:
		info = fmt.Sprintf("%s"+
			"   恢复数值：%.2f\n"+
			"\n📝 恢复说明\n"+
			"   %s\n"+
			"   告警已恢复正常，请知悉！\n"+
			"━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
			baseInfo,
			value,
			notify.Message)
	default:
		return fmt.Errorf("不支持的通知类型: %d", notifyType)
	}

	body := notifyBody{
		MsgType: "text",
		Text: struct {
			Content string `json:"content"`
		}{
			Content: info,
		},
	}

	jsonData, err := json.Marshal(body)
	if err != nil {
		return fmt.Errorf("marshal notify body failed: %w", err)
	}

	// 在发送请求前打印请求信息
	log.Printf("准备发送通知请求到: %s", notify.WebhookUrl)
	log.Printf("请求内容: %s", string(jsonData))

	// 发送请求
	resp, err := http.Post(notify.WebhookUrl, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		log.Printf("发送通知请求失败: %v", err)
		return fmt.Errorf("send webhook notification failed: %w", err)
	}
	defer resp.Body.Close()

	// 读取并记录响应内容
	respBody, _ := ioutil.ReadAll(resp.Body)
	log.Printf("收到响应: status=%s, body=%s", resp.Status, string(respBody))

	if resp.StatusCode != http.StatusOK {
		log.Printf("通知请求返回非成功状态码: %s", resp.Status)
		return fmt.Errorf("notify non-OK response: %s, body: %s", resp.Status, string(respBody))
	}

	var notifyTypeStr string
	if notifyType == NotificationTypeAlert {
		notifyTypeStr = "alert notification"
	} else {
		notifyTypeStr = "recovery notification"
	}
	log.Printf("Successfully sent %s to server.", notifyTypeStr)
	return nil
}
