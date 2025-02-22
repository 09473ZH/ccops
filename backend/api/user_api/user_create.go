package user_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"ccops/utils/jwts"
	"ccops/utils/permission"
	"ccops/utils/pwd"
	"math/rand"
	"net/mail"
	"regexp"

	"github.com/gin-gonic/gin"
)

func (UserApi) UserCreate(c *gin.Context) {
	_claims, _ := c.Get("claims")
	claims := _claims.(*jwts.CustomClaims)
	if !permission.IsAdmin(claims.UserID) {
		res.FailWithMessage("权限不足", c)
		return
	}
	type UserPermission struct {
		HostIds  []uint `json:"hostIds"`
		LabelIds []uint `json:"labelIds"` // 新增标签ID列表
	}
	// 定义请求结构体
	type CreateUserReq struct {
		UserName    string         `json:"username"`
		Email       string         `json:"email"`
		Role        string         `json:"role"`
		Permissions UserPermission `json:"permissions"`
	}

	// 解析请求体
	var req CreateUserReq
	if err := c.ShouldBindJSON(&req); err != nil {
		res.FailWithMessage(err.Error(), c)
		return
	}

	// 验证邮箱格式
	if _, err := mail.ParseAddress(req.Email); err != nil {
		res.FailWithMessage("无效的邮箱格式", c)
		return
	}

	// 检查邮箱唯一性
	var emailCount int64
	global.DB.Model(&models.UserModel{}).Where("email = ?", req.Email).Count(&emailCount)
	if emailCount > 0 {
		res.FailWithMessage("邮箱已存在", c)
		return
	}

	// 验证用户名格式和唯一性
	if req.UserName == "" {
		res.FailWithMessage("用户名不能为空", c)
		return
	}

	matched, _ := regexp.MatchString("^[a-z0-9]+$", req.UserName)
	if !matched {
		res.FailWithMessage("用户名只能包含小写字母和数字", c)
		return
	}

	// 检查用户名唯一性
	var count int64
	global.DB.Model(&models.UserModel{}).Where("username = ?", req.UserName).Count(&count)
	if count > 0 {
		res.FailWithMessage("用户名已存在", c)
		return
	}

	// 使用指定用户名
	username := req.UserName

	// 生成随机密码并哈希
	passwordLetters := []rune("abcdefghijklmnopqrstuvwxyz0123456789")
	b := make([]rune, 6)
	for i := range b {
		b[i] = passwordLetters[rand.Intn(len(passwordLetters))]
	}
	password := string(b)

	hashedPassword := pwd.HashPwd(password)

	// 开启事务
	tx := global.DB.Begin()

	// 保存到数据库
	newUser := models.UserModel{
		Username: username,
		Email:    req.Email,
		Password: hashedPassword,
		Role:     req.Role,
	}
	if err := tx.Create(&newUser).Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("用户创建失败", c)
		return
	}

	// 分配主机权限
	if len(req.Permissions.HostIds) > 0 {
		var toAdd []models.HostPermission
		for _, hostId := range req.Permissions.HostIds {
			toAdd = append(toAdd, models.HostPermission{
				UserId: newUser.ID,
				HostId: hostId,
			})
		}
		if err := tx.Create(&toAdd).Error; err != nil {
			tx.Rollback()
			res.FailWithMessage("分配主机权限失败", c)
			return
		}
	}

	// 分配标签权限
	if len(req.Permissions.LabelIds) > 0 {
		var toAddLabels []models.UserLabels
		for _, labelId := range req.Permissions.LabelIds {
			toAddLabels = append(toAddLabels, models.UserLabels{
				UserID:  newUser.ID,
				LabelID: labelId,
			})
		}
		if err := tx.Create(&toAddLabels).Error; err != nil {
			tx.Rollback()
			res.FailWithMessage("分配标签权限失败", c)
			return
		}
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("用户创建失败", c)
		return
	}

	// 返回创建成功信息
	type userInfo struct {
		UserName string `json:"username"`
		Password string `json:"password"`
		Email    string `json:"email"`
	}
	var user userInfo
	user.UserName = username
	user.Password = password
	user.Email = req.Email

	res.Ok(user, "用户创建成功", c)
}
