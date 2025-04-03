package query

import (
	"bytes"
	"errors"
	"fmt"
	"log"
	"os/exec"
	"runtime"

	"github.com/goccy/go-json"
)

type QueryResponse []map[string]string
type HostDetailInfo struct {
	AgentVersion          string            `json:"agent_version"`
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

func RunQuery(sql string) (QueryResponse, error) {
	args := []string{
		"--json", sql,
	}
	cmd := exec.Command("osqueryi", args...)
	var (
		osquerydStdout bytes.Buffer
		osquerydStderr bytes.Buffer
	)
	cmd.Stdout = &osquerydStdout
	cmd.Stderr = &osquerydStderr
	var info []map[string]string
	if err := cmd.Run(); err != nil {
		return nil, err
	}
	if len(info) == 0 {
		if err := json.Unmarshal(osquerydStdout.Bytes(), &info); err != nil {
			return nil, err
		}
	}
	return info, nil
}

// QuerySystemInfo 查询系统信息 system_info 表
//
//	{
//		"board_model": "",
//		"board_serial": "",
//		"board_vendor": "",
//		"board_version": "",
//		"computer_name": "Mac mini",
//		"cpu_brand": "Apple M2 Pro",
//		"cpu_logical_cores": "10",
//		"cpu_microcode": "",
//		"cpu_physical_cores": "10",
//		"cpu_sockets": "",
//		"cpu_subtype": "ARM64E",
//		"cpu_type": "arm64e",
//		"hardware_model": "Mac14,12",
//		"hardware_serial": "X9QCQ2QW3M",
//		"hardware_vendor": "Apple Inc.",
//		"hardware_version": "",
//		"hostname": "mac-mini.local",
//		"local_hostname": "Mac-mini",
//		"physical_memory": "34359738368",
//		"uuid": "423EDCBF-FBD6-544F-A918-DDC8616C1F46"
//	}
func QuerySystemInfo() (map[string]string, error) {
	info, err := RunQuery("select * from system_info limit 1;")
	if err != nil {
		return nil, err
	}
	if len(info) == 0 {
		return nil, errors.New("没有查询到系统信息")
	}

	return info[0], nil
}

func QueryUptime() (map[string]string, error) {
	info, err := RunQuery("select * from uptime limit 1;")
	if err != nil {
		return nil, err
	}
	return info[0], nil
}

func QueryDiskSpaceUnix() (map[string]string, error) {
	info, err := RunQuery(`
	SELECT (blocks_available * 100 / blocks) AS percent_disk_space_available,
		   round((blocks_available * blocks_size * 10e-10),2) AS gigs_disk_space_available,
		   round((blocks           * blocks_size * 10e-10),2) AS gigs_total_disk_space
	FROM mounts WHERE path = '/' LIMIT 1;`)
	if err != nil {
		return nil, err
	}
	return info[0], nil
}

func QueryOsUnix() (map[string]string, error) {
	info, err := RunQuery(`
	SELECT
		os.name,
		os.major,
		os.minor,
		os.patch,
		os.extra,
		os.build,
		os.arch,
		os.platform,
		os.version AS version,
		k.version AS kernel_version
	FROM
		os_version os,
		kernel_info k`)
	if err != nil {
		return nil, err
	}
	return info[0], nil
}

func QueryUserAuthorizeKeys() (QueryResponse, error) {
	info, err := RunQuery(`
	SELECT 
		u.username,
		k.key,
		k.comment,
		k.algorithm
	FROM users u
		LEFT JOIN authorized_keys k ON u.uid = k.uid
	WHERE k.key IS NOT NULL;`)
	if err != nil {
		return nil, err
	}
	return info, nil
}

func QueryUserInfo() (QueryResponse, error) {
	info, err := RunQuery("select uid, username, gid, description, directory,shell from users")
	if err != nil {
		return nil, err
	}
	return info, nil
}

func QuerySoftwareList() (QueryResponse, error) {
	info, err := RunQuery(`
	SELECT
		name AS name,
		version AS version,
		'Package (deb)' AS type
	FROM deb_packages
	UNION
	SELECT
		name AS name,
		version AS version,
		'Package (RPM)' AS type
	FROM rpm_packages`)
	if err != nil {
		return nil, err
	}
	return info, nil
}

func GetPublicIPInfo() (map[string]string, error) {
	cmd := exec.Command("curl", "-m", "5", "ipinfo.io")
	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		return nil, fmt.Errorf("获取公网IP信息失败: %v, stderr: %s", err, stderr.String())
	}

	if out.Len() == 0 {
		return nil, fmt.Errorf("ipinfo.io 返回空数据")
	}

	var result map[string]interface{}
	if err := json.Unmarshal(out.Bytes(), &result); err != nil {
		return nil, fmt.Errorf("解析IP信息响应失败: %v", err)
	}

	publicIPInfo := make(map[string]string)

	if ip, ok := result["ip"].(string); ok {
		publicIPInfo["ip"] = ip
	} else {
		publicIPInfo["ip"] = "unknown"
	}

	if city, ok := result["city"].(string); ok {
		publicIPInfo["city"] = city
	} else {
		publicIPInfo["city"] = "unknown"
	}

	if country, ok := result["country"].(string); ok {
		publicIPInfo["country"] = country
	} else {
		publicIPInfo["country"] = "unknown"
	}

	if org, ok := result["org"].(string); ok {
		publicIPInfo["org"] = org
	} else {
		publicIPInfo["org"] = "unknown"
	}

	return publicIPInfo, nil
}

// QueryHostDetailInfo 主机详情数据
//
//	{
//	 "disk_info": {
//	   "gigs_disk_space_available": "631.11",
//	   "gigs_total_disk_space": "994.66",
//	   "percent_disk_space_available": "63"
//	 },
//	 "os_info": {
//	   "arch": "arm64",
//	   "build": "23G80",
//	   "extra": "",
//	   "kernel_version": "23.6.0",
//	   "major": "14",
//	   "minor": "6",
//	   "name": "macOS",
//	   "patch": "",
//	   "platform": "darwin",
//	   "version": "14.6"
//	 },
//	 "system_info": {
//	   "board_model": "",
//	   "board_serial": "",
//	   "board_vendor": "",
//	   "board_version": "",
//	   "computer_name": "Mac mini",
//	   "cpu_brand": "Apple M2 Pro",
//	   "cpu_logical_cores": "10",
//	   "cpu_microcode": "",
//	   "cpu_physical_cores": "10",
//	   "cpu_sockets": "",
//	   "cpu_subtype": "ARM64E",
//	   "cpu_type": "arm64e",
//	   "hardware_model": "Mac14,12",
//	   "hardware_serial": "X9QCQ2QW3M",
//	   "hardware_vendor": "Apple Inc.",
//	   "hardware_version": "",
//	   "hostname": "mac-mini.local",
//	   "local_hostname": "Mac-mini",
//	   "physical_memory": "34359738368",
//	   "uuid": "423EDCBF-FBD6-544F-A918-DDC8616C1F46"
//	 },
//	 "uptime": {
//	   "days": "11",
//	   "hours": "18",
//	   "minutes": "30",
//	   "seconds": "38",
//	   "total_seconds": "1017038"
//	 }
//	}
func QueryHostDetailInfo() (HostDetailInfo, error) {
	hostname, _ := GetHostName()
	info := HostDetailInfo{
		AgentVersion:          GetAgentVersion(),
		SystemInfo:            make(map[string]string),
		Uptime:                make(map[string]string),
		DiskInfo:              make(map[string]string),
		OsInfo:                make(map[string]string),
		SoftwareInfo:          make(QueryResponse, 0),
		UserInfo:              make(QueryResponse, 0),
		UserAuthorizeKeysInfo: make(QueryResponse, 0),
		HostName:              hostname,
		PublicIPInfo:          make(map[string]string),
	}

	systemInfo, err := QuerySystemInfo()
	if err != nil {
		log.Println("查询系统信息失败:", err)
		return HostDetailInfo{}, err
	}
	info.SystemInfo = systemInfo

	uptime, err := QueryUptime()
	if err != nil {
		log.Println("查询 uptime 失败:", err)
		return HostDetailInfo{}, err
	}
	info.Uptime = uptime

	diskInfo, err := QueryDiskSpaceUnix()
	if err != nil {
		log.Println("查询 disk_info 失败:", err)
		return HostDetailInfo{}, err
	}
	info.DiskInfo = diskInfo

	osInfo, err := QueryOsUnix()
	if err != nil {
		log.Println("查询 os_info 失败:", err)
		return HostDetailInfo{}, err
	}
	info.OsInfo = osInfo

	// 判断是否为Linux系统
	if runtime.GOOS == "linux" {
		softwareInfo, err := QuerySoftwareList()
		if err != nil {
			log.Println("查询 software_info 失败:", err)
			return HostDetailInfo{}, err
		}
		info.SoftwareInfo = softwareInfo
	}

	userInfo, err := QueryUserInfo()
	if err != nil {
		log.Println("查询 user_info 失败:", err)
		return HostDetailInfo{}, err
	}
	info.UserInfo = userInfo

	userAuthorizeKeysInfo, err := QueryUserAuthorizeKeys()
	if err != nil {
		log.Println("查询 user_authorize_keys_info 失败:", err)
		return HostDetailInfo{}, err
	}
	info.UserAuthorizeKeysInfo = userAuthorizeKeysInfo

	// 获取公网IP信息，如果失败则使用默认值
	publicIPInfo, err := GetPublicIPInfo()
	if err != nil {
		log.Println("查询 public_ip_info 失败:", err)
		info.PublicIPInfo = map[string]string{
			"ip":      "unknown",
			"city":    "unknown",
			"country": "unknown",
			"org":     "unknown",
		}
	} else {
		info.PublicIPInfo = publicIPInfo
	}

	return info, nil
}
