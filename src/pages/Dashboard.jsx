import React, { useState, useEffect } from 'react'
import { useSupabase } from '../contexts/SupabaseContext'
import { useAuth } from '../contexts/AuthContext'
import { 
  FolderKanban, 
  CheckSquare, 
  Clock, 
  TrendingUp,
  Plus,
  Calendar,
  Users
} from 'lucide-react'

const Dashboard = () => {
  const supabase = useSupabase()
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0
  })
  const [recentProjects, setRecentProjects] = useState([])
  const [recentTasks, setRecentTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // 获取统计数据
      const [
        { count: totalProjects },
        { count: totalTasks },
        { count: completedTasks },
        { data: projectsData },
        { data: tasksData }
      ] = await Promise.all([
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'completed'),
        supabase.from('projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('tasks').select(`
          *,
          projects(name)
        `).eq('user_id', user.id).order('created_at', { ascending: false }).limit(5)
      ])

      const pendingTasks = totalTasks - completedTasks

      setStats({
        totalProjects: totalProjects || 0,
        totalTasks: totalTasks || 0,
        completedTasks: completedTasks || 0,
        pendingTasks: pendingTasks || 0
      })

      setRecentProjects(projectsData || [])
      setRecentTasks(tasksData || [])
    } catch (error) {
      console.error('获取仪表板数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: '项目总数',
      value: stats.totalProjects,
      icon: FolderKanban,
      color: 'bg-blue-500',
      trend: null
    },
    {
      title: '任务总数',
      value: stats.totalTasks,
      icon: CheckSquare,
      color: 'bg-green-500',
      trend: null
    },
    {
      title: '已完成',
      value: stats.completedTasks,
      icon: TrendingUp,
      color: 'bg-emerald-500',
      trend: null
    },
    {
      title: '待处理',
      value: stats.pendingTasks,
      icon: Clock,
      color: 'bg-orange-500',
      trend: null
    }
  ]

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">仪表板</h1>
        <div className="flex gap-2">
          <button className="btn btn-primary flex items-center gap-2">
            <Plus size={18} />
            新建项目
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最近项目 */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">最近项目</h2>
            <FolderKanban size={20} className="text-gray-400" />
          </div>
          <div className="space-y-3">
            {recentProjects.length === 0 ? (
              <p className="text-gray-500 text-center py-8">暂无项目</p>
            ) : (
              recentProjects.map((project) => (
                <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div>
                    <h3 className="font-medium text-gray-900">{project.name}</h3>
                    <p className="text-sm text-gray-500">{formatDate(project.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(project.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 最近任务 */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">最近任务</h2>
            <CheckSquare size={20} className="text-gray-400" />
          </div>
          <div className="space-y-3">
            {recentTasks.length === 0 ? (
              <p className="text-gray-500 text-center py-8">暂无任务</p>
            ) : (
              recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div>
                    <h3 className="font-medium text-gray-900">{task.title}</h3>
                    <p className="text-sm text-gray-500">{task.projects?.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(task.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard