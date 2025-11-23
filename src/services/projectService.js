import { useSupabase } from '../contexts/SupabaseContext'

export const useProjectService = () => {
  const supabase = useSupabase()

  const getProjects = async (userId, filters = {}) => {
    let query = supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)

    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`)
    }

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  const getProject = async (projectId, userId) => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return data
  }

  const createProject = async (projectData, userId) => {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        ...projectData,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  const updateProject = async (projectId, projectData, userId) => {
    const { data, error } = await supabase
      .from('projects')
      .update({
        ...projectData,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  const deleteProject = async (projectId, userId) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', userId)

    if (error) throw error
  }

  const getProjectStats = async (userId) => {
    const { data, error } = await supabase
      .from('projects')
      .select('status', { count: 'exact' })
      .eq('user_id', userId)

    if (error) throw error
    
    const stats = data.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1
      return acc
    }, {})

    return {
      total: data.length,
      planning: stats.planning || 0,
      active: stats.active || 0,
      completed: stats.completed || 0,
      archived: stats.archived || 0
    }
  }

  return {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    getProjectStats
  }
}