import { useEffect, useState } from 'react'
import { useSupabase } from '../contexts/SupabaseContext'

export const useRealtime = (table, userId, filters = {}) => {
  const supabase = useSupabase()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let subscription = null

    const fetchData = async () => {
      try {
        setLoading(true)
        let query = supabase.from(table).select('*').eq('user_id', userId)

        // 应用过滤条件
        Object.entries(filters).forEach(([key, value]) => {
          if (value && value !== 'all') {
            query = query.eq(key, value)
          }
        })

        const { data: result, error: fetchError } = await query
        
        if (fetchError) throw fetchError
        
        setData(result || [])
        setError(null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // 设置实时订阅
    const channel = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          switch (payload.eventType) {
            case 'INSERT':
              setData(prev => [payload.new, ...prev])
              break
            case 'UPDATE':
              setData(prev => 
                prev.map(item => 
                  item.id === payload.new.id ? payload.new : item
                )
              )
              break
            case 'DELETE':
              setData(prev => 
                prev.filter(item => item.id !== payload.old.id)
              )
              break
          }
        }
      )
      .subscribe()

    subscription = channel

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription)
      }
    }
  }, [table, userId, JSON.stringify(filters)])

  return { data, loading, error }
}

export const useRealtimeProjects = (userId, filters = {}) => {
  return useRealtime('projects', userId, filters)
}

export const useRealtimeTasks = (userId, filters = {}) => {
  return useRealtime('tasks', userId, filters)
}