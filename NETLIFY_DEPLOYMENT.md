# Netlify 部署指南

## 项目概述
这是一个使用 React + Vite + Supabase 的项目管理系统，配置了自动化的 Netlify 部署流程。

## 部署前准备

### 1. 创建 Netlify 账户
1. 访问 [Netlify](https://www.netlify.com)
2. 注册账户（建议使用 GitHub 账户登录）
3. 创建新站点

### 2. 准备代码仓库
1. 将项目代码推送到 GitHub 仓库
2. 确保包含所有必要的文件：
   - `netlify.toml` (部署配置)
   - `package.json` (依赖管理)
   - `dist/` 构建目录 (由构建命令生成)

### 3. 配置环境变量
在 Netlify 控制台中设置以下环境变量：
- `VITE_SUPABASE_URL`: 你的 Supabase 项目 URL
- `VITE_SUPABASE_ANON_KEY`: 你的 Supabase 匿公钥

## 部署方式

### 方式一：通过 Git 仓库自动部署（推荐）

1. **连接 Git 仓库**
   - 在 Netlify 控制台点击 "Add new site" → "Import an existing project"
   - 选择 GitHub (或其他 Git 提供商)
   - 授权 Netlify 访问你的仓库
   - 选择项目仓库

2. **配置构建设置**
   ```
   Build command: npm run build
   Publish directory: dist
   Node version: 18
   ```

3. **设置环境变量**
   - 在 Site settings → Environment variables 中添加
   - 变量名称：`VITE_SUPABASE_URL`
   - 变量名称：`VITE_SUPABASE_ANON_KEY`

4. **部署**
   - Netlify 会自动检测配置并开始首次部署
   - 部署完成后获得网站 URL

### 方式二：手动拖拽部署

1. **本地构建**
   ```bash
   npm install
   npm run build
   ```

2. **拖拽部署**
   - 将 `dist` 文件夹拖拽到 Netlify 部署页面
   - 等待部署完成

### 方式三：使用 Netlify CLI

1. **安装 Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **登录 Netlify**
   ```bash
   netlify login
   ```

3. **部署**
   ```bash
   netlify deploy --prod --dir=dist
   ```

## 部署配置详解

### netlify.toml 文件说明

```toml
[build]
  base = " "
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"
```

- `base`: 构建基础目录
- `command`: 构建命令
- `publish`: 发布目录
- `NODE_VERSION`: 指定 Node.js 版本

### 重定向规则

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

- 确保所有路由都指向 `index.html`（SPA 路由支持）

### 安全头部

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
```

- 增强网站安全性

## 域名配置

### 1. 使用 Netlify 子域名
- 首次部署后自动获得：`https://your-project-name.netlify.app`

### 2. 使用自定义域名
1. 在 Site settings → Domain management 中添加自定义域名
2. 配置 DNS 记录指向 Netlify
3. 等待 SSL 证书自动配置

## CI/CD 配置

### 自动部署触发条件
- 推送到 `main` 分支 → 生产环境部署
- 推送到其他分支 → 预览部署
- Pull Request → 预览部署

### 分支部署配置
```toml
[context.deploy-preview.environment]
  VITE_SUPABASE_URL = "@supabase_url"

[context.branch-deploy.environment]
  VITE_SUPABASE_URL = "@supabase_url"
```

## 性能优化

### 构建优化
- 代码分割：Vite 自动进行
- 资源压缩：启用 Gzip 压缩
- 缓存策略：静态资源长期缓存

### Netlify 优化
- 启用 Netlify Analytics
- 配置边缘函数（如需要）
- 使用 Netlify Forms（如需要）

## 监控和日志

### 1. 部署日志
- 查看 Netlify 控制台的部署日志
- 检查构建错误和警告

### 2. 函数日志
- Functions 执行日志
- 错误追踪和调试

### 3. 性能监控
- Lighthouse 评分
- Core Web Vitals
- 网站性能指标

## 故障排除

### 常见问题

1. **构建失败**
   - 检查 `package.json` 中的构建脚本
   - 确认 Node.js 版本兼容性
   - 查看构建日志中的错误信息

2. **环境变量问题**
   - 确认环境变量名称正确（VITE_ 前缀）
   - 检查变量值是否正确设置

3. **路由问题**
   - 确认 `netlify.toml` 中的重定向规则
   - 检查 React Router 配置

4. **API 连接问题**
   - 验证 Supabase URL 和密钥
   - 检查 CORS 配置

### 调试技巧

1. **本地预览**
   ```bash
   netlify dev
   ```

2. **查看部署详情**
   - Netlify 控制台 → Deploys
   - 查看具体的构建步骤和错误

3. **使用 Netlify CLI**
   ```bash
   netlify status
   netlify logs
   ```

## 回滚操作

### 方法一：通过控制台
1. 进入 Deploys 页面
2. 找到之前的稳定版本
3. 点击 "Publish deploy"

### 方法二：使用 CLI
```bash
netlify rollback
```

### 方法三：Git 回滚
```bash
git revert HEAD
git push origin main
```

## 维护和更新

### 定期维护任务
1. 更新依赖包
2. 监控构建时间
3. 检查安全漏洞
4. 优化性能指标

### 更新流程
1. 在本地测试新功能
2. 创建分支进行开发
3. 提交 Pull Request
4. 代码审查
5. 合并到主分支
6. 自动部署到生产环境

## 扩展功能

### 可集成的 Netlify 服务
- **Netlify Forms**: 表单处理
- **Netlify Functions**: 无服务器函数
- **Netlify Identity**: 用户认证
- **Netlify Analytics**: 访问分析
- **Netlify Edge Functions**: 边缘计算

### 高级配置
- 多环境部署
- 分支策略
- 自动化测试集成
- 缓存策略优化