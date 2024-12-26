package file_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"github.com/gin-gonic/gin"
	"io/ioutil"
	"strings"
	"unicode/utf8"
)

type TagRequest struct {
	Tags []string `json:"tags"` // 文章标签
}

// 文件大小限制（5MB）
const MaxFileSize = 5 * 1024 * 1024

// 判断文件是否为二进制文件
func IsBinaryFile(fileData []byte) int {
	if len(fileData) == 0 {
		return 1 // 空文件被认为是二进制文件
	}

	// 检查文件数据是否是有效的 UTF-8 编码
	if utf8.Valid(fileData) {
		return 0 // 如果是有效的 UTF-8 编码，认为是文本文件
	}

	// 如果不是有效的 UTF-8 编码，进一步检查文件数据
	// 检查是否包含 null 字节和大于 0x7F 的字符
	nullByteCount := 0
	nonPrintByteCount := 0

	for _, b := range fileData {
		if b == 0 {
			nullByteCount++
		}
		if b > 0x7F {
			nonPrintByteCount++
		}
	}

	// 判断为二进制文件的条件
	// 1. 如果 null 字节超过一定比例
	// 2. 非打印字符占比超过一定比例
	if nullByteCount > len(fileData)/10 || nonPrintByteCount > len(fileData)/10 {
		return 1
	}

	return 0 // 否则认为是文本文件
}

func (FileApi) FilesUploadView(c *gin.Context) {
	// 解析表单数据
	form, err := c.MultipartForm()
	if err != nil {
		res.FailWithMessage("无法解析表单数据: "+err.Error(), c)
		return
	}

	// 解析文件
	fileList, ok := form.File["files"]
	if !ok {
		res.FailWithMessage("不存在的文件", c)
		return
	}

	// 解析标签
	tagValues := form.Value["tags"]
	var tags []string
	if len(tagValues) > 0 {
		tags = strings.Split(tagValues[0], ",")
	} else {
		tags = []string{"常规"}
	}

	for _, fileHeader := range fileList {
		file, err := fileHeader.Open()
		if err != nil {
			res.FailWithMessage(fmt.Sprintf("打开文件 %s 失败: %s", fileHeader.Filename, err.Error()), c)
			return
		}
		defer file.Close() // 在循环结束时关闭文件

		fileSize := fileHeader.Size
		if fileSize > MaxFileSize {
			res.FailWithMessage(fmt.Sprintf("%s 文件大小超过限制", fileHeader.Filename), c)
			return
		}

		fileData, err := ioutil.ReadAll(file)
		if err != nil {
			res.FailWithMessage(fmt.Sprintf("读取文件 %s 失败: %s", fileHeader.Filename, err.Error()), c)
			return
		}

		// 使用文件数据计算 MD5
		hash := md5.New()
		hash.Write(fileData)
		md5Hash := hash.Sum(nil)
		md5String := hex.EncodeToString(md5Hash)

		// 判断文件是否已经存在
		var existingFile models.FileModel
		errFile := global.DB.Where("file_md5 = ?", md5String).First(&existingFile).Error
		if errFile == nil {
			res.FailWithMessage(fmt.Sprintf("%s 文件已存在，请勿重复上传", fileHeader.Filename), c)
			return
		}

		// 判断文件是否为二进制
		isBinary := IsBinaryFile(fileData)

		// 将文件信息入库
		fileRecord := models.FileModel{

			FileName:     fileHeader.Filename,
			FileSize:     fileSize,
			Description:  "",
			FileMd5:      md5String,
			ISBinaryFile: isBinary,
			Tags:         tags,
		}

		if err := global.DB.Create(&fileRecord).Error; err != nil {
			res.FailWithMessage(fmt.Sprintf("保存文件信息失败: %v", err), c)
			return
		}
		// 将文件数据入库
		fileDataModel := models.FileDataModel{
			FileID: fileRecord.ID,
			Data:   fileData,
		}
		if err := global.DB.Create(&fileDataModel).Error; err != nil {
			res.FailWithMessage(fmt.Sprintf("保存文件内容失败: %v", err), c)
			return
		}
		// 更新 FileDataID 为 fileDataModel.ID
		fileRecord.FileDataID = fileDataModel.ID

		// 更新文件记录，以存储 FileDataID
		if err := global.DB.Save(&fileRecord).Error; err != nil {
			res.FailWithMessage(fmt.Sprintf("更新文件信息失败: %v", err), c)
			return
		}
	}

	res.OkWithMessage("文件上传成功", c)
}
