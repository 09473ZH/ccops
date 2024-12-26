package user_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"ccops/utils/jwts"
	"github.com/gin-gonic/gin"
)

func (UserApi) UserInfoView(c *gin.Context) {
	_claims, _ := c.Get("claims")
	claims := _claims.(*jwts.CustomClaims)

	var user models.UserModel
	global.DB.Model(&models.UserModel{}).Where("id = ?", claims.UserID).First(&user)
	res.OkWithData(user, c)
}
