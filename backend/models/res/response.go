package res

import (
	utils "ccops/utils"
	"encoding/json"
	"github.com/gin-gonic/gin"
	"net/http"
)

type Response struct {
	Code int    `json:"code"`
	Data any    `json:"data"`
	Msg  string `json:"msg"`
}

func (r Response) Json() string {
	byteData, _ := json.Marshal(r)
	return string(byteData)
}

type ListResponse[T any] struct {
	Count       int64 `json:"count"`
	List        T     `json:"list"`
	ResultCount int64 `json:"resultCount"`
}

const (
	Success = 0
	Error   = 7
)

func Result(code int, data any, msg string, c *gin.Context) {
	c.JSON(http.StatusOK, Response{
		Code: code,
		Data: data,
		Msg:  msg,
	})
}

func Ok(data any, msg string, c *gin.Context) {
	Result(Success, data, msg, c)
}

func OkWithData(data any, c *gin.Context) {
	Result(Success, data, "成功", c)
}

func OkWithList(list any, count int64, c *gin.Context) {
	OkWithData(ListResponse[any]{
		List:  list,
		Count: count,
	}, c)
}

func OkWithPageList(list any, count, resultCount int64, c *gin.Context) {
	OkWithData(ListResponse[any]{
		List:        list,
		Count:       count,
		ResultCount: resultCount,
	}, c)
}

func OkWithMessage(msg string, c *gin.Context) {
	Result(Success, map[string]any{}, msg, c)
}

func FailWithMessage(msg string, c *gin.Context) {
	Result(Error, map[string]any{}, msg, c)
}

func FailWithError(err error, obj any, c *gin.Context) {
	msg := utils.GetValidMsg(err, obj)
	FailWithMessage(msg, c)
}

func FailWithCode(code ErrorCode, c *gin.Context) {
	msg, ok := ErrorMap[code]
	if ok {
		Result(int(code), map[string]any{}, msg, c)
		return
	}
	Result(Error, map[string]any{}, "未知错误", c)
}

func OkWithDataSSE(data any, c *gin.Context) {
	content := Response{
		Code: Success,
		Data: data,
		Msg:  "成功",
	}.Json()
	c.SSEvent("", content)
}

func OkWithSSE(data any, msg string, c *gin.Context) {
	content := Response{
		Code: Success,
		Data: data,
		Msg:  msg,
	}.Json()
	c.SSEvent("", content)
}
func FailWithMessageSSE(msg string, c *gin.Context) {
	Result(Error, map[string]any{}, msg, c)
	data := Response{
		Code: Error,
		Data: map[string]any{},
		Msg:  msg,
	}.Json()
	c.SSEvent("", data)
}

// LoginResponse 登录响应结构体
type LoginResponse struct {
	AccessToken  string `json:"accessToken"`  // 访问令牌
	RefreshToken string `json:"refreshToken"` // 刷新令牌
	ExpireAt     int64  `json:"expireAt"`     // 访问令牌过期时间（时间戳）
}
