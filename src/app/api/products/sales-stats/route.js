import sql from "@/lib/db";
/**
 * 获取商品销售统计数据
 * GET /api/products/sales-stats
 */
export async function GET() {
  try {
    // 查询每个商品的销售统计
    const result = await sql`
      SELECT 
        p.id,
        p.name,
        p.barcode,
        COALESCE(SUM(oi.quantity), 0) as total_sold,
        COUNT(DISTINCT o.id) as order_count,
        COALESCE(SUM(oi.quantity * oi.price), 0) as total_revenue
      FROM products p
      LEFT JOIN order_items oi ON p.barcode = oi.barcode
      LEFT JOIN orders o ON oi.order_id = o.id
      GROUP BY p.id, p.name, p.barcode
      ORDER BY total_sold DESC
    `;

    return Response.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取商品销售统计失败:', error);
    return Response.json(
      {
        success: false,
        error: '获取商品销售统计失败'
      },
      { status: 500 }
    );
  }
}