package query

type QueryResponse []map[string]string

type HostDetailInfo struct {
	AgentVersion          string            `json:"agent_version"`
	UUID                  string            `json:"uuid"`
	SystemInfo            map[string]string `json:"system_info"`
	Uptime                map[string]string `json:"uptime"`
	DiskInfo              map[string]string `json:"disk_info"`
	OsInfo                map[string]string `json:"os_info"`
	SoftwareInfo          QueryResponse     `json:"software_info"`
	UserInfo              QueryResponse     `json:"user_info"`
	UserAuthorizeKeysInfo QueryResponse     `json:"user_authorize_keys_info"`
	HostName              string            `json:"hostname"`
	IP                    string            `json:"ip"`
	PublicIPInfo          map[string]string `json:"public_ip_info"`
}

var Version = "0.0.1-alpha4"

func GetAgentVersion() string {
	return Version
}