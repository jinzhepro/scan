/**
 * 商品信息类型定义
 */
export interface Product {
  id: string
  barcode: string
  name: string
  price: number
  description?: string
  image_url?: string
  stock: number
  created_at: string
  updated_at: string
}

/**
 * 用户信息类型定义
 */
export interface User {
  id: string
  nickname?: string
  avatar_url?: string
  role: 'user' | 'admin'
  created_at: string
  updated_at: string
}

/**
 * 库存变动日志类型定义
 */
export interface InventoryLog {
  id: string
  product_id: string
  operator_id: string
  quantity_change: number
  stock_before: number
  stock_after: number
  reason: string
  created_at: string
}

/**
 * 扫描历史记录
 */
export interface ScanHistory {
  id: string
  user_id: string
  product_id?: string
  barcode: string
  scanned_at: string
  product?: Product
  // 视图字段
  product_name?: string
  product_price?: number
  product_image_url?: string
}

/**
 * API响应基础类型
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message: string
  error?: string
}

/**
 * 商品查询API响应类型
 */
export interface ProductResponse extends ApiResponse<Product> {}

/**
 * 库存调整请求类型
 */
export interface InventoryAdjustRequest {
  product_id?: string
  barcode?: string
  quantity_change: number
  reason: string
  operator_id: string
}

/**
 * 库存调整响应类型
 */
export interface InventoryAdjustResponse {
  product_id: string
  old_stock: number
  new_stock: number
  quantity_change: number
  reason: string
  log_id: string
  product?: Product
}

/**
 * 扫码结果类型
 */
export interface ScanResult {
  data: string
  format?: string
  timestamp: number
}

/**
 * 摄像头配置类型
 */
export interface CameraConfig {
  facingMode: 'user' | 'environment'
  width?: number
  height?: number
}

/**
 * 页面状态类型
 */
export type PageStatus = 'idle' | 'loading' | 'success' | 'error'

/**
 * 库存调整原因枚举
 */
export enum InventoryReason {
  SALE = 'sale',
  RETURN = 'return',
  DAMAGE = 'damage',
  RESTOCK = 'restock',
  ADJUSTMENT = 'adjustment',
  OTHER = 'other'
}

/**
 * 库存调整原因枚举标签
 */
export const InventoryReasonLabels = {
  sale: '销售出库',
  restock: '补货入库',
  damage: '损坏报废',
  adjustment: '盘点调整',
  return: '退货入库'
} as const

export type InventoryReasonLabelsType = typeof InventoryReasonLabels