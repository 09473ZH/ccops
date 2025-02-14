package labels_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"github.com/gin-gonic/gin"
)

func (LabelApi) HostLabelList(c *gin.Context) {
	var labelList []models.LabelModel
	global.DB.Find(&labelList)

	res.OkWithList(labelList, int64(len(labelList)), c)

}
