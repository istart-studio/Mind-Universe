# 🌌 文章宇宙 - Mind Universe

将你的文档以**3D宇宙**的形式展现，每个文件夹都是一个**星球**，让知识探索变得有趣！

![Demo](https://img.shields.io/badge/状态-纯前端应用-brightgreen) ![License](https://img.shields.io/badge/许可证-MIT-blue)

## ⚡ 一键启动

```bash
# macOS/Linux
./start.sh

# Windows
start.bat
```

> 🎯 **访问:** http://localhost:8080

## ✨ 核心特性

| 特性 | 描述 |
|------|------|
| 🪐 **星球视图** | 每个文件夹 = 一个星球 |
| 🌌 **宇宙探索** | 3D空间自由探索 |
| 📖 **文章球体** | 文章以球形排列 |
| 🎯 **沉浸阅读** | 全屏阅读体验 |
| ✨ **平滑动画** | 流畅的3D过渡 |
| 🔧 **纯前端** | 无需后端，静态部署 |

## 🎮 使用方法

1. **宇宙视图** → 查看所有星球
2. **点击星球** → 进入文章球体
3. **点击文章** → 全屏阅读
4. **鼠标控制** → 拖拽旋转，滚轮缩放

## 📁 快速上手

```bash
# 1. 添加你的文档到 doc/ 文件夹
doc/
├── 分布式/        # ← 你的文章分类
├── 并发/
└── ...

# 2. 运行构建脚本
node build-data.js

# 3. 启动应用
./start.sh
```

## 🚀 部署选项

- **📋 [完整部署指南](DEPLOY.md)** - 包含GitHub Pages、Netlify、Docker等
- **🔧 本地开发** - 使用Python HTTP服务器
- **☁️ 静态托管** - 支持所有主流平台

## 🎨 自定义

| 文件 | 用途 |
|------|------|
| `src/css/style.css` | 星球和文章外观 |
| `build-data.js` | 3D布局参数 |
| `src/js/universeRender.js` | 交互逻辑 |

## 🌟 技术架构

**纯前端** • **Three.js** • **静态JSON数据** • **响应式3D**

---

📖 **详细文档**: [DEPLOY.md](DEPLOY.md) | 🌌 **开始探索你的知识宇宙！**
