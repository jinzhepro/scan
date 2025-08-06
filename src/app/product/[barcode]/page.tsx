'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Package, Minus, Plus, ShoppingCart, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Product, InventoryReason } from '@/types'
import { InventoryReasonLabels } from '@/types'

/**
 * 商品详情页面组件
 * 显示商品信息和库存状态，提供库存操作功能
 */
export default function ProductDetailPage({ params }: { params: { barcode: string } }) {
  const router = useRouter()
  const { barcode } = params
  
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(1)
  const [adjustmentReason, setAdjustmentReason] = useState<InventoryReason>('sale' as InventoryReason)
  const [isAdjusting, setIsAdjusting] = useState(false)
  const [showAdjustment, setShowAdjustment] = useState(false)

  /**
   * 加载商品信息
   */
  const loadProduct = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('barcode', barcode)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setError('商品不存在，请检查条形码是否正确')
        } else {
          setError('查询商品信息失败')
        }
        return
      }

      setProduct(data)
      
      // 记录扫描历史（如果用户已登录）
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.rpc('record_scan_history', {
          p_user_id: user.id,
          p_barcode: barcode
        })
      }
      
    } catch (err) {
      console.error('加载商品信息失败:', err)
      setError('加载商品信息失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (barcode) {
      loadProduct()
    }
  }, [barcode])

  /**
   * 调整库存
   */
  const adjustInventory = async (change: number) => {
    if (!product) return

    try {
      setIsAdjusting(true)
      
      // 获取当前用户
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('请先登录')
        return
      }

      // 调用库存调整函数
      const { data, error: adjustError } = await supabase.rpc('adjust_inventory', {
        p_product_id: product.id,
        p_quantity_change: change,
        p_reason: adjustmentReason,
        p_operator_id: user.id
      })

      if (adjustError) {
        console.error('库存调整失败:', adjustError)
        setError('库存调整失败')
        return
      }

      const result = data as { success: boolean; message: string; data?: { new_stock: number } }
      
      if (!result.success) {
        setError(result.message)
        return
      }

      // 更新本地商品信息
      if (result.data) {
        setProduct(prev => prev ? { ...prev, stock: result.data!.new_stock } : null)
      }
      
      setShowAdjustment(false)
      setAdjustmentQuantity(1)
      
    } catch (err) {
      console.error('库存调整失败:', err)
      setError('库存调整失败')
    } finally {
      setIsAdjusting(false)
    }
  }

  /**
   * 获取库存状态
   */
  const getStockStatus = (stock: number) => {
    if (stock <= 0) {
      return { label: '缺货', color: 'text-status-error', bgColor: 'bg-red-100', icon: AlertTriangle }
    } else if (stock <= 10) {
      return { label: '库存不足', color: 'text-status-warning', bgColor: 'bg-yellow-100', icon: Clock }
    } else {
      return { label: '库存充足', color: 'text-status-success', bgColor: 'bg-green-100', icon: CheckCircle }
    }
  }

  /**
   * 返回上一页
   */
  const goBack = () => {
    router.back()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner text-wechat-primary mb-4"></div>
          <p className="text-text-secondary">正在查询商品信息...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background-secondary">
        <div className="bg-wechat-primary text-white px-6 py-4">
          <div className="flex items-center gap-4">
            <button onClick={goBack} className="p-2 -ml-2">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold">商品详情</h1>
          </div>
        </div>
        
        <div className="p-6">
          <div className="card text-center">
            <AlertTriangle className="w-16 h-16 text-status-error mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-text-primary mb-2">查询失败</h2>
            <p className="text-text-secondary mb-6">{error}</p>
            <div className="flex gap-3">
              <button onClick={goBack} className="btn-secondary flex-1">
                返回
              </button>
              <button onClick={loadProduct} className="btn-primary flex-1">
                重试
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return null
  }

  const stockStatus = getStockStatus(product.stock)
  const StatusIcon = stockStatus.icon

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* 头部导航 */}
      <div className="bg-wechat-primary text-white px-6 py-4">
        <div className="flex items-center gap-4">
          <button onClick={goBack} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">商品详情</h1>
        </div>
      </div>

      <div className="p-6">
        {/* 商品信息卡片 */}
        <div className="card mb-6">
          {/* 商品图片 */}
          <div className="w-full h-48 bg-background-tertiary rounded-xl mb-4 flex items-center justify-center">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <Package className="w-16 h-16 text-text-tertiary" />
            )}
          </div>

          {/* 商品基本信息 */}
          <div className="mb-4">
            <h2 className="text-xl font-bold text-text-primary mb-2">{product.name}</h2>
            <p className="text-2xl font-bold text-wechat-primary mb-2">¥{product.price.toFixed(2)}</p>
            <p className="text-text-secondary text-sm mb-3">
              条形码: {product.barcode}
            </p>
            {product.description && (
              <p className="text-text-secondary">{product.description}</p>
            )}
          </div>

          {/* 库存状态 */}
          <div className={`flex items-center gap-2 p-3 rounded-xl ${stockStatus.bgColor}`}>
            <StatusIcon className={`w-5 h-5 ${stockStatus.color}`} />
            <span className={`font-medium ${stockStatus.color}`}>
              {stockStatus.label}
            </span>
            <span className="ml-auto text-text-primary font-semibold">
              库存: {product.stock} 件
            </span>
          </div>
        </div>

        {/* 库存操作 */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">库存操作</h3>
          
          {!showAdjustment ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setAdjustmentReason('sale' as InventoryReason)
                  setShowAdjustment(true)
                }}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <Minus className="w-4 h-4" />
                减库存
              </button>
              <button
                onClick={() => {
                  setAdjustmentReason('restock' as InventoryReason)
                  setShowAdjustment(true)
                }}
                className="btn-secondary flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                加库存
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 数量调整 */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  调整数量
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setAdjustmentQuantity(Math.max(1, adjustmentQuantity - 1))}
                    className="w-10 h-10 bg-background-tertiary rounded-lg flex items-center justify-center"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={adjustmentQuantity}
                    onChange={(e) => setAdjustmentQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="input-field text-center flex-1"
                    min="1"
                  />
                  <button
                    onClick={() => setAdjustmentQuantity(adjustmentQuantity + 1)}
                    className="w-10 h-10 bg-background-tertiary rounded-lg flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 调整原因 */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  调整原因
                </label>
                <select
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value as InventoryReason)}
                  className="input-field"
                >
                  {Object.entries(InventoryReasonLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAdjustment(false)}
                  className="btn-secondary flex-1"
                  disabled={isAdjusting}
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    const change = adjustmentReason === 'sale' || adjustmentReason === 'damage' 
                      ? -adjustmentQuantity 
                      : adjustmentQuantity
                    adjustInventory(change)
                  }}
                  disabled={isAdjusting}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {isAdjusting ? (
                    <>
                      <div className="loading-spinner"></div>
                      处理中...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      确认调整
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 快捷操作 */}
        <div className="card">
          <h3 className="text-lg font-semibold text-text-primary mb-4">快捷操作</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => router.push('/scan')}
              className="btn-secondary"
            >
              继续扫码
            </button>
            <button
              onClick={() => router.push('/inventory')}
              className="btn-secondary"
            >
              库存管理
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}