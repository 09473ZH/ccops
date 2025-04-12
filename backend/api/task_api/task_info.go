package task_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"github.com/gin-gonic/gin"
)

type TaskInfoRep struct {
	models.TaskModel
	TargetIps []string `json:"targetIps"`
	RoleNames []string `json:"roleNames"`
}

func (TaskApi) TaskInfoView(c *gin.Context) {
	var taskInfoRep TaskInfoRep
	id := c.Param("id")
	var task models.TaskModel
	db := global.DB.Debug()
	db.Model(&models.TaskModel{}).Where("id = ?", id).First(&task)
	taskInfoRep.TaskModel = task
	var roleIds []uint
	var revisionIds []uint
	db.Model(&models.TaskAssociationModel{}).Where("task_id = ?", id).Select("role_id").Find(&roleIds)

	db.Model(&models.TaskAssociationModel{}).Where("task_id = ?", id).Select("revision_id").Find(&revisionIds)
	db.Model(&models.RoleModel{}).Where("id in (?)", roleIds).Select("name").Find(&taskInfoRep.RoleNames)
	db.Model(&models.TargetAssociationModel{}).Where("task_id = ?", id).Select("host_ip").Find(&taskInfoRep.TargetIps)
	res.OkWithData(taskInfoRep, c)
}
