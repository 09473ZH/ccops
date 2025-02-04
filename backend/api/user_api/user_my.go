package user_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"ccops/utils/jwts"
	"github.com/gin-gonic/gin"
)

func (UserApi) UserMY(c *gin.Context) {
	_claims, _ := c.Get("claims")
	claims := _claims.(*jwts.CustomClaims)

	var my models.UserModel
	global.DB.Model(&models.UserModel{}).First(&my, claims.UserID)
	type MYInfo struct {
		Id        uint   `json:"id"`
		UserName  string `json:"username"`
		Role      string `json:"role"`
		Email     string `json:"email"`
		IsInit    bool   `json:"isInit"`
		IsEnabled bool   `json:"isEnabled"`
	}
	myInfo := MYInfo{
		Id:        my.ID,
		UserName:  my.UserName,
		Role:      my.Role,
		Email:     my.Email,
		IsInit:    my.IsInit,
		IsEnabled: my.IsEnabled,
	}

	res.OkWithData(myInfo, c)

}
