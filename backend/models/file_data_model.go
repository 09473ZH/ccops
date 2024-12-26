package models

import "time"

type FileDataModel struct {
	ID        uint      `gorm:"primaryKey;comment:id" json:"id,select($any)"` // 主键ID
	CreatedAt time.Time `gorm:"comment:创建时间" json:"createdAt,select($any)"`   // 创建时间
	UpdatedAt time.Time `gorm:"comment:更新时间" json:"updatedAt"`                // 更新时间
	FileID    uint      `gorm:"comment:文件id" json:"fileId"`                   // 文件id
	Data      []byte    `gorm:"type:mediumblob" json:"fileData"`              //文件数据

}
