import sql from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * 创建新订单
 */
export async function POST(request) {
  try {
    const { items, totalAmount, discountAmount, finalAmount } = await request.json();

    // 验证必要字段
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: '订单商品不能为空' },
        { status: 400 }
      );
    }

    if (typeof totalAmount !== 'number' || totalAmount < 0) {
      return NextResponse.json(
        { error: '订单总金额无效' },
        { status: 400 }
      );
    }

    // 生成订单号
    const orderNumber = `ORD${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    // 使用安全的事务处理
    const result = await sql.begin(async sql => {
      // 插入订单主表
      const [order] = await sql`
        INSERT INTO orders (
          order_number,
          total_amount,
          discount_amount,
          final_amount,
          status,
          created_at
        ) VALUES (
          ${orderNumber},
          ${totalAmount},
          ${discountAmount || 0},
          ${finalAmount},
          'completed',
          CURRENT_TIMESTAMP
        )
        RETURNING id, order_number, created_at
      `;

      // 插入订单商品明细
      for (const item of items) {
        await sql`
          INSERT INTO order_items (
            order_id,
            barcode,
            product_name,
            price,
            quantity,
            subtotal
          ) VALUES (
            ${order.id},
            ${item.barcode},
            ${item.name},
            ${item.price},
            ${item.quantity},
            ${item.price * item.quantity}
          )
        `;

        // 更新商品库存（同时减少总库存和可用库存）
        await sql`
          UPDATE products 
          SET 
            stock = stock - ${item.quantity},
            available_stock = available_stock - ${item.quantity}
          WHERE barcode = ${item.barcode}
        `;
      }

      return order;
    });

    return NextResponse.json({
      success: true,
      order: {
        id: result.id,
        orderNumber: result.order_number,
        totalAmount,
        discountAmount: discountAmount || 0,
        finalAmount,
        items,
        createdAt: result.created_at
      }
    });

  } catch (error) {
    console.error('创建订单失败:', error);
    return NextResponse.json(
      { error: '创建订单失败，请重试' },
      { status: 500 }
    );
  }
}

/**
 * 获取订单列表
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const offset = (page - 1) * limit;

    // 获取订单列表
    const orders = await sql`
      SELECT 
        id,
        order_number,
        total_amount,
        discount_amount,
        final_amount,
        status,
        created_at
      FROM orders 
      ORDER BY created_at DESC 
      LIMIT ${limit} OFFSET ${offset}
    `;

    // 获取总数
    const [{ count }] = await sql`
      SELECT COUNT(*) as count FROM orders
    `;

    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total: parseInt(count),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('获取订单列表失败:', error);
    return NextResponse.json(
      { error: '获取订单列表失败' },
      { status: 500 }
    );
  }
}