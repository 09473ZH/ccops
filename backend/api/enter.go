package api

import (
	"ccops/api/alert_api"
	"ccops/api/auth_api"
	"ccops/api/client_api"
	"ccops/api/configuration_api"
	"ccops/api/file_api"
	"ccops/api/hosts_api"
	"ccops/api/labels_api"
	"ccops/api/notification_api"
	"ccops/api/role_api"
	"ccops/api/role_revision_api"
	"ccops/api/task_api"
	"ccops/api/user_api"
)

type ApiGroup struct {
	AuthApi          auth_api.AuthApi
	UserApi          user_api.UserApi
	FileApi          file_api.FileApi
	HostsApi         hosts_api.HostsApi
	ClientApi        client_api.ClientApi
	RoleApi          role_api.RoleApi
	RoleRevisionApi  role_revision_api.RoleRevisionApi
	TaskApi          task_api.TaskApi
	ConfigurationApi configuration_api.ConfigurationApi
	LabelApi         labels_api.LabelApi
	AlertApi         alert_api.AlertApi
	Notification     notification_api.NotificationApi
}

var ApiGroupApp = new(ApiGroup)
