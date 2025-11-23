# Supabase 设置指南

## 项目概述
这是一个使用 Supabase 作为后端数据库的项目管理系统，包含用户认证、项目管理和任务管理功能。

## 数据库表结构

### 1. projects 表
- **用途**: 存储项目信息
- **字段**:
  - `id`: UUID 主键
  - `name`: 项目名称 (必填)
  - `description`: 项目描述 (可选)
  - `status`: 项目状态 (planning, active, completed, archived)
  - `user_id`: 用户ID (外键)
  - `created_at`: 创建时间
  - `updated_at`: 更新时间

### 2. tasks 表
- **用途**: 存储任务信息
- **字段**:
  - `id`: UUID 主键
  - `title`: 任务标题 (必填)
  - `description`: 任务描述 (可选)
  - `status`: 任务状态 (pending, in_progress, completed)
  - `priority`: 任务优先级 (low, medium, high)
  - `project_id`: 所属项目ID (外键)
  - `user_id`: 用户ID (外键)
  - `created_at`: 创建时间
  - `updated_at`: 更新时间
  - `due_date`: 截止日期 (可选)

### 3. user_profiles 表
- **用途**: 存储用户扩展信息
- **字段**:
  - `id`: UUID 主键
  - `user_id`: 用户ID (外键，唯一)
  - `display_name`: 显示名称
  - `bio`: 个人简介
  - `avatar_url`: 头像URL
  - `timezone`: 时区
  - `language`: 语言偏好
  - `created_at`: 创建时间
  - `updated_at`: 更新时间

## 安全策略
所有表都启用了行级安全 (RLS)，确保：
- 用户只能访问自己的数据
- 数据隔离和安全性
- 支持用户认证和授权

## 设置步骤

### 1. 创建 Supabase 项目
1. 访问 [Supabase](https://supabase.com)
2. 创建新项目
3. 选择数据库位置
4. 记录项目 URL 和 API 密钥

### 2. 执行数据库迁移
在 Supabase Dashboard 的 SQL Editor 中执行以下文件：
1. `001_create_projects_table.sql`
2. `002_create_tasks_table.sql`
3. `003_create_user_profiles_table.sql`
4. `004_create_functions_and_triggers.sql`

### 3. 配置认证设置
1. 在 Authentication > Settings 中：
   - 设置站点 URL
   - 配置重定向 URL
   - 启用邮箱认证

2. 在 Authentication > Providers 中：
   - 启用 Email/Password 提供商
   - 根据需要启用其他提供商

### 4. 获取 API 密钥
在 Project Settings > API 中获取：
- Project URL
- `anon` 公钥
- `service_role` 私钥 (仅服务端使用)

### 5. 配置环境变量
在项目根目录创建 `.env.local` 文件：
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## API 使用示例

### 用户认证
```javascript
// 登录
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

// 注册
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    data: { name: 'User Name' }
  }
})
```

### 数据操作
```javascript
// 获取用户项目
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .eq('user_id', user.id)

// 创建项目
const { data, error } = await supabase
  .from('projects')
  .insert([
    { name: 'New Project', user_id: user.id }
  ])
```

## 数据库视图
项目包含两个有用的视图：

### user_stats
提供用户统计信息：
- 总项目数
- 总任务数
- 已完成任务数
- 进行中任务数
- 待处理任务数

### project_stats
提供项目统计信息：
- 项目任务数
- 完成百分比
- 各状态任务分布

## 备份和维护
1. 定期备份数据库
2. 监控数据库性能
3. 更新 Supabase CLI 版本
4. 检查和优化查询性能

## 故障排除

### 常见问题
1. **RLS 权限错误**: 检查安全策略是否正确配置
2. **外键约束错误**: 确保引用的数据存在
3. **认证失败**: 检查环境变量配置

### 调试技巧
1. 使用 Supabase Dashboard 的日志功能
2. 检查网络请求和响应
3. 验证用户认证状态

## 扩展功能
可以考虑添加的功能：
- 文件上传 (Supabase Storage)
- 实时同步 (Realtime)
- 边缘函数 (Edge Functions)
- 数据库函数 (自定义业务逻辑)