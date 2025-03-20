package task_api

import (
	"bufio"
	"ccops/global"
	"ccops/models"
	"ccops/models/res"
	"ccops/utils/jwts"
	"ccops/utils/permission"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var (
	mu        sync.RWMutex // 保护连接的互斥锁
	connMutex sync.Mutex
	dataStore = make(map[uint][]string)
)

type Task struct {
	Output        []string
	ActiveClients map[*websocket.Conn]bool
	Mutex         sync.Mutex
}

var tasks = make(map[uint]*Task)
var tasksMutex sync.Mutex

type TaskCreateRequest struct {
	TaskName              string     `json:"taskName"`
	HostIdList            []uint     `json:"hostIdList"`
	HostLabelList         []uint     `json:"hostLabelList"`
	RoleIDList            []uint     `json:"roleIdList"`
	Type                  string     `json:"type"`
	ShortcutScriptContent string     `json:"shortcutScriptContent"`
	Vars                  []RolesVar `json:"vars"`
}

type RolesVar struct {
	RoleID  uint         `json:"roleId"`
	Content []VarContent `json:"content"`
}

type VarContent struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

// WebSocket 升级器
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // 允许所有来源
	},
}

// 全局变量存储 WebSocket 连接

// 连接管理

// WebSocket 处理函数
func (TaskApi) WebSocketHandler(c *gin.Context) {
	// 升级到 WebSocket
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		fmt.Println("升级 WebSocket 连接失败:", err)
		return
	}
	defer conn.Close()

	taskIDStr := c.Param("id")
	taskID, err := strconv.ParseUint(taskIDStr, 10, 32)
	if err != nil {
		fmt.Println("解析任务ID失败:", err)
		return
	}
	taskIDUint := uint(taskID)

	// 添加日志
	fmt.Printf("WebSocket连接已建立，任务ID: %d\n", taskIDUint)

	tasksMutex.Lock()
	task, exists := tasks[taskIDUint]
	tasksMutex.Unlock()

	if !exists {
		// 添加日志
		fmt.Printf("任务 %d 不存在于tasks map中\n", taskIDUint)
		var result string
		if err := global.DB.Model(&models.TaskModel{}).Where("id = ?", taskID).Select("result").First(&result).Error; err != nil {
			conn.Close()
			return
		}

		// 将 result 字符串按行分割
		lines := strings.Split(result, "\n")
		for _, line := range lines {
			jsonData := map[string]interface{}{
				"message": line,
				"event":   "progress", // 事件标识，执行过程中可以一直用 "task_update"
				"taskID":  taskID,
			}

			jsonBytes, _ := json.Marshal(jsonData)
			if err := conn.WriteMessage(websocket.TextMessage, jsonBytes); err != nil {
				conn.Close()
				return
			}
		}
		jsonData := map[string]interface{}{
			"message": "Task completed",
			"event":   "end", // 事件标识，执行过程中可以一直用 "task_update"
			"taskID":  taskID,
		}
		jsonBytes, _ := json.Marshal(jsonData)
		if err := conn.WriteMessage(websocket.TextMessage, jsonBytes); err != nil {
			conn.Close()
			return
		}

	} else {
		task.Mutex.Lock()
		task.ActiveClients[conn] = true
		for _, line := range task.Output {
			jsonData := map[string]interface{}{
				"message": line,
				"event":   "progress", // 事件标识，执行过程中可以一直用 "task_update"
				"taskID":  taskID,
			}

			jsonBytes, _ := json.Marshal(jsonData)
			if err := conn.WriteMessage(websocket.TextMessage, jsonBytes); err != nil {
				conn.Close()
				delete(task.ActiveClients, conn)
				task.Mutex.Unlock()
				return
			}
		}
		task.Mutex.Unlock()
	}

	defer func() {
		task.Mutex.Lock()
		delete(task.ActiveClients, conn)
		task.Mutex.Unlock()
		conn.Close()
	}()

	for {
		if _, _, err := conn.ReadMessage(); err != nil {
			break
		}
	}

}

func (TaskApi) TaskCreateView(c *gin.Context) {
	_claims, _ := c.Get("claims")
	claims := _claims.(*jwts.CustomClaims)
	var req TaskCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		res.FailWithCode(res.ArgumentError, c)
		return
	}
	if !permission.IsPermissionForHosts(claims.UserID, req.HostIdList) {
		res.FailWithMessage("权限错误", c)
		return
	}

	if req.Type == "playbook" {
		// 开启事务
		tx := global.DB.Begin()
		type RoleVarContent struct {
			RoleID         uint         `json:"roleId"`
			RoleRevisionID uint         `json:"roleRevisionId"`
			RoleName       string       `json:"roleName"`
			Content        []VarContent `json:"content"`
		}
		type RoleDetails struct {
			RoleIdList     []uint           `json:"roleIdList"`
			RoleVarContent []RoleVarContent `json:"roleVarContent"`
		}
		var taskRoleDetail RoleDetails
		//查找主机ip

		taskRoleDetail.RoleIdList = req.RoleIDList
		var roleVarContent []RoleVarContent
		for _, rolesVar := range req.Vars {
			var roleDetail RoleVarContent
			roleDetail.RoleID = rolesVar.RoleID
			tx.Model(&models.RoleRevisionModel{}).Where("role_id = ? AND is_active = ?", rolesVar.RoleID, true).Select("id").First(&roleDetail.RoleRevisionID)
			tx.Model(&models.RoleModel{}).Where("id = ?", rolesVar.RoleID).Select("name").First(&roleDetail.RoleName)
			roleDetail.Content = rolesVar.Content

			roleVarContent = append(roleVarContent, roleDetail)
		}
		taskRoleDetail.RoleVarContent = roleVarContent
		jsonTaskRoleDetail, err := json.Marshal(taskRoleDetail)
		if err != nil {
			tx.Rollback()
			res.FailWithError(err, "转json错误", c)
			return
		}
		// 创建任务
		task := models.TaskModel{
			TaskName:    req.TaskName,
			Type:        req.Type,
			Result:      "",
			RoleDetails: jsonTaskRoleDetail,
			UserID:      claims.UserID,
		}
		if err := tx.Debug().Create(&task).Error; err != nil {
			res.FailWithMessage("创建任务失败", c)
			tx.Rollback()

			return
		}

		// 获取每个角色的激活版本
		var activeRevisions []models.RoleRevisionModel
		tx.Debug().Where("role_id IN ? AND is_active = ?", req.RoleIDList, true).Find(&activeRevisions)

		if len(activeRevisions) != len(req.RoleIDList) {
			res.FailWithMessage("包含未打包软件", c)
			tx.Rollback()
			return
		}

		// 创建任务关联
		var taskAssociations []models.TaskAssociationModel
		for _, revision := range activeRevisions {

			taskAssociations = append(taskAssociations, models.TaskAssociationModel{
				TaskID:     task.ID,
				RoleID:     revision.RoleID,
				RevisionID: revision.ID,
			})
		}
		if err := tx.Debug().Create(&taskAssociations).Error; err != nil {
			res.FailWithMessage("创建任务关联失败", c)
			tx.Rollback()

			return
		}

		// 创建目标关联
		var targetAssociations []models.TargetAssociationModel
		var hostIPs []models.HostModel
		if err := tx.Debug().Where("id IN ?", req.HostIdList).Find(&hostIPs).Error; err != nil {
			res.FailWithMessage("获取主机IP失败", c)
			tx.Rollback()

			return
		}
		for _, host := range hostIPs {
			targetAssociations = append(targetAssociations, models.TargetAssociationModel{
				TaskID: task.ID,
				HostIP: host.HostServerUrl,
			})
		}
		if err := tx.Debug().Create(&targetAssociations).Error; err != nil {
			res.FailWithMessage("创建目标关联失败", c)
			tx.Rollback()

			return
		}

		// 提交事务
		if err := tx.Debug().Commit().Error; err != nil {
			res.FailWithMessage("任务创建失败", c)
			tx.Rollback()

			return
		}

		res.OkWithData(task.ID, c)

		taskWs := &Task{
			ActiveClients: make(map[*websocket.Conn]bool),
		}
		tasksMutex.Lock()
		tasks[task.ID] = taskWs
		tasksMutex.Unlock()
		// 使用全局 WebSocket 连接
		connMutex.Lock()
		defer connMutex.Unlock()

		go taskWs.createAndExecutePlaybook(req.RoleIDList, req, task.ID)
	} else if req.Type == "ad-hoc" {
		// 开启事务
		tx := global.DB.Begin()

		// 创建任务
		task := models.TaskModel{
			TaskName:              req.TaskName,
			Type:                  req.Type,
			ShortcutScriptContent: req.ShortcutScriptContent,
			Result:                "",
			UserID:                claims.UserID,
		}
		if err := tx.Debug().Create(&task).Error; err != nil {
			res.FailWithMessage("创建任务失败", c)
			tx.Rollback()

			return
		}
		// 创建目标关联
		var targetAssociations []models.TargetAssociationModel
		var hostIPs []models.HostModel
		if err := tx.Debug().Where("id IN ?", req.HostIdList).Find(&hostIPs).Error; err != nil {
			res.FailWithMessage("获取主机IP失败", c)
			tx.Rollback()

			return
		}
		for _, host := range hostIPs {
			targetAssociations = append(targetAssociations, models.TargetAssociationModel{
				TaskID: task.ID,
				HostIP: host.HostServerUrl,
			})
		}
		if err := tx.Debug().Create(&targetAssociations).Error; err != nil {
			res.FailWithMessage("创建目标关联失败", c)
			tx.Rollback()

			return
		}

		// 提交事务
		if err := tx.Debug().Commit().Error; err != nil {
			res.FailWithMessage("任务创建失败", c)
			tx.Rollback()

			return
		}
		res.OkWithData(task.ID, c)

		taskWs := &Task{
			ActiveClients: make(map[*websocket.Conn]bool),
		}
		tasksMutex.Lock()
		tasks[task.ID] = taskWs
		tasksMutex.Unlock()
		// 使用全局 WebSocket 连接
		connMutex.Lock()
		defer connMutex.Unlock()

		go taskWs.ExecuteShortcutScript(req, task.ID)
	}

}

func (t *Task) createAndExecutePlaybook(roleIDs []uint, req TaskCreateRequest, taskID uint) error {
	global.DB.Model(&models.TaskModel{}).Where("id = ?", taskID).Update("status", "running")
	// 创建临时目录
	tempDir := "./ansible/roles"
	if err := os.MkdirAll(tempDir, os.ModePerm); err != nil {
		return fmt.Errorf("创建目录失败: %w", err)
	}

	CreateInventoryFile(req)

	// 创建 ansible.cfg 文件来配置 SSH 选项
	ansibleCfg := `[defaults]
private_key_file = ./.ssh/ccops
host_key_checking = False

[ssh_connection]
pipelining = True
`
	if err := ioutil.WriteFile("./ansible.cfg", []byte(ansibleCfg), 0644); err != nil {
		return fmt.Errorf("创建 ansible.cfg 失败: %w", err)
	}
	defer os.Remove("./ansible.cfg")

	defer os.Remove("./targets")
	defer os.RemoveAll("./ansible")
	// 根据 roleIdList 获取角色名称
	roleMap, err := models.GetRoleNamesByIds(roleIDs)
	if err != nil {
		return fmt.Errorf("获取软件名称失败: %w", err)
	}

	// 获取每个角色的激活版本的任务内容
	var activeRevisions []models.RoleRevisionModel
	if err := global.DB.Where("role_id IN ? AND is_active = ?", roleIDs, true).Find(&activeRevisions).Error; err != nil {
		return fmt.Errorf("获取激活版本失败: %w", err)
	}

	var roles []string // 存储角色名
	for _, revision := range activeRevisions {
		roleName, exists := roleMap[revision.RoleID]
		if !exists {
			continue
		}
		roles = append(roles, roleName)
		roleDir := filepath.Join(tempDir, roleName)

		// 创建角色目录结构
		if err := os.MkdirAll(filepath.Join(roleDir, "tasks"), os.ModePerm); err != nil {
			return fmt.Errorf("创建软件任务目录失败: %w", err)
		}
		if err := os.MkdirAll(filepath.Join(roleDir, "vars"), os.ModePerm); err != nil {
			return fmt.Errorf("创建软件变量目录失败: %w", err)
		}

		// 处理vars文件
		varsFilePath := filepath.Join(roleDir, "vars", "main.yml")
		varsContent := "---\n"

		// 查找对应角色的变量
		for _, roleVar := range req.Vars {
			if roleVar.RoleID == revision.RoleID {
				for _, v := range roleVar.Content {
					varsContent += fmt.Sprintf("%s: \"%s\"\n", v.Key, v.Value)
				}
				break
			}
		}

		// 只有当有变量内容时才写入文件
		if len(varsContent) > 4 {
			if err := ioutil.WriteFile(varsFilePath, []byte(varsContent), 0644); err != nil {
				return fmt.Errorf("写入变量文件失败: %w", err)
			}
		}

		// 写入任务文件
		taskFilePath := filepath.Join(roleDir, "tasks", "main.yml")
		if err := ioutil.WriteFile(taskFilePath, []byte(revision.TaskContent), 0644); err != nil {
			return fmt.Errorf("写入任务文件失败: %w", err)
		}

		// 处理文件
		var fileIds []uint
		global.DB.Debug().Model(&models.RevisionFile{}).Where("role_revision_model_id = ? ", revision.ID).Select("file_model_id").Find(&fileIds)
		if len(fileIds) > 0 {
			filesDir := filepath.Join(roleDir, "files")
			if err := os.MkdirAll(filesDir, os.ModePerm); err != nil {
				return fmt.Errorf("创建文件目录失败: %w", err)
			}

			for _, fileId := range fileIds {
				var file models.FileModel
				if err := global.DB.Debug().Model(&models.FileModel{}).Where("id = ?", fileId).First(&file).Error; err != nil {
					return fmt.Errorf("获取文件信息失败: %w", err)
				}

				filePath := filepath.Join(filesDir, file.FileName)

				if file.ISBinaryFile == 1 {
					var fileContent []byte
					if err := global.DB.Debug().Model(&models.FileDataModel{}).Where("file_id = ?", file.ID).Select("data").First(&fileContent).Error; err != nil {
						return fmt.Errorf("获取文件内容失败: %w", err)
					}
					if err := ioutil.WriteFile(filePath, fileContent, 0644); err != nil {
						return fmt.Errorf("写入二进制文件失败: %w", err)
					}
				} else {
					var fileContent string
					if err := global.DB.Debug().Model(&models.FileDataModel{}).Where("file_id = ?", file.ID).Select("data").First(&fileContent).Error; err != nil {
						return fmt.Errorf("获取文件内容失败: %w", err)
					}
					if err := ioutil.WriteFile(filePath, []byte(fileContent), 0644); err != nil {
						return fmt.Errorf("写入文本文件失败: %w", err)
					}
				}
			}
		}
	}

	// 创建 playbook 文件
	playbookFilePath := filepath.Join(tempDir, "playbook.yml")
	playbookContent := fmt.Sprintf(`---
- hosts: %s
  name: %s
  vars:
%s
  roles:
    - %s`,
		"tmp",
		req.TaskName,
		getVarsContent(roleIDs),
		strings.Join(roles, "\n    - "))

	if err := ioutil.WriteFile(playbookFilePath, []byte(playbookContent), 0644); err != nil {
		return fmt.Errorf("写入 playbook 文件失败: %w", err)
	}

	// 使用 io.Pipe 捕获 ansible-playbook 的输出
	r, w := io.Pipe()
	cmd := exec.Command("ansible-playbook", "-i", "targets", playbookFilePath)

	cmd.Stdout = w
	cmd.Stderr = w

	err = cmd.Start()
	if err != nil {
		global.DB.Model(&models.TaskModel{}).Where("id = ?", taskID).Updates(map[string]interface{}{"status": "exception"})
		return fmt.Errorf("执行 playbook 失败: %w", err)
	}

	scanner := bufio.NewScanner(r)

	go func() {
		for scanner.Scan() {
			line := scanner.Text()
			t.Mutex.Lock()
			t.Output = append(t.Output, line)
			for client := range t.ActiveClients {
				jsonData := map[string]interface{}{
					"message": line,
					"event":   "progress",
					"taskID":  taskID,
				}

				jsonBytes, _ := json.Marshal(jsonData)
				if err := client.WriteMessage(websocket.TextMessage, jsonBytes); err != nil {
					client.Close()
					delete(t.ActiveClients, client)
				}
			}
			t.Mutex.Unlock()
		}

		if err := scanner.Err(); err != nil {
			fmt.Println("Error reading from pipe:", err)
		}

		if err := w.Close(); err != nil {
			fmt.Println("Error closing pipe writer:", err)
		}
	}()

	err = cmd.Wait()
	if err != nil {
		global.DB.Model(&models.TaskModel{}).Where("id = ?", taskID).Updates(map[string]interface{}{"status": "fail"})
	}

	doneMessage := "Task completed"
	t.Mutex.Lock()
	t.Output = append(t.Output, doneMessage)
	for client := range t.ActiveClients {
		jsonData := map[string]interface{}{
			"message": doneMessage,
			"event":   "end",
			"taskID":  taskID,
		}

		jsonBytes, _ := json.Marshal(jsonData)
		if err := client.WriteMessage(websocket.TextMessage, jsonBytes); err != nil {
			client.Close()
			delete(t.ActiveClients, client)
		}
	}
	t.Mutex.Unlock()

	t.Output = t.Output[:len(t.Output)-1]
	result := strings.Join(t.Output, "\n")
	global.DB.Model(&models.TaskModel{}).Where("id = ?", taskID).Updates(map[string]interface{}{
		"result": result,
		"status": "done",
	})
	delete(tasks, taskID)

	return nil
}

func (t *Task) ExecuteShortcutScript(req TaskCreateRequest, taskID uint) error {
	global.DB.Model(&models.TaskModel{}).Where("id = ?", taskID).Update("status", "running")

	CreateInventoryFile(req)

	defer os.Remove("./targets")

	// 使用 io.Pipe 捕获 ansible-playbook 的输出
	// 使用 io.Pipe 捕获 ansible-playbook 的输出
	r, w := io.Pipe()
	cmd := exec.Command("ansible", "all", "-i", "targets", "-m", "shell", "-a", req.ShortcutScriptContent, "--ssh-extra-args='-o StrictHostKeyChecking=no'")

	// 将 cmd 的标准输出和错误输出重定向到 w
	cmd.Stdout = w
	cmd.Stderr = w

	// 异步执行 ansible-playbook 命令
	err := cmd.Start()
	if err != nil {
		global.DB.Model(&models.TaskModel{}).Where("id = ?", taskID).Updates(map[string]interface{}{"status": "exception"})
		return fmt.Errorf("执行 ad-hoc 失败: %w", err)
	}

	// 创建一个 Scanner 来逐行读取输出

	scanner := bufio.NewScanner(r)

	// 在 goroutine 中逐行读取输出
	go func() {
		for scanner.Scan() {
			line := scanner.Text()
			t.Mutex.Lock()
			t.Output = append(t.Output, line)

			for client := range t.ActiveClients {
				jsonData := map[string]interface{}{
					"message": line,
					"event":   "progress",
					"taskID":  taskID,
				}

				jsonBytes, _ := json.Marshal(jsonData)
				if err := client.WriteMessage(websocket.TextMessage, jsonBytes); err != nil {
					client.Close()
					delete(t.ActiveClients, client)
				}
			}
			t.Mutex.Unlock()
		}

		if err := scanner.Err(); err != nil {
			fmt.Println("Error reading from pipe:", err)
		}

		// 关闭管道写入端
		if err := w.Close(); err != nil {
			fmt.Println("Error closing pipe writer:", err)
		}
	}()
	err = cmd.Wait()
	if err != nil {
		global.DB.Model(&models.TaskModel{}).Where("id = ?", taskID).Updates(map[string]interface{}{"status": "fail"})
	}
	doneMessage := "Task completed"
	t.Mutex.Lock()
	t.Output = append(t.Output, doneMessage)
	for client := range t.ActiveClients {
		jsonData := map[string]interface{}{
			"message": doneMessage,
			"event":   "end", // 事件标识，执行过程中可以一直用 "task_update"
			"taskID":  taskID,
		}

		jsonBytes, _ := json.Marshal(jsonData)
		if err := client.WriteMessage(websocket.TextMessage, jsonBytes); err != nil {
			client.Close()
			delete(t.ActiveClients, client)
		}
	}
	// 任务完成后发送通知

	t.Mutex.Unlock()

	t.Output = t.Output[:len(t.Output)-1] // 取到倒数第二个元素
	result := strings.Join(t.Output, "\n")
	global.DB.Model(&models.TaskModel{}).Where("id = ?", taskID).Updates(map[string]interface{}{
		"result": result,
		"status": "done",
	})
	delete(tasks, taskID)

	return nil
}

// 创建inventory文件,固定写死只有一个[tmp]标签，判断前端传来的请求体，有三种情况
// 1.只有hostIdList，没有hostLabelList，2.只有hostLabelList，没有hostIdList，3.都有
// 有hostLabelList的时候，需要多查一层，根据这个查到hostID 并根据hostID查到HostServerUrl 这个就是最终写入文件的地址
func CreateInventoryFile(req TaskCreateRequest) error {
	// 用于存储最终的主机信息
	type HostInfo struct {
		IP       string
		Hostname string
	}
	var hostInfos []HostInfo
	hostInfoSet := make(map[string]HostInfo)

	// 处理 hostIdList
	if len(req.HostIdList) > 0 {
		var hosts []models.HostModel
		if err := global.DB.Where("id IN ?", req.HostIdList).Find(&hosts).Error; err != nil {
			return fmt.Errorf("获取主机信息失败: %w", err)
		}
		for _, host := range hosts {
			hostInfoSet[host.HostServerUrl] = HostInfo{
				IP:       host.HostServerUrl,
				Hostname: host.Name,
			}
		}
	}

	// 处理 hostLabelList
	if len(req.HostLabelList) > 0 {
		var hostLabels []models.HostLabels
		if err := global.DB.Where("label_model_id IN ?", req.HostLabelList).Find(&hostLabels).Error; err != nil {
			return fmt.Errorf("获取主机标签信息失败: %w", err)
		}

		var hostIds []uint
		for _, hl := range hostLabels {
			hostIds = append(hostIds, hl.HostModelID)
		}

		var hosts []models.HostModel
		if err := global.DB.Where("id IN ?", hostIds).Find(&hosts).Error; err != nil {
			return fmt.Errorf("获取主机信息失败: %w", err)
		}
		for _, host := range hosts {
			hostInfoSet[host.HostServerUrl] = HostInfo{
				IP:       host.HostServerUrl,
				Hostname: host.Name,
			}
		}
	}

	// 将去重后的主机信息添加到列表中
	for _, info := range hostInfoSet {
		hostInfos = append(hostInfos, info)
	}

	// 创建 inventory 文件
	inventoryContent := "[tmp]\n"
	for _, info := range hostInfos {
		inventoryContent += fmt.Sprintf("%s ansible_host=%s ansible_user=root ansible_ssh_private_key_file=~/.ssh/ccops\n",
			info.Hostname,
			info.IP)
	}

	inventoryFilePath := "./targets"
	if err := ioutil.WriteFile(inventoryFilePath, []byte(inventoryContent), 0644); err != nil {
		return fmt.Errorf("写入 inventory 文件失败: %w", err)
	}

	return nil
}

func getVarsContent(roleIDs []uint) string {
	var varsContent string
	var activeRevisions []models.RoleRevisionModel

	if err := global.DB.Where("role_id IN ? AND is_active = ?", roleIDs, true).Find(&activeRevisions).Error; err != nil {
		return ""
	}

	// 合并所有角色的变量内容
	for _, revision := range activeRevisions {
		if revision.VarContent != "" {
			// 确保每个变量缩进正确
			lines := strings.Split(revision.VarContent, "\n")
			for _, line := range lines {
				varsContent += "    " + line + "\n" // 添加两个空格的缩进
			}
		}
	}

	return varsContent
}
