package models

type HostLabels struct {
	HostModelID  uint `gorm:"primaryKey"`
	LabelModelID uint `gorm:"primaryKey"`
}
