'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { QrCode, Package, History, Settings, Scan, ChevronRight, Smartphone, Camera, MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Product, ScanHistory } from '@/types'

/**
 * 首页组件
 * 提供扫码入口、功能导航和最近查询记录
 */
export default function HomePage() {
  const [recentScans, setRecentScans] = useState<(ScanHistory & { product?: Product })[]>([])
  const [loading, setLoading] = useState(true)

  /**
   * 加载最近扫描记录
   */
  const loadRecentScans = async () => {
    try {
      const { data, error } = await supabase
        .from('scan_history_detail')
        .select('*')
        .order('scanned_at', { ascending: false })
        .limit(5)

      if (error) {
        console.error('加载扫描历史失败:', error)
        return
      }

      setRecentScans(data || [])
    } catch (error) {
      console.error('加载扫描历史失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRecentScans()
  }, [])

  /**
   * 功能导航项配置
   */
  const navigationItems = [
    {
      title: '商品管理',
      description: '添加和编辑商品信息',
      icon: Package,
      href: '/admin/products',
      color: 'bg-blue-500',
    },
    {
      title: '库存管理',
      description: '查看和调整商品库存',
      icon: Settings,
      href: '/inventory',
      color: 'bg-purple-500',
    },
    {
      title: '扫描历史',
      description: '查看历史扫描记录',
      icon: History,
      href: '/history',
      color: 'bg-orange-500',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-background-secondary">
      {/* 头部区域 */}
      <div className="bg-blue-600 text-white px-6 py-8 rounded-b-3xl shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">扫码查询系统</h1>
          <p className="text-blue-100 opacity-90">快速扫描条形码查询商品信息</p>
        </div>
      </div>

      <div className="px-6 -mt-6 relative z-10">
        {/* 扫码入口 */}
        <div className="card mb-8">
          <div className="text-center">
            <div className="mb-6">
              <div className="relative inline-block">
                <div className="w-24 h-24 bg-wechat-primary rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg">
                  <QrCode className="w-12 h-12 text-white" />
                </div>
                <div className="pulse-ring"></div>
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-text-primary mb-2">开始扫码</h2>
            <p className="text-text-secondary mb-6">点击下方按钮启动摄像头扫描条形码</p>
            
            <Link href="/scan" className="btn-primary inline-flex items-center gap-2">
              <Scan className="w-5 h-5" />
              开始扫码
            </Link>
          </div>
        </div>

        {/* 功能导航 */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-text-primary mb-4">功能导航</h3>
          <div className="grid grid-cols-1 gap-4">
            {navigationItems.map((item, index) => {
              const IconComponent = item.icon
              return (
                <Link
                  key={index}
                  href={item.href}
                  className="card hover:shadow-lg transition-all duration-200 active:scale-95"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-text-primary">{item.title}</h4>
                      <p className="text-sm text-text-secondary">{item.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-text-tertiary" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* 最近查询记录 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary">最近查询</h3>
            <Link href="/history" className="text-wechat-primary text-sm font-medium">
              查看全部
            </Link>
          </div>
          
          {loading ? (
            <div className="card">
              <div className="flex items-center justify-center py-8">
                <div className="loading-spinner text-wechat-primary"></div>
                <span className="ml-2 text-text-secondary">加载中...</span>
              </div>
            </div>
          ) : recentScans.length > 0 ? (
            <div className="space-y-3">
              {recentScans.map((scan) => (
                <div key={scan.id} className="card">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-background-tertiary rounded-xl flex items-center justify-center">
                      <Package className="w-6 h-6 text-text-secondary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-text-primary">
                        {scan.product_name || '未知商品'}
                      </h4>
                      <p className="text-sm text-text-secondary">
                        条形码: {scan.barcode}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {new Date(scan.scanned_at).toLocaleString('zh-CN')}
                      </p>
                    </div>
                    {scan.product_id && (
                      <Link
                        href={`/product/${scan.barcode}`}
                        className="text-wechat-primary text-sm font-medium"
                      >
                        查看详情
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card">
              <div className="text-center py-8">
                <History className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
                <p className="text-text-secondary">暂无扫描记录</p>
                <p className="text-sm text-text-tertiary mt-1">开始扫码来查询商品信息吧</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}