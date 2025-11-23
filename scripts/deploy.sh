#!/bin/bash

# 部署脚本 - 项目管理系统
# 使用 Netlify CLI 进行部署

set -e

echo "🚀 开始部署项目管理系统..."

# 检查 Node.js 版本
node_version=$(node -v | cut -d'v' -f2)
echo "📦 当前 Node.js 版本: $node_version"

# 检查环境变量
if [ -z "$VITE_SUPABASE_URL" ]; then
    echo "❌ 错误: VITE_SUPABASE_URL 环境变量未设置"
    exit 1
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "❌ 错误: VITE_SUPABASE_ANON_KEY 环境变量未设置"
    exit 1
fi

echo "✅ 环境变量检查通过"

# 安装依赖
echo "📦 安装项目依赖..."
npm ci

# 运行测试 (如果有)
if npm run test --if-present; then
    echo "✅ 测试通过"
else
    echo "⚠️  未找到测试或测试失败，继续部署..."
fi

# 构建项目
echo "🔨 构建项目..."
npm run build

# 检查构建结果
if [ ! -d "dist" ]; then
    echo "❌ 构建失败: dist 目录不存在"
    exit 1
fi

# 检查是否有 index.html
if [ ! -f "dist/index.html" ]; then
    echo "❌ 构建失败: index.html 不存在"
    exit 1
fi

echo "✅ 项目构建成功"

# 部署到 Netlify
if command -v netlify &> /dev/null; then
    echo "🌐 部署到 Netlify..."
    
    # 检查是否已登录
    if ! netlify status &> /dev/null; then
        echo "🔐 请先登录 Netlify:"
        netlify login
    fi
    
    # 部署
    netlify deploy --prod --dir=dist
    
    echo "🎉 部署完成!"
else
    echo "⚠️  Netlify CLI 未安装，请手动部署 dist 目录"
    echo "💡 安装 Netlify CLI: npm install -g netlify-cli"
fi

# 显示部署信息
echo ""
echo "📋 部署信息:"
echo "   - 构建目录: dist/"
echo "   - 环境变量: 已配置"
echo "   - 部署时间: $(date)"
echo "   - Node 版本: $node_version"

echo ""
echo "🔗 相关链接:"
echo "   - Netlify 控制台: https://app.netlify.com"
echo "   - 项目文档: ./NETLIFY_DEPLOYMENT.md"