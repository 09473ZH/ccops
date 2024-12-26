package main

import (
	"agent/query"
	"encoding/json"
	"fmt"
)

func main() {
	// info, err := query.RunQuery("select * from system_info")
	info, err := query.QueryHostDetailInfo()
	if err != nil {
		fmt.Println(err)
	}
	jsonData, err := json.MarshalIndent(info, "", "  ")
	if err != nil {
		fmt.Println(err)
	}
	fmt.Println(string(jsonData))
}
