package file_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"fmt"
	"github.com/gin-gonic/gin"
)

// FileRemoveView 处理文件删除请求
func (FileApi) FileRemoveView(c *gin.Context) {
	var cr models.RemoveRequest
	err := c.ShouldBindJSON(&cr)
	if err != nil {
		res.FailWithCode(res.ArgumentError, c)
		return
	}

	// 查询要删除的文件
	var fileList []models.FileModel
	count := global.DB.Find(&fileList, "id IN ?", cr.IDList).RowsAffected
	if count == 0 {
		res.FailWithMessage("文件不存在", c)
		return
	}

	// 检查是否有引用记录
	var revisionCount int64
	err = global.DB.Model(&models.RevisionFile{}).Where("file_model_id IN ?", cr.IDList).Count(&revisionCount).Error
	if err != nil {
		res.FailWithMessage("无法检查文件引用状态", c)
		return
	}
	if revisionCount > 0 {
		res.FailWithMessage("文件被引用，无法删除", c)
		return
	}

	// 删除文件内容
	var fileDataList []models.FileDataModel
	if err := global.DB.Where("file_id IN ?", cr.IDList).Find(&fileDataList).Error; err != nil {
		res.FailWithMessage("无法查询文件内容", c)
		return
	}

	// 执行联级删除
	if err := global.DB.Delete(&fileDataList).Error; err != nil {
		res.FailWithMessage("删除文件内容失败", c)
		return
	}

	// 删除文件记录
	if err := global.DB.Delete(&fileList).Error; err != nil {
		res.FailWithMessage("删除文件失败", c)
		return
	}

	res.OkWithMessage(fmt.Sprintf("共删除 %d 个文件", count), c)
}
