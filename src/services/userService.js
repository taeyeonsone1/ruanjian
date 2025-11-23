import { useSupabase } from '../contexts/SupabaseContext'

export const useUserService = () => {
  const supabase = useSupabase()

  const getUserProfile = async (userId) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }
    
    return data
  }

  const updateUserProfile = async (userId, profileData) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  const updateUserMetadata = async (metadata) => {
    const { data, error } = await supabase.auth.updateUser({
      data: metadata
    })

    if (error) throw error
    return data
  }

  const getUserStats = async (userId) => {
    const { data, error } = await supabase
      .rpc('user_stats', { user_uuid: userId })

    if (error) {
      // 如果 RPC 不可用，使用视图
      const { data: viewData, error: viewError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (viewError) throw viewError
      return viewData
    }
    
    return data[0]
  }

  const updatePassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) throw error
    return data
  }

  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email)

    if (error) throw error
    return data
  }

  const deleteUserAccount = async () => {
    const { error } = await supabase.rpc('delete_user_account')

    if (error) throw error
  }

  const getRecentActivity = async (userId, limit = 10) => {
    // 获取最近的项目活动
    const [projects, tasks] = await Promise.all([
      supabase
        .from('projects')
        .select('id, name, created_at, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(limit),
      
      supabase
        .from('tasks')
        .select('id, title, status, created_at, updated_at, projects(name)')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(limit)
    ])

    // 合并并按时间排序
    const activities = [
      ...projects.map(p => ({
        id: p.id,
        type: 'project',
        title: p.name,
        timestamp: p.updated_at,
        created_at: p.created_at
      })),
      ...tasks.map(t => ({
        id: t.id,
        type: 'task',
        title: t.title,
        status: t.status,
        project: t.projects?.name,
        timestamp: t.updated_at,
        created_at: t.created_at
      }))
    ]

    return activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit)
  }

  return {
    getUserProfile,
    updateUserProfile,
    updateUserMetadata,
    getUserStats,
    updatePassword,
    resetPassword,
    deleteUserAccount,
    getRecentActivity
  }
}