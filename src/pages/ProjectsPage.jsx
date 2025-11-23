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
  X
} from 'lucide-react'
import toast from 'react-hot-toast'

const ProjectsPage = () => {
  const supabase = useSupabase()
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    fetchProjects()
  }, [searchTerm, statusFilter])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)

      // 搜索过滤
      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`)
      }

      // 状态过滤
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      toast.error('获取项目失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    try {
      const projectData = {
        ...data,
        user_id: user.id,
        updated_at: new Date().toISOString()
      }

      if (editingProject) {
        // 更新项目
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', editingProject.id)

        if (error) throw error
        toast.success('项目更新成功！')
      } else {
        // 创建项目
        projectData.created_at = new Date().toISOString()
        const { error } = await supabase
          .from('projects')
          .insert(projectData)

        if (error) throw error
        toast.success('项目创建成功！')
      }

      setShowModal(false)
      setEditingProject(null)
      reset()
      fetchProjects()
    } catch (error) {
      toast.error('操作失败: ' + error.message)
    }
  }

  const handleEdit = (project) => {
    setEditingProject(project)
    reset(project)
    setShowModal(true)
  }

  const handleDelete = async (projectId) => {
    if (!confirm('确定要删除这个项目吗？相关的任务也会被删除。')) {
      return
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error
      toast.success('项目删除成功！')
      fetchProjects()
    } catch (error) {
      toast.error('删除失败: ' + error.message)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingProject(null)
    reset()
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      planning: { label: '规划中', color: 'bg-gray-100 text-gray-800' },
      active: { label: '进行中', color: 'bg-blue-100 text-blue-800' },
      completed: { label: '已完成', color: 'bg-green-100 text-green-800' },
      archived: { label: '已归档', color: 'bg-yellow-100 text-yellow-800' }
    }
    
    const config = statusConfig[status] || statusConfig.planning
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
        <h1 className="text-3xl font-bold text-gray-900">项目管理</h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          新建项目
        </button>
      </div>

      {/* 搜索和过滤 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="搜索项目..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
          >
            <option value="all">所有状态</option>
            <option value="planning">规划中</option>
            <option value="active">进行中</option>
            <option value="completed">已完成</option>
            <option value="archived">已归档</option>
          </select>
        </div>
      </div>

      {/* 项目列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-400 mb-4">
              <Plus size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无项目</h3>
            <p className="text-gray-500 mb-4">创建您的第一个项目开始管理任务</p>
            <button
              onClick={() => setShowModal(true)}
              className="btn btn-primary"
            >
              新建项目
            </button>
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-900 flex-1 mr-2">{project.name}</h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(project)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>
              
              <div className="flex justify-between items-center">
                {getStatusBadge(project.status)}
                <span className="text-xs text-gray-500">
                  <Calendar size={12} className="inline mr-1" />
                  {formatDate(project.created_at)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 项目模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingProject ? '编辑项目' : '新建项目'}
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
                  项目名称
                </label>
                <input
                  {...register('name', { required: '请输入项目名称' })}
                  type="text"
                  className="input-field"
                  placeholder="输入项目名称"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  项目描述
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="input-field"
                  placeholder="输入项目描述"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  状态
                </label>
                <select {...register('status')} className="input-field">
                  <option value="planning">规划中</option>
                  <option value="active">进行中</option>
                  <option value="completed">已完成</option>
                  <option value="archived">已归档</option>
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
                  {editingProject ? '更新' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectsPage