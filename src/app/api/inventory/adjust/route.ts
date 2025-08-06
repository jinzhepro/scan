import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import type { InventoryAdjustRequest, InventoryAdjustResponse, ApiResponse, InventoryReason } from '@/types'

/**
 * 调整商品库存
 * POST /api/inventory/adjust
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const body: InventoryAdjustRequest = await request.json()
    const { product_id, barcode, quantity_change, reason, operator_id } = body

    // 验证请求参数
    if ((!product_id && !barcode) || !quantity_change || !reason) {
      return NextResponse.json({
        success: false,
        message: '缺少必要参数：需要商品ID或条形码、调整数量和调整原因'
      }, { status: 400 })
    }

    if (quantity_change === 0) {
      return NextResponse.json({
        success: false,
        message: '调整数量不能为0'
      }, { status: 400 })
    }

    // 验证调整原因
    const validReasons = ['sale', 'restock', 'damage', 'adjustment', 'return'] as const
    if (!validReasons.includes(reason as any)) {
      return NextResponse.json({
        success: false,
        message: '无效的调整原因'
      }, { status: 400 })
    }

    // 获取操作员ID（从认证头或请求体）
    let actualOperatorId = operator_id
    if (!actualOperatorId) {
      const authHeader = request.headers.get('authorization')
      if (authHeader) {
        try {
          const token = authHeader.replace('Bearer ', '')
          const { data: { user } } = await supabaseAdmin.auth.getUser(token)
          if (user) {
            actualOperatorId = user.id
          }
        } catch (err) {
          console.warn('获取用户信息失败:', err)
        }
      }
    }

    if (!actualOperatorId) {
      return NextResponse.json({
        success: false,
        message: '需要提供操作员信息'
      }, { status: 401 })
    }

    // 确定商品ID
    let finalProductId = product_id
    if (!finalProductId && barcode) {
      const { data: product, error: productError } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('barcode', barcode)
        .single()

      if (productError || !product) {
        return NextResponse.json({
          success: false,
          message: '商品不存在'
        }, { status: 404 })
      }

      finalProductId = product.id
    }

    // 调用库存调整函数
    const { data, error } = await supabaseAdmin.rpc('adjust_inventory', {
      p_product_id: finalProductId,
      p_quantity_change: quantity_change,
      p_reason: reason,
      p_operator_id: actualOperatorId
    })

    if (error) {
      console.error('库存调整失败:', error)
      return NextResponse.json({
        success: false,
        message: '库存调整失败'
      }, { status: 500 })
    }

    const result = data as { success: boolean; message: string; data?: { new_stock: number; log_id: string } }
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: result.message
      }, { status: 400 })
    }

    // 获取更新后的商品信息
    const { data: updatedProduct, error: fetchError } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', finalProductId)
      .single()

    if (fetchError) {
      console.error('获取更新后商品信息失败:', fetchError)
    }

    const response: InventoryAdjustResponse = {
      product_id: finalProductId!,
      old_stock: (result.data?.new_stock || 0) - quantity_change,
      new_stock: result.data?.new_stock || 0,
      quantity_change,
      reason,
      log_id: result.data?.log_id || '',
      product: updatedProduct || undefined
    }

    return NextResponse.json({
      success: true,
      message: '库存调整成功',
      data: response
    })

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({
      success: false,
      message: '服务器内部错误'
    }, { status: 500 })
  }
}

/**
 * 获取库存调整历史
 * GET /api/inventory/adjust?product_id=xxx&limit=10&offset=0
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('product_id')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 构建查询
    let query = supabaseAdmin
      .from('inventory_logs')
      .select(`
        *,
        product:products(id, name, barcode),
        operator:users(id, nickname)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // 如果指定了商品ID，则过滤
    if (productId) {
      query = query.eq('product_id', productId)
    }

    const { data: logs, error } = await query

    if (error) {
      console.error('获取库存调整历史失败:', error)
      return NextResponse.json({
        success: false,
        message: '获取库存调整历史失败'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '获取成功',
      data: logs || []
    })

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({
      success: false,
      message: '服务器内部错误'
    }, { status: 500 })
  }
}