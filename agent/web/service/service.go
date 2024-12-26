package service

import (
	"agent/web/config"
	"fmt"
)

type Service struct {
	// Add service fields here
}

func NewService(cfg *config.Config) *Service {
	fmt.Println("Initializing service...")
	return &Service{}
}
