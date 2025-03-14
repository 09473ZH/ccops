package flags

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/alert"
)

func DB() {
	var err error

	// 生成四张表的表结构
	err = global.DB.Set("gorm:table_options", "ENGINE=InnoDB").
		AutoMigrate(

			/*&models.InfoAIModel{},*/
			&models.UserModel{},
			&models.HostModel{},
			&models.FileModel{},
			&models.SoftwareModel{},
			&models.HostUserModel{},
			&models.DiskModel{},
			&models.RoleModel{},
			&models.RoleRevisionModel{},
			&models.TaskModel{},
			&models.TaskAssociationModel{},
			&models.TargetAssociationModel{},
			&models.RevisionFile{},
			&models.FileDataModel{},
			&models.HostLabels{},
			&models.KeyModel{},
			&models.LabelModel{},
			&models.Configuration{},
			&models.UserKeyModel{},
			&models.SystemUserModel{},
			&models.HostPermission{},
			&models.UserLabels{},
			&alert.AlertRecord{},
			&alert.AlertRule{},
		)
	if err != nil {
		global.Log.Error("[ error ] 生成数据库表结构失败")
		return
	}
	global.Log.Info("[ success ] 生成数据库表结构成功！")
}
