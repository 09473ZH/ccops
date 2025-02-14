package labels_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"ccops/utils/jwts"
	"ccops/utils/permission"
	"github.com/gin-gonic/gin"
)

type HostLabelCreate struct {
	Name string `json:"name"`
}

func (LabelApi) HostLabelCreate(c *gin.Context) {
	_claims, _ := c.Get("claims")
	claims := _claims.(*jwts.CustomClaims)
	if !permission.IsAdmin(claims.UserID) {
		res.FailWithMessage("权限错误", c)
		return
	}
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
