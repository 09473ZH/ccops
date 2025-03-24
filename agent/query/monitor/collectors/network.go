package collectors

import (
	"agent/query/monitor/calculator"
	"agent/query/monitor/models"
	"net"

	psnet "github.com/shirou/gopsutil/v3/net"
)

// NetworkCollector 网络信息收集器
type NetworkCollector struct {
	calculator *calculator.NetworkCalculator
}

// NewNetworkCollector 创建新的网络收集器
func NewNetworkCollector() *NetworkCollector {
	return &NetworkCollector{
		calculator: calculator.NewNetworkCalculator(),
	}
}

// Collect 收集网络状态
func (nc *NetworkCollector) Collect() ([]models.InterfaceStats, error) {
	var networkStats []models.InterfaceStats

	// 获取网卡信息
	interfaces, err := net.Interfaces()
	if err != nil {
		return nil, err
	}

	// 获取网卡统计信息
	netIOCounters, err := psnet.IOCounters(true)
	if err != nil {
		return nil, err
	}

	// 处理每个网卡
	for _, iface := range interfaces {
		// 跳过本地回环和非活动接口
		if iface.Flags&net.FlagLoopback != 0 || iface.Flags&net.FlagUp == 0 {
			continue
		}

		stat := models.InterfaceStats{
			Name:       iface.Name,
			MacAddress: iface.HardwareAddr.String(),
		}

		// 获取IP地址
		addrs, err := iface.Addrs()
		if err != nil {
			continue
		}
		for _, addr := range addrs {
			if ipnet, ok := addr.(*net.IPNet); ok {
				if ip4 := ipnet.IP.To4(); ip4 != nil {
					stat.IPv4Address = ip4.String()
					break // 只保留IPv4地址
				}
			}
		}

		// 获取网卡统计信息
		for _, counter := range netIOCounters {
			if counter.Name == iface.Name {
				stat.TotalRecvBytes = counter.BytesRecv
				stat.TotalSentBytes = counter.BytesSent
				break
			}
		}

		// 计算网络速率
		nc.calculator.CalculateNetworkRates(&stat)

		networkStats = append(networkStats, stat)
	}

	return networkStats, nil
}
