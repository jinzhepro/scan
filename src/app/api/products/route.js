import { NextResponse } from 'next/server';
import { 
  getAllProducts, 
  createProduct, 
  searchProducts 
} from '@/lib/products';

/**
 * 获取商品列表或搜索商品
 * GET /api/products?search=keyword&limit=50&offset=0
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let products;
    if (search) {
      products = await searchProducts(search);
    } else {
      products = await getAllProducts(limit, offset);
    }

    return NextResponse.json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (error) {
    console.error('获取商品列表失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '获取商品列表失败',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * 创建新商品
 * POST /api/products
 */
export async function POST(request) {
  try {
    const body = await request.json();
    
    // 验证必需字段
    if (!body.name || !body.barcode || !body.price) {
      return NextResponse.json(
        { 
          success: false, 
          error: '缺少必需字段: name, barcode, price' 
        },
        { status: 400 }
      );
    }

    const product = await createProduct(body);
    
    return NextResponse.json({
      success: true,
      data: product,
      message: '商品创建成功'
    }, { status: 201 });
  } catch (error) {
    console.error('创建商品失败:', error);
    
    // 处理重复条形码错误
    if (error.code === '23505') {
      return NextResponse.json(
        { 
          success: false, 
          error: '条形码已存在',
          message: '该条形码已被其他商品使用' 
        },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: '创建商品失败',
        message: error.message 
      },
      { status: 500 }
    );
  }
}