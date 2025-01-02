[English](README.md) | [中文](README.zh-CN.md)

## 开发环境要求

- Node.js >= 18
- pnpm >= 8

## 快速开始

```bash
# 克隆项目
git clone https://github.com/09473ZH/ccops.git

# 进入项目目录
cd ccops/frontend

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build
```

## 项目结构

```
├── frontend/                # 前端项目目录
│   ├── src/                # 源代码
│   │   ├── api/           # API 接口
│   │   ├── components/    # 公共组件
│   │   ├── layouts/       # 布局组件
│   │   ├── pages/         # 页面组件
│   │   ├── store/         # 状态管理
│   │   └── utils/         # 工具函数
│   ├── public/            # 静态资源
│   └── package.json       # 项目配置
```

## Docker 部署

```bash
# 构建镜像
docker build -t ccops-frontend .

# 运行容器
docker run -p 3001:80 ccops-frontend
```

## 开发规范

### Git 提交规范

- `feat`: 新功能
- `fix`: 修复
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试
- `chore`: 构建过程或辅助工具的变动

## 致谢

特别感谢 [slash-admin](https://github.com/d3george/slash-admin) 提供的优秀脚手架。

## 许可证

[MIT License](LICENSE)
