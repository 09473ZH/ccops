# Stage 1: build stage
FROM ccr.ccs.tencentyun.com/corgi/node:22-slim as build-stage

# 定义构建参数，默认为开发环境
ARG BUILD_MODE=build

# make the 'app' folder the current working directory
WORKDIR /app

# config node options
ENV NODE_OPTIONS=--max_old_space_size=8192

# config pnpm, install dependencies
COPY package.json pnpm-lock.yaml* ./
RUN npm install pnpm@9.x -g && \
    pnpm install --frozen-lockfile

# copy project files and folders to the current working directory (i.e. 'app' folder)
COPY . ./

# build the project using the build mode argument
RUN pnpm ${BUILD_MODE}
RUN echo "build successful  🎉 🎉 🎉"


# Stage 2: production stage
FROM ccr.ccs.tencentyun.com/corgi/nginx:alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY --from=build-stage /app/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
RUN echo "deploy to nginx successful  🎉 🎉 🎉"

