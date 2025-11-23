-- 完整数据库设置脚本
-- 按顺序执行所有必要的表创建和配置

-- 1. 设置数据库时区
SET timezone = 'Asia/Shanghai';

-- 2. 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 3. 创建枚举类型
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
        CREATE TYPE project_status AS ENUM ('planning', 'active', 'completed', 'archived');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
        CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority') THEN
        CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
    END IF;
END $$;

-- 4. 创建用户资料表
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    display_name VARCHAR(255),
    bio TEXT,
    avatar_url TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'zh-CN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 创建项目表
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'archived')),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 创建任务表
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE
);

-- 7. 创建索引
-- 用户资料表索引
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- 项目表索引
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);

-- 任务表索引
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- 8. 创建更新时间戳的函数
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 9. 创建触发器
-- 用户资料表触发器
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_updated_at_column();

-- 项目表触发器
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_updated_at_column();

-- 任务表触发器
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_updated_at_column();

-- 10. 启用行级安全
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 11. 创建 RLS 策略

-- 用户资料表策略
CREATE POLICY IF NOT EXISTS "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own profile" ON user_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- 项目表策略
CREATE POLICY IF NOT EXISTS "Users can view their own projects" ON projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- 任务表策略
CREATE POLICY IF NOT EXISTS "Users can view their own tasks" ON tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own tasks" ON tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own tasks" ON tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own tasks" ON tasks
    FOR DELETE USING (auth.uid() = user_id);

-- 12. 创建触发器：自动创建用户资料
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, display_name)
    VALUES (new.id, new.raw_user_meta_data->>'name');
    RETURN new;
END;
$$;

-- 创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 13. 创建视图
-- 用户统计视图
CREATE OR REPLACE VIEW public.user_stats AS
SELECT 
    u.id as user_id,
    COUNT(DISTINCT p.id) as total_projects,
    COUNT(DISTINCT t.id) as total_tasks,
    COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
    COUNT(DISTINCT CASE WHEN t.status = 'in_progress' THEN t.id END) as in_progress_tasks,
    COUNT(DISTINCT CASE WHEN t.status = 'pending' THEN t.id END) as pending_tasks
FROM auth.users u
LEFT JOIN public.projects p ON u.id = p.user_id
LEFT JOIN public.tasks t ON u.id = t.user_id
GROUP BY u.id;

-- 项目统计视图
CREATE OR REPLACE VIEW public.project_stats AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    p.status as project_status,
    COUNT(t.id) as total_tasks,
    COUNT(CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
    COUNT(CASE WHEN t.status = 'in_progress' THEN t.id END) as in_progress_tasks,
    COUNT(CASE WHEN t.status = 'pending' THEN t.id END) as pending_tasks,
    ROUND(
        CASE 
            WHEN COUNT(t.id) = 0 THEN 0
            ELSE (COUNT(CASE WHEN t.status = 'completed' THEN t.id END) * 100.0 / COUNT(t.id))
        END, 2
    ) as completion_percentage
FROM public.projects p
LEFT JOIN public.tasks t ON p.id = t.project_id
GROUP BY p.id, p.name, p.status;

-- 14. 授权
GRANT SELECT ON public.user_stats TO anon;
GRANT SELECT ON public.project_stats TO anon;
GRANT SELECT ON public.user_stats TO authenticated;
GRANT SELECT ON public.project_stats TO authenticated;

-- 15. 创建示例数据插入函数
CREATE OR REPLACE FUNCTION public.insert_sample_data(user_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    project_id UUID;
BEGIN
    -- 插入示例项目
    INSERT INTO public.projects (name, description, status, user_id)
    VALUES (
        '项目管理系统开发',
        '使用 React 和 Supabase 开发一个完整的项目管理系统',
        'active',
        user_uuid
    ) RETURNING id INTO project_id;
    
    -- 插入示例任务
    INSERT INTO public.tasks (title, description, status, priority, project_id, user_id)
    VALUES 
        ('设置开发环境', '安装 Node.js、创建 React 项目、配置 Tailwind CSS', 'completed', 'high', project_id, user_uuid),
        ('设计数据库架构', '设计项目、任务、用户三个主要表的结构', 'completed', 'high', project_id, user_uuid),
        ('实现用户认证', '使用 Supabase Auth 实现用户登录和注册功能', 'in_progress', 'medium', project_id, user_uuid),
        ('开发项目管理功能', '实现项目的增删改查功能', 'pending', 'medium', project_id, user_uuid),
        ('开发任务管理功能', '实现任务的创建、编辑、状态更新功能', 'pending', 'medium', project_id, user_uuid);
    
    -- 再插入一个已完成的项目
    INSERT INTO public.projects (name, description, status, user_id)
    VALUES (
        '个人博客',
        '使用 Next.js 和 Vercel 部署的个人技术博客',
        'completed',
        user_uuid
    );
END;
$$;

-- 16. 验证表是否创建成功
DO $$
BEGIN
    RAISE NOTICE '数据表创建完成！';
    RAISE NOTICE '已创建的表:';
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
        RAISE NOTICE '✓ user_profiles (用户资料表)';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN
        RAISE NOTICE '✓ projects (项目表)';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks') THEN
        RAISE NOTICE '✓ tasks (任务表)';
    END IF;
    
    RAISE NOTICE '数据库设置完成！现在可以开始使用项目了。';
END $$;