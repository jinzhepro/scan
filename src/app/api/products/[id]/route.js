import { NextResponse } from 'next/server';
import { 
  updateProduct, 
  deleteProduct 
} from '@/lib/products';
import sql from '@/lib/db';

/**
 * 获取单个商品信息
 * GET /api/products/[id]
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    const result = await sql`
      SELECT * FROM products 
      WHERE id = ${id}
      LIMIT 1
    `;
    
    if (result.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: '商品不存在' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error('获取商品信息失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '获取商品信息失败',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * 更新商品信息
 * PUT /api/products/[id]
 */
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    
    const product = await updateProduct(parseInt(id), body);
    
    if (!product) {
      return NextResponse.json(
        { 
          success: false, 
          error: '商品不存在' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product,
      message: '商品更新成功'
    });
  } catch (error) {
    console.error('更新商品失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '更新商品失败',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * 删除商品
 * DELETE /api/products/[id]
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    const deleted = await deleteProduct(parseInt(id));
    
    if (!deleted) {
      return NextResponse.json(
        { 
          success: false, 
          error: '商品不存在' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '商品删除成功'
    });
  } catch (error) {
    console.error('删除商品失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '删除商品失败',
        message: error.message 
      },
      { status: 500 }
    );
  }
}