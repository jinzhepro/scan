import sql from "@/lib/db";
/**
 * 获取单个商品的详细销售记录
 * GET /api/products/[id]/sales-records
 */
export async function GET(request, { params }) {
  try {
    const productId = params.id;

    if (!productId) {
      return Response.json(
        {
          success: false,
          error: '商品ID不能为空'
        },
        { status: 400 }
      );
    }

    // 获取商品基本信息
    const productResult = await sql`
      SELECT id, name, barcode, price FROM products WHERE id = ${productId}
    `;
    
    if (productResult.length === 0) {
      return Response.json(
        {
          success: false,
          error: '商品不存在'
        },
        { status: 404 }
      );
    }
    
    const product = productResult[0];
    const productBarcode = product.barcode;
    
    // 查询商品的详细销售记录
    const result = await sql`
      SELECT 
        o.id as order_id,
        o.total_amount,
        o.discount_amount,
        o.final_amount,
        o.created_at,
        oi.quantity,
        oi.price,
        oi.quantity * oi.price as subtotal,
        oi.product_name,
        oi.barcode
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE oi.barcode = ${productBarcode}
      ORDER BY o.created_at DESC
     `;

    const salesRecords = result;

    // 计算统计数据
    const totalSold = salesRecords.reduce((sum, record) => sum + parseInt(record.quantity), 0);
    const totalRevenue = salesRecords.reduce((sum, record) => sum + parseFloat(record.subtotal), 0);
    const orderCount = salesRecords.length;

    return Response.json({
      success: true,
      data: {
        product,
        statistics: {
          total_sold: totalSold,
          total_revenue: totalRevenue,
          order_count: orderCount
        },
        sales_records: salesRecords
      }
    });
  } catch (error) {
    console.error('获取商品销售记录失败:', error);
    return Response.json(
      {
        success: false,
        error: '获取商品销售记录失败'
      },
      { status: 500 }
    );
  }
}