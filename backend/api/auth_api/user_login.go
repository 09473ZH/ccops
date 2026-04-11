package auth_api

import (
	"ccops/global"
	"ccops/middleware"
	"ccops/models"
	"ccops/models/res"
	"ccops/utils/jwts"
	"ccops/utils/pwd"
	"time"

	"github.com/gin-gonic/gin"
)

type EmailLoginRequest struct {
	UserName string `json:"username" binding:"required" msg:"请输入用户名或邮箱"`
	Password string `json:"password" binding:"required" msg:"请输入密码"`
}

func (AuthApi) UserLoginView(c *gin.Context) {
	var cr EmailLoginRequest
	err := c.ShouldBindJSON(&cr)
	if err != nil {
		res.FailWithError(err, &cr, c)
		return
	}

	ip := c.ClientIP()
	if allowed, msg := middleware.CheckLoginRate(ip, cr.UserName); !allowed {
		c.JSON(429, gin.H{"code": res.Error, "data": map[string]any{}, "msg": msg})
		c.Abort()
		return
	}

	var userModel models.UserModel
	err = global.DB.Take(&userModel, "username = ? or email = ? ", cr.UserName, cr.UserName).Error
	if err != nil {
		// 用户名不存在
		middleware.RecordLoginFailure(ip, cr.UserName)
		global.Log.Warn("用户不存在")
		res.FailWithMessage("用户名或密码错误", c)
		return
	}

	// 校验密码
	isCheck := pwd.CheckPwd(userModel.Password, cr.Password)
	if !isCheck {
		middleware.RecordLoginFailure(ip, cr.UserName)
		global.Log.Warn("用户名密码错误")
		res.FailWithMessage("用户名或密码错误", c)
		return
	}

	// 登录成功，清除限流状态
	middleware.RecordLoginSuccess(ip, cr.UserName)

	// 登录成功，生成token对
	tokenPair, err := jwts.GenToken(jwts.JwtPayLoad{
		Role:     userModel.Role,
		UserID:   userModel.ID,
		Username: userModel.Username,
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
		ExpireAt:     time.Now().Add(time.Duration(global.Config.Jwt.AccessExpires) * time.Hour).Unix(),
	}

	res.OkWithData(loginResponse, c)
}
