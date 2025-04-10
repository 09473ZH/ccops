package alert

import (
	"bytes"
	"ccops/models/alert"
	"encoding/json"
	"fmt"
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
	type notifyBody struct {
		MsgType string `json:"msgtype"`
		Text    struct {
			Content string `json:"content"`
		} `json:"text"`
	}

	// 使用事务处理所有数据库查询
	err := global.DB.Transaction(func(tx *gorm.DB) error {

		if err := tx.Model(&alert.AlertRule{}).
			Where("id = ?", alertId).
			First(&rule).Error; err != nil {
			return fmt.Errorf("获取告警规则失败: %w", err)
		}

		if err := tx.Model(&alert.Notification{}).
			Where("id = ?", rule.NotificationId).
			First(&notify).Error; err != nil {
			return fmt.Errorf("获取通知配置失败: %w", err)
		}

		if err := tx.Model(&models.HostModel{}).
			Where("id = ?", hostId).
			First(&host).Error; err != nil {
			return fmt.Errorf("获取主机信息失败: %w", err)
		}

		return nil
	})

	if err != nil {
		return err
	}

	// 格式化时间为易读格式
	timeStr := notifyTime.Format("2006-01-02 15:04:05")

	// 根据通知类型构建不同的通知内容
	var info string
	switch notifyType {
	case NotificationTypeAlert:
		info = fmt.Sprintf("【ccops告警通知】:\n时间:%s\n主机名:%s\nIP:%s\n告警规则:%s-%s%s%.2f\n告警值:%.2f\n告警等级:%s\n%s",
			timeStr, host.Name, host.HostServerUrl, rule.Name, rule.Type, rule.Operator, rule.Threshold,
			value, rule.Priority, notify.Message)
	case NotificationTypeRecover:
		info = fmt.Sprintf("【ccops告警恢复通知】:\n时间:%s\n主机名:%s\nIP:%s\n告警规则:%s-%s%s%.2f\n恢复值:%.2f\n告警等级:%s\n%s",
			timeStr, host.Name, host.HostServerUrl, rule.Name, rule.Type, rule.Operator, rule.Threshold,
			value, rule.Priority, notify.Message)
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

	resp, err := http.Post(notify.WebhookUrl, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("send webhook notification failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("notify non-OK response: %s", resp.Status)
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
