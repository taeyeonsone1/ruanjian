-- 创建更新时间戳的函数
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

-- 为项目表创建触发器
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_updated_at_column();

-- 为任务表创建触发器
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_updated_at_column();

-- 为用户资料表创建触发器
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_updated_at_column();

-- 创建一些有用的视图
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

-- 创建项目统计视图
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

-- 授予匿名用户访问视图的权限
GRANT SELECT ON public.user_stats TO anon;
GRANT SELECT ON public.project_stats TO anon;
GRANT SELECT ON public.user_stats TO authenticated;
GRANT SELECT ON public.project_stats TO authenticated;