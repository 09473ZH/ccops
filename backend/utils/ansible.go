package utils

import (
	"regexp"
)

func GetSrcPaths(textContent string) []string {
	var srcPaths []string

	// 正则表达式：查找 loop 内的 src 路径
	loopSrcRegex := regexp.MustCompile(`(?m)-\s*{\s*src:\s*['"]([^'"]+)['"]`)
	loopMatches := loopSrcRegex.FindAllStringSubmatch(textContent, -1)

	// 检查是否有 loop 的 src 路径
	if len(loopMatches) > 0 {
		// 如果有 loop 的匹配项，仅提取 loop 内的 src 路径
		for _, match := range loopMatches {
			if len(match) > 1 {
				srcPaths = append(srcPaths, match[1])
			}
		}
	} else {
		// 如果没有找到 loop 内的路径，则查找主结构中的 src 路径
		mainSrcRegex := regexp.MustCompile(`(?m)src:\s*['"]([^'"]+)['"]`)
		mainSrcMatch := mainSrcRegex.FindStringSubmatch(textContent)
		if len(mainSrcMatch) > 1 {
			srcPaths = append(srcPaths, mainSrcMatch[1])
		}
	}

	return srcPaths
}
