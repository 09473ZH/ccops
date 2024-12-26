package file_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"crypto/md5"
	"encoding/hex"
	"github.com/gin-gonic/gin"
)

// UpdateFileContent 处理更新文件内容的请求
func (FileApi) UpdateFileContent(c *gin.Context) {
	var requestData struct {
		FileID  uint   `json:"fileId"`  // 文件ID
		Content string `json:"content"` // 新文件内容
	}

	// 绑定请求数据
	if err := c.BindJSON(&requestData); err != nil {
		res.FailWithMessage("请求参数解析失败: "+err.Error(), c)
		return
	}

	// 查询文件记录
	var fileRecord models.FileModel
	err := global.DB.Where("id = ?", requestData.FileID).First(&fileRecord).Error
	if err != nil {
		res.FailWithMessage("文件未找到", c)
		return
	}

	// 检查文件是否为二进制文件
	if fileRecord.ISBinaryFile == 1 {
		res.FailWithMessage("文件为二进制文件，无法编辑", c)
		return
	}

	// 更新文件内容
	var fileDataRecord models.FileDataModel
	err = global.DB.Where("file_id = ?", fileRecord.ID).First(&fileDataRecord).Error
	if err != nil {
		res.FailWithMessage("文件内容未找到", c)
		return
	}

	// 更新文件内容
	fileDataRecord.Data = []byte(requestData.Content)

	// 计算新的 MD5
	hash := md5.New()
	hash.Write(fileDataRecord.Data)
	md5Hash := hash.Sum(nil)
	fileRecord.FileMd5 = hex.EncodeToString(md5Hash)

	// 重新计算文件大小
	fileRecord.FileSize = int64(len(fileDataRecord.Data))

	// 保存更新
	if err := global.DB.Save(&fileRecord).Error; err != nil {
		res.FailWithMessage("更新文件信息失败: "+err.Error(), c)
		return
	}
	if err := global.DB.Save(&fileDataRecord).Error; err != nil {
		res.FailWithMessage("更新文件内容失败: "+err.Error(), c)
		return
	}

	res.OkWithMessage("更新成功", c)
}
