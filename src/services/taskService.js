import { useSupabase } from '../contexts/SupabaseContext'

export const useTaskService = () => {
  const supabase = useSupabase()

  const getTasks = async (userId, filters = {}) => {
    let query = supabase
      .from('tasks')
      .select(`
        *,
        projects(name)
      `)
      .eq('user_id', userId)

    if (filters.search) {
      query = query.ilike('title', `%${filters.search}%`)
    }

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    if (filters.projectId && filters.projectId !== 'all') {
      query = query.eq('project_id', filters.projectId)
    }

    if (filters.priority && filters.priority !== 'all') {
      query = query.eq('priority', filters.priority)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  const getTask = async (taskId, userId) => {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        projects(name)
      `)
      .eq('id', taskId)
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return data
  }

  const createTask = async (taskData, userId) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...taskData,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select(`
        *,
        projects(name)
      `)
      .single()

    if (error) throw error
    return data
  }

  const updateTask = async (taskId, taskData, userId) => {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        ...taskData,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .eq('user_id', userId)
      .select(`
        *,
        projects(name)
      `)
      .single()

    if (error) throw error
    return data
  }

  const deleteTask = async (taskId, userId) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', userId)

    if (error) throw error
  }

  const updateTaskStatus = async (taskId, status, userId) => {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  const getTasksByProject = async (projectId, userId) => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  const getTaskStats = async (userId) => {
    const { data, error } = await supabase
      .from('tasks')
      .select('status, priority', { count: 'exact' })
      .eq('user_id', userId)

    if (error) throw error
    
    const statusStats = data.reduce((acc, task) => {
      acc.status[task.status] = (acc.status[task.status] || 0) + 1
      acc.priority[task.priority] = (acc.priority[task.priority] || 0) + 1
      return acc
    }, { status: {}, priority: {} })

    return {
      total: data.length,
      status: {
        pending: statusStats.status.pending || 0,
        in_progress: statusStats.status.in_progress || 0,
        completed: statusStats.status.completed || 0
      },
      priority: {
        low: statusStats.priority.low || 0,
        medium: statusStats.priority.medium || 0,
        high: statusStats.priority.high || 0
      }
    }
  }

  const getOverdueTasks = async (userId) => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .lt('due_date', new Date().toISOString())
      .in('status', ['pending', 'in_progress'])
      .order('due_date', { ascending: true })

    if (error) throw error
    return data
  }

  return {
    getTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    getTasksByProject,
    getTaskStats,
    getOverdueTasks
  }
}