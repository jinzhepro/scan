import { createClient } from '@supabase/supabase-js'

// Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wwtkpmphnhpbzdsbmweg.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3dGtwbXBobmhwYnpkc2Jtd2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNTk3MzgsImV4cCI6MjA2OTkzNTczOH0.jN_1ZpATri2xJZ7CSkQ-kZrUcOyq-VYl3fGzMXmPezI'

// 检查必需的环境变量
if (!supabaseUrl || supabaseUrl === 'your-supabase-url') {
  console.warn('Supabase URL not configured properly')
}
if (!supabaseAnonKey || supabaseAnonKey === 'your-supabase-anon-key') {
  console.warn('Supabase Anon Key not configured properly')
}

/**
 * 创建Supabase客户端实例
 * 用于前端应用与Supabase数据库的交互
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

/**
 * 创建服务端Supabase客户端实例
 * 用于API路由中的数据库操作，具有更高权限
 */
export const createServiceSupabase = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3dGtwbXBobmhwYnpkc2Jtd2VnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDM1OTczOCwiZXhwIjoyMDY5OTM1NzM4fQ.dHReongOp2PD_1vlSfp1a-ir8tUwup3BuLS7eW37-8Q'
  
  if (!serviceRoleKey || serviceRoleKey === 'your-service-role-key') {
    console.warn('Supabase Service Role Key not configured properly')
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

/**
 * 服务端Supabase客户端实例
 * 用于API路由中的数据库操作
 */
export const supabaseAdmin = createServiceSupabase()

// 数据库表名常量
export const TABLES = {
  PRODUCTS: 'products',
  USERS: 'users',
  INVENTORY_LOGS: 'inventory_logs',
  SCAN_HISTORY: 'scan_history'
} as const

// 用户角色常量
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin'
} as const