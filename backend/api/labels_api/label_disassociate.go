package labels_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"ccops/utils/jwts"
	"ccops/utils/permission"
	"github.com/gin-gonic/gin"
)

// 删除某标签关联的所有主机
func (LabelApi) LabelDisassociateView(c *gin.Context) {
	_claims, _ := c.Get("claims")
	claims := _claims.(*jwts.CustomClaims)
	if !permission.IsAdmin(claims.UserID) {
		res.FailWithMessage("权限错误", c)
		return
	}
	labelID := c.Param("id")

	err := global.DB.Model(&models.HostLabels{}).Where("label_model_id = ?", labelID).Delete(&models.HostLabels{}).Error
	if err != nil {
		res.FailWithMessage("解除失败", c)
		return
	}

	res.OkWithMessage("解除成功", c)

}
