import sql from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * 获取单个订单详情
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: '订单ID不能为空' },
        { status: 400 }
      );
    }

    // 获取订单基本信息
    const [order] = await sql`
      SELECT 
        id,
        order_number,
        total_amount,
        discount_amount,
        final_amount,
        status,
        created_at,
        updated_at
      FROM orders 
      WHERE id = ${id}
    `;

    if (!order) {
      return NextResponse.json(
        { error: '订单不存在' },
        { status: 404 }
      );
    }

    // 获取订单商品明细
    const orderItems = await sql`
      SELECT 
        id,
        barcode,
        product_name,
        price,
        quantity,
        subtotal,
        created_at
      FROM order_items 
      WHERE order_id = ${id}
      ORDER BY created_at ASC
    `;

    // 组装完整的订单信息
    const orderDetail = {
      ...order,
      items: orderItems
    };

    return NextResponse.json({
      success: true,
      order: orderDetail
    });

  } catch (error) {
    console.error('获取订单详情失败:', error);
    return NextResponse.json(
      { error: '获取订单详情失败' },
      { status: 500 }
    );
  }
}

/**
 * 更新订单状态
 */
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const { status } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: '订单ID不能为空' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: '订单状态不能为空' },
        { status: 400 }
      );
    }

    // 验证状态值
    const validStatuses = ['pending', 'completed', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: '无效的订单状态' },
        { status: 400 }
      );
    }

    // 更新订单状态
    const [updatedOrder] = await sql`
      UPDATE orders 
      SET 
        status = ${status},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, order_number, status, updated_at
    `;

    if (!updatedOrder) {
      return NextResponse.json(
        { error: '订单不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder
    });

  } catch (error) {
    console.error('更新订单状态失败:', error);
    return NextResponse.json(
      { error: '更新订单状态失败' },
      { status: 500 }
    );
  }
}

/**
 * 删除订单（软删除或硬删除）
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: '订单ID不能为空' },
        { status: 400 }
      );
    }

    // 检查订单是否存在
    const [order] = await sql`
      SELECT id, status FROM orders WHERE id = ${id}
    `;

    if (!order) {
      return NextResponse.json(
        { error: '订单不存在' },
        { status: 404 }
      );
    }

    // 只允许删除已取消的订单
    if (order.status !== 'cancelled') {
      return NextResponse.json(
        { error: '只能删除已取消的订单' },
        { status: 400 }
      );
    }

    // 开始事务删除订单和相关数据
    await sql.begin(async sql => {
      // 删除订单商品明细
      await sql`
        DELETE FROM order_items WHERE order_id = ${id}
      `;
      
      // 删除订单主记录
      await sql`
        DELETE FROM orders WHERE id = ${id}
      `;
    });

    return NextResponse.json({
      success: true,
      message: '订单删除成功'
    });

  } catch (error) {
    console.error('删除订单失败:', error);
    return NextResponse.json(
      { error: '删除订单失败' },
      { status: 500 }
    );
  }
}