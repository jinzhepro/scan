import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import type { Product, ApiResponse } from '@/types'

/**
 * 获取商品列表
 * GET /api/products?search=xxx&stock_filter=low&limit=20&offset=0
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<Product[]>>> {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const stockFilter = searchParams.get('stock_filter') // 'all', 'low', 'out'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sortBy = searchParams.get('sort_by') || 'name' // 'name', 'stock', 'price', 'created_at'
    const sortOrder = searchParams.get('sort_order') || 'asc' // 'asc', 'desc'

    // 验证参数
    if (limit > 100) {
      return NextResponse.json({
        success: false,
        message: '单次查询数量不能超过100条'
      }, { status: 400 })
    }

    // 构建基础查询
    let query = supabaseAdmin
      .from('products')
      .select('*')

    // 搜索过滤
    if (search && search.trim()) {
      const searchTerm = search.trim()
      query = query.or(`name.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
    }

    // 库存状态过滤
    if (stockFilter === 'low') {
      query = query.gt('stock', 0).lte('stock', 10)
    } else if (stockFilter === 'out') {
      query = query.lte('stock', 0)
    }

    // 排序
    const validSortFields = ['name', 'stock', 'price', 'created_at', 'updated_at']
    const validSortOrders = ['asc', 'desc']
    
    if (validSortFields.includes(sortBy) && validSortOrders.includes(sortOrder)) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    } else {
      query = query.order('name', { ascending: true })
    }

    // 分页
    query = query.range(offset, offset + limit - 1)

    const { data: products, error } = await query

    if (error) {
      console.error('获取商品列表失败:', error)
      return NextResponse.json({
        success: false,
        message: '获取商品列表失败'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '获取成功',
      data: products || []
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
 * 创建新商品
 * POST /api/products
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<Product>>> {
  try {
    const body = await request.json()
    const { barcode, name, price, description, image_url, stock = 0 } = body

    // 验证必填字段
    if (!barcode || !name || typeof price !== 'number') {
      return NextResponse.json({
        success: false,
        message: '条形码、商品名称和价格为必填项'
      }, { status: 400 })
    }

    // 验证数据格式
    if (price < 0) {
      return NextResponse.json({
        success: false,
        message: '价格不能为负数'
      }, { status: 400 })
    }

    if (stock < 0) {
      return NextResponse.json({
        success: false,
        message: '库存不能为负数'
      }, { status: 400 })
    }

    // 检查条形码是否已存在
    const { data: existingProduct } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('barcode', barcode.trim())
      .single()

    if (existingProduct) {
      return NextResponse.json({
        success: false,
        message: '该条形码的商品已存在'
      }, { status: 409 })
    }

    // 创建商品
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .insert({
        barcode: barcode.trim(),
        name: name.trim(),
        price,
        description: description?.trim() || null,
        image_url: image_url?.trim() || null,
        stock
      })
      .select()
      .single()

    if (error) {
      console.error('创建商品失败:', error)
      return NextResponse.json({
        success: false,
        message: '创建商品失败'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '创建成功',
      data: product
    }, { status: 201 })

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({
      success: false,
      message: '服务器内部错误'
    }, { status: 500 })
  }
}