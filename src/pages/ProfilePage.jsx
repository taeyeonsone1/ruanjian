import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSupabase } from '../contexts/SupabaseContext'
import { useForm } from 'react-hook-form'
import { User, Mail, Calendar, Shield, Edit2, Save, X } from 'lucide-react'
import toast from 'react-hot-toast'

const ProfilePage = () => {
  const { user } = useAuth()
  const supabase = useSupabase()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userStats, setUserStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    accountAge: 0
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    fetchUserStats()
    reset({
      name: user?.user_metadata?.name || '',
      email: user?.email || ''
    })
  }, [user])

  const fetchUserStats = async () => {
    try {
      const [
        { count: totalProjects },
        { count: totalTasks },
        { count: completedTasks }
      ] = await Promise.all([
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'completed')
      ])

      const accountAge = user?.created_at 
        ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0

      setUserStats({
        totalProjects: totalProjects || 0,
        totalTasks: totalTasks || 0,
        completedTasks: completedTasks || 0,
        accountAge
      })
    } catch (error) {
      console.error('获取用户统计失败:', error)
    }
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      
      const { error } = await supabase.auth.updateUser({
        data: {
          name: data.name
        }
      })

      if (error) throw error
      
      toast.success('个人资料更新成功！')
      setIsEditing(false)
    } catch (error) {
      toast.error('更新失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const cancelEdit = () => {
    setIsEditing(false)
    reset({
      name: user?.user_metadata?.name || '',
      email: user?.email || ''
    })
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const statCards = [
    {
      label: '项目数量',
      value: userStats.totalProjects,
      icon: '📁',
      color: 'bg-blue-50 text-blue-700'
    },
    {
      label: '任务数量',
      value: userStats.totalTasks,
      icon: '✅',
      color: 'bg-green-50 text-green-700'
    },
    {
      label: '已完成',
      value: userStats.completedTasks,
      icon: '🎯',
      color: 'bg-purple-50 text-purple-700'
    },
    {
      label: '加入天数',
      value: userStats.accountAge,
      icon: '📅',
      color: 'bg-orange-50 text-orange-700'
    }
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">个人资料</h1>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <span className="text-xl">{stat.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 基本信息 */}
        <div className="lg:col-span-2 card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">基本信息</h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="btn btn-secondary flex items-center gap-2"
              >
                <Edit2 size={18} />
                编辑
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={cancelEdit}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <X size={18} />
                  取消
                </button>
                <button
                  onClick={handleSubmit(onSubmit)}
                  disabled={loading}
                  className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  <Save size={18} />
                  {loading ? '保存中...' : '保存'}
                </button>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                  <User size={32} className="text-primary-600" />
                </div>
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      姓名
                    </label>
                    <input
                      {...register('name', { required: '请输入姓名' })}
                      type="text"
                      className="input-field"
                      placeholder="输入姓名"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {user?.user_metadata?.name || '未设置姓名'}
                    </h3>
                    <p className="text-sm text-gray-500">用户</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail size={16} className="inline mr-1" />
                  邮箱地址
                </label>
                {isEditing ? (
                  <input
                    {...register('email')}
                    type="email"
                    className="input-field bg-gray-50"
                    disabled
                    title="邮箱地址无法修改"
                  />
                ) : (
                  <p className="text-gray-900">{user?.email}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">邮箱地址无法修改</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar size={16} className="inline mr-1" />
                  账户创建时间
                </label>
                <p className="text-gray-900">
                  {user?.created_at ? formatDate(user.created_at) : '未知'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Shield size={16} className="inline mr-1" />
                  账户状态
                </label>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  已验证
                </span>
              </div>
            </div>
          </form>
        </div>

        {/* 账户安全 */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">账户安全</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">修改密码</h3>
              <p className="text-sm text-gray-600 mb-3">
                定期更改密码可以提高账户安全性
              </p>
              <button className="btn btn-secondary w-full">
                修改密码
              </button>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-2">两步验证</h3>
              <p className="text-sm text-gray-600 mb-3">
                启用两步验证以增强账户安全
              </p>
              <button className="btn btn-secondary w-full">
                设置两步验证
              </button>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-2">登录活动</h3>
              <p className="text-sm text-gray-600 mb-3">
                查看最近的登录记录
              </p>
              <button className="btn btn-secondary w-full">
                查看活动
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage