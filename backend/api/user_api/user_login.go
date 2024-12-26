package user_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"ccops/utils/jwts"
	"ccops/utils/pwd"
	"github.com/gin-gonic/gin"
	"time"
)

type EmailLoginRequest struct {
	UserName string `json:"username" binding:"required" msg:"请输入用户名"`
	Password string `json:"password" binding:"required" msg:"请输入密码"`
}

func (UserApi) UserLoginView(c *gin.Context) {
	var cr EmailLoginRequest
	err := c.ShouldBindJSON(&cr)
	if err != nil {
		res.FailWithError(err, &cr, c)
		return
	}

	var userModel models.UserModel
	err = global.DB.Take(&userModel, "username = ?", cr.UserName).Error
	if err != nil {
		// 用户名不存在
		global.Log.Warn("用户名不存在")
		res.FailWithMessage("用户名或密码错误", c)
		return
	}

	// 校验密码
	isCheck := pwd.CheckPwd(userModel.Password, cr.Password)
	if !isCheck {
		global.Log.Warn("用户名密码错误")
		res.FailWithMessage("用户名或密码错误", c)
		return
	}

	// 登录成功，生成token对
	tokenPair, err := jwts.GenToken(jwts.JwtPayLoad{
		Role:     int(userModel.Role),
		UserID:   userModel.ID,
		Username: userModel.UserName,
	})
	if err != nil {
		global.Log.Error(err)
		res.FailWithMessage("token生成失败", c)
		return
	}

	// 构造登录响应
	loginResponse := res.LoginResponse{
		AccessToken:  tokenPair.AccessToken,
		RefreshToken: tokenPair.RefreshToken,
		UserInfo: map[string]interface{}{
			"id":       userModel.ID,
			"username": userModel.UserName,
			"role":     userModel.Role,
		},
		ExpireAt: time.Now().Add(30 * time.Minute).Unix(), // 30分钟后过期
	}

	res.OkWithData(loginResponse, c)
}
