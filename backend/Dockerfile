# 第一阶段：构建 Go 应用
FROM crpi-dw5in7pmnyiap9vp.cn-beijing.personal.cr.aliyuncs.com/changsheng1/zjq:golang-1.21 AS builder
LABEL stage=gobuilder

ENV CGO_ENABLED 0
ENV GOPROXY https://goproxy.cn,direct
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# 设置工作目录
WORKDIR /ccop_server

# 将 Go 模块文件复制到容器中并下载依赖
COPY go.mod .
COPY go.sum .
COPY . .

# 只复制 conf_yaml 目录
COPY config/conf_yaml /ccop_server/config/conf_yaml

RUN go mod tidy
# 构建 Go 应用
RUN go build -o ccops
# 第二阶段：使用你自己的 Python 3.10 镜像
FROM ccr.ccs.tencentyun.com/corgi/python:3.10-slim


# 设置国内的 pip 源
RUN pip config set global.index-url https://mirrors.bfsu.edu.cn/pypi/web/simple
# 安装 Ansible 和 SSH 客户端
RUN apt update
RUN apt install -y openssh-client
RUN pip install --no-cache --upgrade pip setuptools
RUN pip install --no-cache ansible==9.10.0

# 设置工作目录
WORKDIR /root/

# 从构建阶段复制二进制文件和配置文件
COPY --from=builder /ccop_server/ccops .
COPY --from=builder /ccop_server/config/conf_yaml /root/config/conf_yaml

# 设置容器启动时运行的命令
CMD ["./ccops"]
