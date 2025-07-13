# 🚀 部署指南

本项目是纯前端应用，支持多种部署方式。

## 📦 本地部署

### 方式1: 一键启动（推荐）

```bash
# macOS/Linux
./start.sh

# Windows
start.bat
```

### 方式2: 手动启动

```bash
# 1. 构建数据
node build-data.js

# 2. 启动HTTP服务器
cd src
python3 -m http.server 8080

# 3. 访问应用
# http://localhost:8080
```

## 🌐 静态网站部署

由于是纯前端应用，可以部署到任何静态网站托管平台：

### GitHub Pages

1. **构建数据**
   ```bash
   node build-data.js
   ```

2. **提交代码**
   ```bash
   git add .
   git commit -m "Deploy static universe"
   git push origin main
   ```

3. **配置GitHub Pages**
   - 进入仓库Settings → Pages
   - Source选择"Deploy from a branch"
   - Branch选择"main"，文件夹选择"/ (root)"

4. **访问应用**
   - 地址: `https://yourusername.github.io/IStar/src/`

### Netlify

1. **构建数据**
   ```bash
   node build-data.js
   ```

2. **部署方式A: 拖拽部署**
   - 将 `src/` 文件夹拖拽到 Netlify 部署页面

3. **部署方式B: Git 连接**
   - 连接GitHub仓库
   - 构建设置:
     - Build command: `node build-data.js`
     - Publish directory: `src`

### Vercel

1. **构建数据**
   ```bash
   node build-data.js
   ```

2. **创建 vercel.json**
   ```json
   {
     "buildCommand": "node build-data.js",
     "outputDirectory": "src",
     "functions": {},
     "rewrites": [
       { "source": "/(.*)", "destination": "/src/$1" }
     ]
   }
   ```

3. **部署**
   ```bash
   npx vercel --prod
   ```

### 阿里云OSS / 腾讯云COS

1. **构建数据**
   ```bash
   node build-data.js
   ```

2. **上传文件**
   - 将 `src/` 目录下所有文件上传到OSS/COS
   - 设置静态网站托管
   - 设置默认首页为 `index.html`

## 🐳 Docker 部署

### Dockerfile

```dockerfile
# 多阶段构建
FROM node:16-alpine AS builder

WORKDIR /app
COPY . .
RUN node build-data.js

FROM nginx:alpine
COPY --from=builder /app/src /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 构建和运行

```bash
# 构建镜像
docker build -t mind-universe .

# 运行容器
docker run -d -p 8080:80 mind-universe

# 访问应用
# http://localhost:8080
```

## ☁️ 云平台部署

### AWS S3 + CloudFront

1. **构建数据**
   ```bash
   node build-data.js
   ```

2. **上传到S3**
   ```bash
   aws s3 sync src/ s3://your-bucket-name/ --delete
   ```

3. **配置CloudFront分发**

### Azure Static Web Apps

```yaml
# .github/workflows/azure-static-web-apps.yml
name: Azure Static Web Apps CI/CD

on:
  push:
    branches: [ main ]

jobs:
  build_and_deploy_job:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Build
      run: |
        node build-data.js
    - name: Deploy
      uses: Azure/static-web-apps-deploy@v1
      with:
        azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
        repo_token: ${{ secrets.GITHUB_TOKEN }}
        action: "upload"
        app_location: "src"
        api_location: ""
        output_location: ""
```

## 🔧 自动化部署

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy Mind Universe

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout
      uses: actions/checkout@v2
      
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
        
    - name: Build data
      run: node build-data.js
      
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./src
```

## 📝 注意事项

### 1. 数据更新
- 每次添加新文档后，需要重新运行 `node build-data.js`
- 建议设置自动化脚本定期更新数据

### 2. CORS 问题
- 本地开发时必须通过HTTP服务器访问，不能直接打开HTML文件
- 部署到生产环境通常不会有CORS问题

### 3. 文件大小
- 如果文章内容很大，考虑实施懒加载
- 可以将文章内容单独存储，点击时再加载

### 4. SEO 优化
- 考虑添加meta标签和sitemap
- 可以预渲染关键页面提升SEO

## 🔒 安全考虑

- 不要在文档中包含敏感信息
- 考虑添加访问控制（如果需要）
- 定期更新依赖库

---

选择最适合你的部署方式，享受知识宇宙的探索！🌌 