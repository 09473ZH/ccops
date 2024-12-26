package file_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"github.com/gin-gonic/gin"
)

// GetFileContent 处理获取文件内容的请求
func (FileApi) GetFileContent(c *gin.Context) {
	fileID := c.Query("fileId")
	if fileID == "" {
		res.FailWithMessage("fileId is required", c)
		return
	}

	var fileRecord models.FileModel
	// 查询文件记录
	err := global.DB.Where("id = ?", fileID).First(&fileRecord).Error
	if err != nil {
		res.FailWithMessage("文件不存在", c)
		return
	}

	// 检查是否为二进制文件
	if fileRecord.ISBinaryFile == 1 {
		res.FailWithMessage("文件为二进制文件，无法预览", c)
		return
	}

	// 查询文件内容
	var fileData models.FileDataModel
	err = global.DB.Where("file_id = ?", fileRecord.ID).First(&fileData).Error
	if err != nil {
		res.FailWithMessage("无法获取文件内容", c)
		return
	}

	// 将文件内容作为文本返回
	content := string(fileData.Data)
	res.OkWithData(content, c)
}
