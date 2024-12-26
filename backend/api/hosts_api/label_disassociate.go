package hosts_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"github.com/gin-gonic/gin"
)

// 删除某标签关联的所有主机
func (HostsApi) LabelDisassociateView(c *gin.Context) {
	labelID := c.Param("id")

	err := global.DB.Model(&models.HostLabels{}).Where("label_model_id = ?", labelID).Delete(&models.HostLabels{}).Error
	if err != nil {
		res.FailWithMessage("解除失败", c)
		return
	}

	res.OkWithMessage("解除成功", c)

}
