'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Package, Plus, Minus, Filter, ArrowLeft, AlertTriangle, CheckCircle, Clock, BarChart3 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Product, InventoryReason } from '@/types'
import { InventoryReasonLabels } from '@/types'

/**
 * 库存管理页面组件
 * 提供商品库存查看、搜索和批量操作功能
 */
export default function InventoryPage() {
  const router = useRouter()
  
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showAdjustment, setShowAdjustment] = useState(false)
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(1)
  const [adjustmentReason, setAdjustmentReason] = useState<InventoryReason>('restock' as InventoryReason)
  const [isAdjusting, setIsAdjusting] = useState(false)

  /**
   * 加载商品列表
   */
  const loadProducts = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .order('name')

      if (fetchError) {
        console.error('加载商品列表失败:', fetchError)
        setError('加载商品列表失败')
        return
      }

      setProducts(data || [])
      
    } catch (err) {
      console.error('加载商品列表失败:', err)
      setError('加载商品列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  /**
   * 过滤商品列表
   */
  useEffect(() => {
    let filtered = products

    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.barcode.includes(query) ||
        (product.description && product.description.toLowerCase().includes(query))
      )
    }

    // 库存状态过滤
    if (stockFilter === 'low') {
      filtered = filtered.filter(product => product.stock > 0 && product.stock <= 10)
    } else if (stockFilter === 'out') {
      filtered = filtered.filter(product => product.stock <= 0)
    }

    setFilteredProducts(filtered)
  }, [products, searchQuery, stockFilter])

  /**
   * 调整库存
   */
  const adjustInventory = async (product: Product, change: number) => {
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
        setProducts(prev => prev.map(p => 
          p.id === product.id ? { ...p, stock: result.data!.new_stock } : p
        ))
      }
      
      setShowAdjustment(false)
      setSelectedProduct(null)
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
   * 获取库存统计
   */
  const getStockStats = () => {
    const total = products.length
    const outOfStock = products.filter(p => p.stock <= 0).length
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= 10).length
    const inStock = products.filter(p => p.stock > 10).length
    
    return { total, outOfStock, lowStock, inStock }
  }

  const stats = getStockStats()

  if (loading) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner text-wechat-primary mb-4"></div>
          <p className="text-text-secondary">正在加载库存信息...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* 头部导航 */}
      <div className="bg-wechat-primary text-white px-6 py-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">库存管理</h1>
        </div>
      </div>

      <div className="p-6">
        {/* 库存统计 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="card text-center">
            <BarChart3 className="w-8 h-8 text-wechat-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
            <p className="text-sm text-text-secondary">总商品数</p>
          </div>
          <div className="card text-center">
            <AlertTriangle className="w-8 h-8 text-status-error mx-auto mb-2" />
            <p className="text-2xl font-bold text-text-primary">{stats.outOfStock}</p>
            <p className="text-sm text-text-secondary">缺货商品</p>
          </div>
        </div>

        {/* 搜索和过滤 */}
        <div className="card mb-6">
          <div className="space-y-4">
            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-tertiary" />
              <input
                type="text"
                placeholder="搜索商品名称、条形码或描述"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
              />
            </div>

            {/* 库存状态过滤 */}
            <div className="flex gap-2">
              <button
                onClick={() => setStockFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  stockFilter === 'all'
                    ? 'bg-wechat-primary text-white'
                    : 'bg-background-tertiary text-text-secondary'
                }`}
              >
                全部 ({stats.total})
              </button>
              <button
                onClick={() => setStockFilter('low')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  stockFilter === 'low'
                    ? 'bg-status-warning text-white'
                    : 'bg-background-tertiary text-text-secondary'
                }`}
              >
                库存不足 ({stats.lowStock})
              </button>
              <button
                onClick={() => setStockFilter('out')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  stockFilter === 'out'
                    ? 'bg-status-error text-white'
                    : 'bg-background-tertiary text-text-secondary'
                }`}
              >
                缺货 ({stats.outOfStock})
              </button>
            </div>
          </div>
        </div>

        {/* 商品列表 */}
        {error && (
          <div className="card mb-6 border-l-4 border-status-error">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-status-error" />
              <p className="text-status-error">{error}</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {filteredProducts.length === 0 ? (
            <div className="card text-center py-8">
              <Package className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">暂无商品</h3>
              <p className="text-text-secondary">
                {searchQuery || stockFilter !== 'all' ? '没有找到符合条件的商品' : '还没有添加任何商品'}
              </p>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product.stock)
              const StatusIcon = stockStatus.icon
              
              return (
                <div key={product.id} className="card">
                  <div className="flex items-start gap-4">
                    {/* 商品图片 */}
                    <div className="w-16 h-16 bg-background-tertiary rounded-lg flex items-center justify-center flex-shrink-0">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-text-tertiary" />
                      )}
                    </div>

                    {/* 商品信息 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-text-primary truncate">{product.name}</h3>
                      <p className="text-sm text-text-secondary mb-1">¥{product.price.toFixed(2)}</p>
                      <p className="text-xs text-text-tertiary mb-2">{product.barcode}</p>
                      
                      {/* 库存状态 */}
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg ${stockStatus.bgColor}`}>
                        <StatusIcon className={`w-3 h-3 ${stockStatus.color}`} />
                        <span className={`text-xs font-medium ${stockStatus.color}`}>
                          库存: {product.stock}
                        </span>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => {
                          setSelectedProduct(product)
                          setAdjustmentReason('restock' as InventoryReason)
                          setShowAdjustment(true)
                        }}
                        className="w-8 h-8 bg-wechat-primary text-white rounded-lg flex items-center justify-center"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProduct(product)
                          setAdjustmentReason('sale' as InventoryReason)
                          setShowAdjustment(true)
                        }}
                        className="w-8 h-8 bg-status-error text-white rounded-lg flex items-center justify-center"
                        disabled={product.stock <= 0}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* 库存调整弹窗 */}
      {showAdjustment && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              调整库存 - {selectedProduct.name}
            </h3>
            
            <div className="space-y-4">
              {/* 当前库存 */}
              <div className="text-center p-3 bg-background-secondary rounded-lg">
                <p className="text-sm text-text-secondary">当前库存</p>
                <p className="text-2xl font-bold text-text-primary">{selectedProduct.stock} 件</p>
              </div>

              {/* 调整数量 */}
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
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowAdjustment(false)
                    setSelectedProduct(null)
                    setAdjustmentQuantity(1)
                  }}
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
                    adjustInventory(selectedProduct, change)
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
                    '确认调整'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}