import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import type { Product, ApiResponse } from '@/types'

/**
 * 根据条形码查询商品信息
 * GET /api/products/[barcode]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { barcode: string } }
): Promise<NextResponse<ApiResponse<Product>>> {
  try {
    const { barcode } = params

    // 验证条形码格式
    if (!barcode || barcode.trim().length === 0) {
      return NextResponse.json({
        success: false,
        message: '条形码不能为空'
      }, { status: 400 })
    }

    // 查询商品信息
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('barcode', barcode.trim())
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          message: '商品不存在'
        }, { status: 404 })
      }
      
      console.error('查询商品失败:', error)
      return NextResponse.json({
        success: false,
        message: '查询商品失败'
      }, { status: 500 })
    }

    // 记录扫描历史（如果有用户信息）
    const authHeader = request.headers.get('authorization')
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '')
        const { data: { user } } = await supabaseAdmin.auth.getUser(token)
        
        if (user) {
          await supabaseAdmin.rpc('record_scan_history', {
            p_user_id: user.id,
            p_barcode: barcode
          })
        }
      } catch (err) {
        // 记录扫描历史失败不影响主要功能
        console.warn('记录扫描历史失败:', err)
      }
    }

    return NextResponse.json({
      success: true,
      message: '查询成功',
      data: product
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
 * 更新商品信息
 * PUT /api/products/[barcode]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { barcode: string } }
): Promise<NextResponse<ApiResponse<Product>>> {
  try {
    const { barcode } = params
    const body = await request.json()

    // 验证条形码格式
    if (!barcode || barcode.trim().length === 0) {
      return NextResponse.json({
        success: false,
        message: '条形码不能为空'
      }, { status: 400 })
    }

    // 验证请求体
    const { name, price, description, image_url } = body
    if (!name || typeof price !== 'number' || price < 0) {
      return NextResponse.json({
        success: false,
        message: '商品名称和价格为必填项，价格不能为负数'
      }, { status: 400 })
    }

    // 更新商品信息
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .update({
        name: name.trim(),
        price,
        description: description?.trim() || null,
        image_url: image_url?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('barcode', barcode.trim())
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          message: '商品不存在'
        }, { status: 404 })
      }
      
      console.error('更新商品失败:', error)
      return NextResponse.json({
        success: false,
        message: '更新商品失败'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '更新成功',
      data: product
    })

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({
      success: false,
      message: '服务器内部错误'
    }, { status: 500 })
  }
}