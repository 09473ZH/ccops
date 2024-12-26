package request

import (
	"agent/query"
	"agent/update"
	"log"
)

func CheckAndUpdatePublicKey() error {
	// 向服务端要公钥，并存储到机器的authorized_keys文件中
	pubKey, err := GetPublicKey()
	if err != nil {
		log.Println("获取公钥失败：", err)
		return err
	}

	// Linux 系统将公钥写入到 authorized_keys 文件中
	osType, err := query.GetOsType()
	if err != nil {
		log.Println("获取操作系统类型失败：", err)
		return err
	}

	if osType == "Linux" {
		err = update.AddRootPublicKey(pubKey)
		if err != nil {
			log.Println("写入公钥失败：", err)
			return err
		}
	}
	return nil
}
