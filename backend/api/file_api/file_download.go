package file_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"fmt"
	"github.com/gin-gonic/gin"
	"net/http"
	"net/url"
)

// FilesDownloadView 处理文件下载请求
func (FileApi) FilesDownloadView(c *gin.Context) {
	// 从请求中获取文件的唯一标识（例如文件ID）
	fileID := c.Param("id") // 假设通过 URL 参数传递文件ID

	// 从数据库中查找文件记录
	var fileRecord models.FileModel
	if err := global.DB.Where("id = ?", fileID).First(&fileRecord).Error; err != nil {
		res.FailWithMessage("文件未找到", c)
		return
	}

	// 查找文件数据
	var fileDataModel models.FileDataModel
	if err := global.DB.Where("file_id = ?", fileID).First(&fileDataModel).Error; err != nil {
		res.FailWithMessage("文件数据未找到", c)
		return
	}

	// 对文件名进行 URL 编码
	encodedFileName := url.QueryEscape(fileRecord.FileName)

	// 设置响应头以触发文件下载
	c.Header("Content-Type", "application/octet-stream")
	c.Header("Content-Disposition", "attachment; filename*=utf-8''"+encodedFileName) // 使用 RFC 5987 编码文件名
	c.Header("Content-Length", fmt.Sprintf("%d", fileRecord.FileSize))               // 设置文件大小

	// 发送文件数据到客户端
	if len(fileDataModel.Data) == 0 {
		res.FailWithMessage("文件内容为空", c)
		return
	}

	c.Data(http.StatusOK, "application/octet-stream", fileDataModel.Data)
}
