# 快速开始指南

## 🚀 5分钟启动项目

### 步骤 1: 准备环境
```bash
# 确保 Node.js 18+ 已安装
node --version

# 克隆项目
git clone <your-repo-url>
cd project-management-system
```

### 步骤 2: 安装依赖
```bash
npm install
```

### 步骤 3: 配置 Supabase
1. 访问 [Supabase](https://supabase.com) 创建新项目
2. 在项目设置中获取：
   - Project URL
   - `anon` public key

3. 创建环境文件：
```bash
cp .env.example .env.local
```

4. 编辑 `.env.local`：
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 步骤 4: 设置数据库
在 Supabase Dashboard 的 SQL Editor 中依次执行：

```sql
-- 1. 创建项目表
-- (复制 supabase/migrations/001_create_projects_table.sql 的内容)

-- 2. 创建任务表  
-- (复制 supabase/migrations/002_create_tasks_table.sql 的内容)

-- 3. 创建用户资料表
-- (复制 supabase/migrations/003_create_user_profiles_table.sql 的内容)

-- 4. 创建函数和触发器
-- (复制 supabase/migrations/004_create_functions_and_triggers.sql 的内容)
```

### 步骤 5: 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000

### 步骤 6: 测试功能
1. 注册新用户
2. 创建第一个项目
3. 添加一些任务
4. 测试各种功能

## 🌐 部署到生产环境

### 使用 Netlify（推荐）
1. 推送代码到 GitHub
2. 在 [Netlify](https://netlify.com) 创建新站点
3. 连接 GitHub 仓库
4. 设置环境变量：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. 点击部署

### 手动部署
```bash
# 构建项目
npm run build

# 使用 Netlify CLI
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

## 🆘 常见问题

### Q: 注册时收到错误？
A: 检查 Supabase Auth 设置，确保邮箱认证已启用。

### Q: 数据无法保存？
A: 确认：
1. 环境变量配置正确
2. 数据库表已创建
3. RLS 策略已设置

### Q: 构建失败？
A: 检查：
1. Node.js 版本 (需要 18+)
2. 依赖是否完整安装
3. 环境变量是否正确

## 📚 更多资源

- [完整文档](./README.md)
- [Supabase 设置](./SUPABASE_SETUP.md)  
- [Netlify 部署](./NETLIFY_DEPLOYMENT.md)
- [项目结构](./PROJECT_STRUCTURE.md)

## 🤝 需要帮助？

1. 查看项目 Issues
2. 阅读 Supabase 文档
3. 联系项目维护者

---

**开始使用你的项目管理系统吧！** 🎉