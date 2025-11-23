#!/bin/bash

# 本地预览脚本 - 项目管理系统

set -e

echo "🔍 启动本地预览服务器..."

# 检查 Node.js 版本
node_version=$(node -v | cut -d'v' -f2)
echo "📦 当前 Node.js 版本: $node_version"

# 检查环境变量文件
if [ ! -f ".env.local" ] && [ ! -f ".env" ]; then
    echo "⚠️  未找到环境变量文件，请复制 .env.example 并配置"
    echo "💡 命令: cp .env.example .env.local"
    echo "然后编辑 .env.local 文件配置 Supabase 信息"
    exit 1
fi

# 安装依赖
echo "📦 检查并安装依赖..."
if [ ! -d "node_modules" ]; then
    npm install
fi

# 启动开发服务器
echo "🌐 启动开发服务器..."
echo "📍 服务器地址: http://localhost:3000"
echo "🔄 支持 Hot Reload"
echo "⚠️  请确保已正确配置 Supabase 环境变量"
echo ""

# 启动 Vite 开发服务器
npm run dev