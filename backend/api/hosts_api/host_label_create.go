package hosts_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"github.com/gin-gonic/gin"
)

type HostLabelCreate struct {
	Name string `json:"name"`
}

func (HostsApi) HostLabelCreate(c *gin.Context) {
	var cr HostLabelCreate
	if err := c.ShouldBindJSON(&cr); err != nil {
		res.FailWithMessage("参数错误", c)
		return
	}

	label := models.LabelModel{
		Name: cr.Name,
	}
	//先校验是否有同名标签
	var labelCheck models.LabelModel
	global.DB.Where("name = ?", cr.Name).First(&labelCheck)
	if labelCheck.ID > 0 {
		res.FailWithMessage("标签已存在", c)
		return
	}

	errCreate := global.DB.Create(&label).Error
	if errCreate != nil {
		global.Log.Error(errCreate)
		res.FailWithMessage("创建失败", c)
		return
	}

	res.OkWithData(label, c)

}
