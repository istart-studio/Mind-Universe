@echo off
chcp 65001 >nul

REM 文章宇宙一键启动脚本 (Windows版本)

echo 🚀 启动文章宇宙...
echo ==================================

REM 检查Node.js是否安装
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未找到Node.js，请先安装Node.js
    pause
    exit /b 1
)

REM 检查Python是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未找到Python，请先安装Python
    pause
    exit /b 1
)

REM 构建数据
echo 📊 构建文章数据...
node build-data.js

if errorlevel 1 (
    echo ❌ 数据构建失败！
    pause
    exit /b 1
)

echo.
echo 🌐 启动前端服务器...

REM 进入前端目录
cd src

REM 设置端口
set PORT=8080

echo 📍 服务器地址: http://localhost:%PORT%
echo 🌌 打开浏览器访问上述地址即可探索文章宇宙！
echo.
echo 💡 提示: 按 Ctrl+C 停止服务器
echo ==================================

REM 启动Python HTTP服务器
python -m http.server %PORT%

pause 