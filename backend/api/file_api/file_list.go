package file_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"github.com/gin-gonic/gin"
)

// 查询文件列表
type FileSearch struct {
	FileName string `form:"fileName"`
}

func (FileApi) FileListView(c *gin.Context) {
	var cr FileSearch
	if err := c.ShouldBindQuery(&cr); err != nil {
		res.FailWithMessage(err.Error(), c)
		return
	}

	var files []models.FileModel

	// 构建查询
	query := global.DB.Model(&models.FileModel{}).
		Select("id, file_name, file_md5, description, file_size, is_binary_file, tags, s3_bucket_name, s3_object_key, download_url")

	// 如果提供了文件名，则添加 WHERE 条件和按匹配度排序
	if cr.FileName != "" {
		fileName := "%" + cr.FileName + "%"
		query = query.Where("file_name LIKE ?", fileName).
			Order("LOCATE('" + cr.FileName + "', file_name)") // 按匹配度排序

	}

	// 执行查询
	err := query.Order("created_at DESC").Find(&files).Error
	if err != nil {
		res.FailWithMessage("查询失败", c)
		return
	}

	// 返回文件列表（如果没有文件，则返回空数组）
	res.OkWithList(files, int64(len(files)), c)
}
