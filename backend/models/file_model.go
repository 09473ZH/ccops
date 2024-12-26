package models

import "ccops/models/ctype"

type FileModel struct {
	MODEL
	FileName     string      `gorm:"size:128;comment:文件名" json:"fileName"` // 文件名
	FileMd5      string      `gorm:"size:32;comment:文件md5" json:"fileMd5"` // 文件md5
	Description  string      `gorm:"type:text" json:"description"`         // 文件描述
	FileDataID   uint        `gorm:"comment:文件数据id" json:"fileDataId"`     // 文件数据
	FileSize     int64       `gorm:"comment:文件大小（字节）" json:"fileSize"`     // 文件大小
	ISBinaryFile int         `gorm:"comment:是否是二进制文件" json:"isBinaryFile"` // 是否是二进制文件
	Tags         ctype.Array `json:"tags" structs:"tags"`                  // 文章标签列表

	// S3 相关字段
	S3BucketName string              `gorm:"size:128;comment:S3存储桶名称" json:"s3BucketName"` // S3 存储桶名称
	S3ObjectKey  string              `gorm:"size:255;comment:S3对象键" json:"s3ObjectKey"`    // S3 对象键
	DownloadURL  string              `gorm:"size:255;comment:文件下载链接" json:"downloadUrl"`   // 文件下载链接
	Revisions    []RoleRevisionModel `gorm:"many2many:revision_files" json:"revisions"`
}
