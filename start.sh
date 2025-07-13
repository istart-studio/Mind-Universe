#!/bin/bash

# 文章宇宙一键启动脚本

echo "🚀 启动文章宇宙..."
echo "=================================="

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 未找到Node.js，请先安装Node.js"
    exit 1
fi

# 检查Python是否安装
if ! command -v python3 &> /dev/null; then
    echo "❌ 未找到Python3，请先安装Python3"
    exit 1
fi

# 构建数据
echo "📊 构建文章数据..."
node build-data.js

if [ $? -ne 0 ]; then
    echo "❌ 数据构建失败！"
    exit 1
fi

echo ""
echo "🌐 启动前端服务器..."

# 进入前端目录并启动服务器
cd src

# 检查端口8080是否被占用
if lsof -i :8080 > /dev/null 2>&1; then
    echo "⚠️  端口8080已被占用，尝试使用端口8081..."
    PORT=8081
else
    PORT=8080
fi

echo "📍 服务器地址: http://localhost:$PORT"
echo "🌌 打开浏览器访问上述地址即可探索文章宇宙！"
echo ""
echo "💡 提示: 按 Ctrl+C 停止服务器"
echo "=================================="

# 启动Python HTTP服务器
python3 -m http.server $PORT 