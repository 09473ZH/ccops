# CCOPS
一个管理私有云/公有云主机的运维平台，支持百台内主机的运维。

功能支持：
* 网页跳板机
* 主机批量变更
* CMDB

# 项目结构

```
ccops
├── backend 服务端
├── frontend 前端
├── agent agent端
```

# 技术栈

## 前端
* 构建工具：Vite
* 框架：React
* 语言：TypeScript
* UI 库：Ant Design
* 状态管理：Zustand
* 路由：React Router
* 网络请求：Fetch + React Query
* 样式：Tailwind CSS
* 编辑器：Monaco Editor
* 终端：xterm.js

## 后端
开发：@422949798 @shimada666
* 框架：gin
* ORM：gorm
* 数据库：mysql
* 批量变更：ansible
* 模拟终端：ssh + websocket
* 数据采集：osquery
