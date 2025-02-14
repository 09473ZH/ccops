package client_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"fmt"
	"github.com/gin-gonic/gin"
	"strconv"
	"time"
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

// 接收客户端上报来的机器信息
func (ClientApi) ClientInfoReceive(c *gin.Context) {

	var cr HostDetailInfo
	if err := c.ShouldBindJSON(&cr); err != nil {
		res.FailWithMessage("参数错误", c)
		return
	}

	if cr.IP == "" {
		// 用户没指定-i，直接传来源 IP
		cr.IP = c.ClientIP()

	}

	// 检查是否注册过
	var host models.HostModel
	err := global.DB.Model(&models.HostModel{}).Take(&host, "host_server_url = ?", cr.IP).Error
	if err == nil {
		// 没报错，找到了，注册过了，更新一下时间即可
		global.DB.Model(&models.HostModel{}).Where("host_server_url = ?", cr.IP).Update("fetch_time", time.Now())

	} else {
		// 第一次，注册
		global.DB.Create(&models.HostModel{
			Name:          cr.HostName,
			HostServerUrl: cr.IP,
			FetchTime:     time.Now(),
			StartTime:     time.Now(),
		})

	}
	// 查找或更新 HostModel 实例
	var hostModel models.HostModel
	hostServerUrl := c.ClientIP() // 使用客户端 IP 作为唯一标识
	if err := global.DB.Where("host_server_url = ?", hostServerUrl).First(&hostModel).Error; err != nil {
		// 如果主机记录不存在，返回错误
		res.FailWithMessage("未找到主机记录", c)
		return
	}

	// 更新 HostModel 数据
	hostModel.FetchTime = time.Now()
	hostModel.OperatingSystem = cr.OsInfo["name"]
	hostModel.PrimaryIp = cr.SystemInfo["primary_ip"]
	hostModel.PrimaryMac = cr.SystemInfo["primary_mac"]
	hostModel.BoardModel = cr.SystemInfo["board_model"]
	hostModel.BoardSerial = cr.SystemInfo["board_serial"]
	hostModel.BoardVendor = cr.SystemInfo["board_vendor"]
	hostModel.BoardVersion = cr.SystemInfo["board_version"]
	hostModel.CpuType = cr.SystemInfo["cpu_type"]
	hostModel.CpuLogicalCores = cr.SystemInfo["cpu_logical_cores"]
	hostModel.CpuPhysicalCores = cr.SystemInfo["cpu_physical_cores"]
	hostModel.CpuSockets = cr.SystemInfo["cpu_sockets"]
	hostModel.CpuSubtype = cr.SystemInfo["cpu_subtype"]
	hostModel.CpuBrand = cr.SystemInfo["cpu_brand"]
	hostModel.CpuMicrocode = cr.SystemInfo["cpu_microcode"]
	hostModel.HardwareModel = cr.SystemInfo["hardware_model"]
	hostModel.HardwareSerial = cr.SystemInfo["hardware_serial"]
	hostModel.HardwareVendor = cr.SystemInfo["hardware_vendor"]
	hostModel.HardwareVersion = cr.SystemInfo["hardware_version"]
	hostModel.PhysicalMemory = cr.SystemInfo["physical_memory"]
	hostModel.UUID = cr.SystemInfo["uuid"]
	hostModel.TotalUptimeSeconds = cr.Uptime["total_seconds"]
	hostModel.Arch = cr.OsInfo["arch"]
	hostModel.Build = cr.OsInfo["build"]
	hostModel.KernelVersion = cr.OsInfo["kernel_version"]
	hostModel.Major = cr.OsInfo["major"]
	hostModel.Minor = cr.OsInfo["minor"]
	hostModel.Patch = cr.OsInfo["patch"]
	hostModel.Platform = cr.OsInfo["platform"]
	hostModel.Version = cr.OsInfo["version"]
	hostModel.Name = cr.HostName
	hostModel.PublicIP = cr.PublicIPInfo["ip"]
	hostModel.Country = cr.PublicIPInfo["country"]
	hostModel.City = cr.PublicIPInfo["city"]
	hostModel.Org = cr.PublicIPInfo["org"]

	// 保存更新后的主机记录
	if err := global.DB.Save(&hostModel).Error; err != nil {
		res.FailWithMessage("主机记录更新失败", c)
		return
	}

	// 处理磁盘信息
	diskModel := models.DiskModel{
		HostID:                    hostModel.ID, // 关联主机的 ID
		DiskSpaceAvailable:        parseFloat(cr.DiskInfo["gigs_disk_space_available"]),
		TotalDiskSpace:            parseFloat(cr.DiskInfo["gigs_total_disk_space"]),
		PercentDiskSpaceAvailable: cr.DiskInfo["percent_disk_space_available"],
		Encrypted:                 false, // 根据需求设置加密状态
	}

	// 查找是否已有磁盘记录
	var existingDiskModel models.DiskModel
	if err := global.DB.Where("host_id = ?", hostModel.ID).First(&existingDiskModel).Error; err == nil {
		// 如果找到已有的磁盘记录，进行更新
		existingDiskModel.DiskSpaceAvailable = diskModel.DiskSpaceAvailable
		existingDiskModel.TotalDiskSpace = diskModel.TotalDiskSpace
		existingDiskModel.PercentDiskSpaceAvailable = diskModel.PercentDiskSpaceAvailable
		existingDiskModel.Encrypted = diskModel.Encrypted

		// 保存更新后的磁盘信息
		if err := global.DB.Save(&existingDiskModel).Error; err != nil {
			res.FailWithMessage("磁盘信息更新失败", c)
			return
		}
	} else {
		// 如果没有找到磁盘记录，则创建一条新的记录
		if err := global.DB.Create(&diskModel).Error; err != nil {
			res.FailWithMessage("磁盘信息创建失败", c)
			return
		}
	}

	// 处理软件信息
	if len(cr.SoftwareInfo) > 0 {
		// 获取现有的软件记录
		var existingSoftware []models.SoftwareModel
		global.DB.Where("host_id = ?", hostModel.ID).Find(&existingSoftware)

		// 创建映射以便快速查找
		existingSoftwareMap := make(map[string]models.SoftwareModel)
		for _, software := range existingSoftware {
			key := fmt.Sprintf("%s-%s-%s", software.Name, software.Version, software.Type)
			existingSoftwareMap[key] = software
		}

		// 处理新的软件记录
		for _, software := range cr.SoftwareInfo {
			key := fmt.Sprintf("%s-%s-%s", software["name"], software["version"], software["type"])

			if _, exists := existingSoftwareMap[key]; !exists {
				// 只添加不存在的记录
				softwareModel := models.SoftwareModel{
					HostID:  hostModel.ID,
					Name:    software["name"],
					Version: software["version"],
					Type:    software["type"],
				}
				if err := global.DB.Create(&softwareModel).Error; err != nil {
					global.Log.Error("软件信息保存失败:", err)
				}
			}
			// 从map中删除已处理的记录
			delete(existingSoftwareMap, key)
		}

		// 删除不再存在的记录
		for _, software := range existingSoftwareMap {
			global.DB.Delete(&software)
		}
	}

	// 处理用户信息
	if len(cr.UserInfo) > 0 {
		// 获取现有的用户记录
		var existingUsers []models.SystemUserModel
		global.DB.Where("host_id = ?", hostModel.ID).Find(&existingUsers)

		// 创建映射以便快速查找
		existingUserMap := make(map[string]models.SystemUserModel)
		for _, user := range existingUsers {
			existingUserMap[user.Username] = user
		}

		// 处理新的用户记录
		for _, user := range cr.UserInfo {
			if existingUser, exists := existingUserMap[user["username"]]; exists {
				// 更新现有用户信息（如果有变化）
				if existingUser.UID != user["uid"] ||
					existingUser.GID != user["gid"] ||
					existingUser.Description != user["description"] ||
					existingUser.Directory != user["directory"] ||
					existingUser.Shell != user["shell"] {

					existingUser.UID = user["uid"]
					existingUser.GID = user["gid"]
					existingUser.Description = user["description"]
					existingUser.Directory = user["directory"]
					existingUser.Shell = user["shell"]

					global.DB.Save(&existingUser)
				}
			} else {
				// 添加新用户
				userModel := models.SystemUserModel{
					HostID:      hostModel.ID,
					UID:         user["uid"],
					Username:    user["username"],
					GID:         user["gid"],
					Description: user["description"],
					Directory:   user["directory"],
					Shell:       user["shell"],
				}
				if err := global.DB.Create(&userModel).Error; err != nil {
					global.Log.Error("系统用户信息保存失败:", err)
				}
			}
			delete(existingUserMap, user["username"])
		}

		// 删除不再存在的用户记录
		for _, user := range existingUserMap {
			global.DB.Delete(&user)
		}
	}

	// 处理用户公钥信息
	if len(cr.UserAuthorizeKeysInfo) > 0 {
		// 获取现有的公钥记录，添加更多的查询条件确保唯一性
		var existingKeys []models.UserKeyModel
		global.DB.Where("host_id = ? ", hostModel.ID).Find(&existingKeys)

		// 创建映射以便快速查找，使用更完整的唯一标识
		existingKeyMap := make(map[string]models.UserKeyModel)
		for _, key := range existingKeys {
			// 使用所有关键字段作为唯一标识
			mapKey := fmt.Sprintf("%s:%s:%s:%s",
				key.Username,
				key.Key,
				key.Algorithm,
				key.Comment) // 添加comment作为标识的一部分
			existingKeyMap[mapKey] = key
		}

		// 处理新的公钥记录
		for _, key := range cr.UserAuthorizeKeysInfo {
			mapKey := fmt.Sprintf("%s:%s:%s:%s",
				key["username"],
				key["key"],
				key["algorithm"],
				key["comment"])

			if _, exists := existingKeyMap[mapKey]; exists {
				// 记录已存在，不需要任何操作
				global.Log.Debug("公钥记录已存在，跳过:", mapKey)
			} else {
				// 只有当记录确实不存在时才添加
				keyModel := models.UserKeyModel{
					HostID:    hostModel.ID,
					Username:  key["username"],
					Key:       key["key"],
					Comment:   key["comment"],
					Algorithm: key["algorithm"],
				}

				// 在创建前再次检查是否存在
				var count int64
				global.DB.Model(&models.UserKeyModel{}).
					Where("host_id = ? AND username = ? AND `key` = ? AND algorithm = ?",
						hostModel.ID, key["username"], key["key"], key["algorithm"]).
					Count(&count)

				if count == 0 {
					if err := global.DB.Create(&keyModel).Error; err != nil {
						global.Log.Error("用户公钥信息保存失败:", err)
					}
				}
			}
			// 从映射中删除已处理的记录
			delete(existingKeyMap, mapKey)
		}

		// 删除不再存在的公钥记录
		for _, key := range existingKeyMap {
			global.DB.Delete(&key)
		}
	} else {
		// 如果没有传入任何公钥信息，删除所有现有的公钥记录
		global.DB.Where("host_id = ?", hostModel.ID).Delete(&models.UserKeyModel{})
	}

	res.OkWithMessage("更新成功", c)

	//后面采集到角色和软件了也这样写

}

// 辅助函数：解析字符串为浮点数
func parseFloat(s string) float64 {
	val, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return 0.0 // 解析失败返回0，可以根据需求调整
	}
	return val
}
