-- 数据库初始化脚本
-- 这个脚本包含了所有的表创建和初始化

-- 读取并执行所有迁移文件
-- 注意：在 Supabase 中，这些文件会按照顺序自动执行

-- 设置数据库时区
SET timezone = 'Asia/Shanghai';

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 创建枚举类型
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

-- 创建示例数据插入函数
CREATE OR REPLACE FUNCTION public.insert_sample_data(user_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    project_id UUID;
    task_id UUID;
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