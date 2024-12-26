package hosts_api

import (
	"github.com/gin-gonic/gin"
	"ccops/models"
	"ccops/global"
	"ccops/models/res"
)
type HostLabelUpdate struct {
	Name string `json:"name"`
}

//更某个标签的名称
func (HostsApi) HostLabelUpdateView(c *gin.Context) {

	id := c.Param("id")
	var cr HostLabelUpdate
	err := c.ShouldBindJSON(&cr)
	if err != nil {
		res.FailWithCode(res.ArgumentError, c)
		return
	}

	var label models.LabelModel
	global.DB.First(&label, id)
	if label.ID == 0 {
		res.FailWithMessage("标签不存在", c)
		return
	}
	label.Name = cr.Name
	global.DB.Save(&label)
	res.OkWithMessage("更新成功", c)

	






}
