import React, { useState, useEffect } from 'react'
import { useSupabase } from '../contexts/SupabaseContext'
import { useAuth } from '../contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search,
  Calendar,
  Filter,
  X,
  CheckCircle2,
  Circle
} from 'lucide-react'
import toast from 'react-hot-toast'

const TasksPage = () => {
  const supabase = useSupabase()
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('all')

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    fetchProjects()
    fetchTasks()
  }, [searchTerm, statusFilter, projectFilter])

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .eq('user_id', user.id)
        .order('name')

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('获取项目失败:', error)
    }
  }

  const fetchTasks = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('tasks')
        .select(`
          *,
          projects(name)
        `)
        .eq('user_id', user.id)

      // 搜索过滤
      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`)
      }

      // 状态过滤
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      // 项目过滤
      if (projectFilter !== 'all') {
        query = query.eq('project_id', projectFilter)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      toast.error('获取任务失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    try {
      const taskData = {
        ...data,
        user_id: user.id,
        updated_at: new Date().toISOString()
      }

      if (editingTask) {
        // 更新任务
        const { error } = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', editingTask.id)

        if (error) throw error
        toast.success('任务更新成功！')
      } else {
        // 创建任务
        taskData.created_at = new Date().toISOString()
        const { error } = await supabase
          .from('tasks')
          .insert(taskData)

        if (error) throw error
        toast.success('任务创建成功！')
      }

      setShowModal(false)
      setEditingTask(null)
      reset()
      fetchTasks()
    } catch (error) {
      toast.error('操作失败: ' + error.message)
    }
  }

  const toggleTaskStatus = async (task) => {
    const newStatus = task.status === 'completed' ? 'in_progress' : 'completed'
    
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id)

      if (error) throw error
      toast.success(`任务已标记为${newStatus === 'completed' ? '已完成' : '进行中'}`)
      fetchTasks()
    } catch (error) {
      toast.error('状态更新失败: ' + error.message)
    }
  }

  const handleEdit = (task) => {
    setEditingTask(task)
    reset(task)
    setShowModal(true)
  }

  const handleDelete = async (taskId) => {
    if (!confirm('确定要删除这个任务吗？')) {
      return
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error
      toast.success('任务删除成功！')
      fetchTasks()
    } catch (error) {
      toast.error('删除失败: ' + error.message)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingTask(null)
    reset()
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: '待处理', color: 'bg-yellow-100 text-yellow-800' },
      in_progress: { label: '进行中', color: 'bg-blue-100 text-blue-800' },
      completed: { label: '已完成', color: 'bg-green-100 text-green-800' }
    }
    
    const config = statusConfig[status] || statusConfig.pending
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      low: { label: '低', color: 'bg-gray-100 text-gray-800' },
      medium: { label: '中', color: 'bg-orange-100 text-orange-800' },
      high: { label: '高', color: 'bg-red-100 text-red-800' }
    }
    
    const config = priorityConfig[priority] || priorityConfig.medium
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900">任务管理</h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          新建任务
        </button>
      </div>

      {/* 搜索和过滤 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="搜索任务..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-400" />
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="input-field"
          >
            <option value="all">所有项目</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
          >
            <option value="all">所有状态</option>
            <option value="pending">待处理</option>
            <option value="in_progress">进行中</option>
            <option value="completed">已完成</option>
          </select>
        </div>
      </div>

      {/* 任务列表 */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <CheckCircle2 size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无任务</h3>
            <p className="text-gray-500 mb-4">创建您的第一个任务开始管理工作</p>
            <button
              onClick={() => setShowModal(true)}
              className="btn btn-primary"
            >
              新建任务
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {tasks.map((task) => (
              <div key={task.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleTaskStatus(task)}
                    className="mt-1 text-gray-400 hover:text-primary-600 transition-colors"
                  >
                    {task.status === 'completed' ? (
                      <CheckCircle2 size={20} className="text-green-600" />
                    ) : (
                      <Circle size={20} />
                    )}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 mr-4">
                        <h3 className={`font-medium text-gray-900 ${task.status === 'completed' ? 'line-through opacity-60' : ''}`}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className={`text-sm text-gray-600 mt-1 ${task.status === 'completed' ? 'opacity-60' : ''}`}>
                            {task.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {getStatusBadge(task.status)}
                          {getPriorityBadge(task.priority)}
                          <span className="text-xs text-gray-500">
                            {task.projects?.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            <Calendar size={12} className="inline mr-1" />
                            {formatDate(task.created_at)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(task)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 任务模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingTask ? '编辑任务' : '新建任务'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  任务标题
                </label>
                <input
                  {...register('title', { required: '请输入任务标题' })}
                  type="text"
                  className="input-field"
                  placeholder="输入任务标题"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  任务描述
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="input-field"
                  placeholder="输入任务描述"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    项目
                  </label>
                  <select {...register('project_id', { required: '请选择项目' })} className="input-field">
                    <option value="">选择项目</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  {errors.project_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.project_id.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    优先级
                  </label>
                  <select {...register('priority')} className="input-field">
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  状态
                </label>
                <select {...register('status')} className="input-field">
                  <option value="pending">待处理</option>
                  <option value="in_progress">进行中</option>
                  <option value="completed">已完成</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 btn btn-secondary"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 btn btn-primary"
                >
                  {editingTask ? '更新' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default TasksPage