package role_revision_api

import (
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"github.com/gin-gonic/gin"
)

type RevisionFlushRequest struct {
	TaskContent    string `json:"taskContent"`
	HandlerContent string `json:"handlerContent"`
	VarContent     string `json:"varContent"`
	FilesList      []uint `json:"filesList"`
}

func (RoleRevisionApi) RevisionFlush(c *gin.Context) {
	revisionId := c.Param("id")
	var cr RevisionFlushRequest
	if err := c.ShouldBindJSON(&cr); err != nil {
		res.FailWithMessage("参数错误", c)
		return
	}
	tx := global.DB.Begin()
	// 查找需要更新的 RoleRevision 记录
	var roleRevision models.RoleRevisionModel
	err := global.DB.Take(&roleRevision, revisionId).Error
	if err != nil {
		res.FailWithMessage("版本不存在", c)
		return
	}
	if roleRevision.IsRelease {
		// 如果已经锁定，则不能更改
		res.FailWithMessage("版本已经锁定", c)
		return
	}

	// 处理 FilesList，查找对应的文件
	var fileModelList []models.FileModel
	if len(cr.FilesList) > 0 {
		err := tx.Model(&models.RevisionFile{}).Where("role_revision_model_id = ?", revisionId).Delete(&models.RevisionFile{}).Error
		if err != nil {
			tx.Rollback()
			res.FailWithMessage("更新失败", c)
		}
		global.DB.Find(&fileModelList, cr.FilesList)
		if len(cr.FilesList) != len(fileModelList) {
			res.FailWithMessage("文件选择不一致", c)
			return
		}

		//playbookContent := fmt.Sprintf("---\n- name: %s\n  ansible.builtin.copy: : %s\n	  src: {{item.src}}\n		dest: /root/\n	loop    - %s",
		//	"tmp",
		//	req.TaskName,
		//	strings.Join(roles, "\n    - "))

		roleRevision.TaskContent = cr.TaskContent
		roleRevision.HandlerContent = cr.HandlerContent
		roleRevision.VarContent = cr.VarContent

		roleRevision.Files = fileModelList
	}

	// 开启事务更新

	// 更新 RoleRevision 主表数据
	if err := tx.Model(&roleRevision).Updates(map[string]interface{}{

		"task_content":    cr.TaskContent,
		"handler_content": cr.HandlerContent,
		"var_content":     cr.VarContent,
	}).Error; err != nil {
		tx.Rollback()
		res.FailWithMessage("更新失败", c)
		return
	}

	// 提交事务
	tx.Commit()

	res.OkWithMessage("更新成功", c)

}
