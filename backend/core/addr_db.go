package core

import (
	"ccops/flags"
	"fmt"
	"os"
)

func InitDb() {
	if os.Getenv("CCOPSENV") != "local" {
		flags.DB()
		fmt.Println("Init DB Done")
	}
}
