import sql from "./db.js";

/**
 * 创建出库记录
 * @param {string} barcode - 扫描的条形码
 * @param {number|null} productId - 商品ID（如果找到对应商品）
 * @param {number} quantity - 出库数量，默认为1
 * @returns {Object} 创建的出库记录
 */
export async function createOutboundRecord(
  barcode,
  productId = null,
  quantity = 1
) {
  try {
    const result = await sql`
      INSERT INTO outbound_records (barcode, product_id, quantity)
      VALUES (${barcode}, ${productId}, ${quantity})
      RETURNING *
    `;

    console.log("✅ 出库记录创建成功:", result[0]);
    return result[0];
  } catch (error) {
    console.error("创建出库记录失败:", error);
    throw error;
  }
}

/**
 * 获取出库记录列表
 * @param {number} limit - 限制数量
 * @param {number} offset - 偏移量
 * @returns {Array} 出库记录列表（包含商品信息）
 */
export async function getOutboundRecords(limit = 50, offset = 0) {
  try {
    const result = await sql`
      SELECT 
        outbound_rec.*,
        p.name as product_name,
        p.price as product_price,
        p.stock as product_stock
      FROM outbound_records outbound_rec
      LEFT JOIN products p ON outbound_rec.product_id = p.id
      ORDER BY outbound_rec.outbound_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return result;
  } catch (error) {
    console.error("获取出库记录失败:", error);
    throw error;
  }
}

/**
 * 获取出库统计信息
 * @returns {Object} 统计信息
 */
export async function getOutboundStatistics() {
  try {
    const [totalOutbound] = await sql`
      SELECT COUNT(*) as total, SUM(quantity) as total_quantity FROM outbound_records
    `;

    const [todayOutbound] = await sql`
      SELECT COUNT(*) as today, SUM(quantity) as today_quantity FROM outbound_records
      WHERE DATE(outbound_at) = CURRENT_DATE
    `;

    const [uniqueProducts] = await sql`
      SELECT COUNT(DISTINCT barcode) as unique_products FROM outbound_records
    `;

    const [knownProducts] = await sql`
      SELECT COUNT(*) as known FROM outbound_records
      WHERE product_id IS NOT NULL
    `;

    return {
      totalOutbound: parseInt(totalOutbound.total),
      totalQuantity: parseInt(totalOutbound.total_quantity || 0),
      todayOutbound: parseInt(todayOutbound.today),
      todayQuantity: parseInt(todayOutbound.today_quantity || 0),
      uniqueProducts: parseInt(uniqueProducts.unique_products),
      knownProducts: parseInt(knownProducts.known),
      unknownProducts:
        parseInt(totalOutbound.total) - parseInt(knownProducts.known),
    };
  } catch (error) {
    console.error("获取出库统计失败:", error);
    throw error;
  }
}

/**
 * 根据条形码获取出库历史
 * @param {string} barcode - 条形码
 * @returns {Array} 该条形码的出库历史
 */
export async function getOutboundHistoryByBarcode(barcode) {
  try {
    const result = await sql`
      SELECT 
        outbound_rec.*,
        p.name as product_name,
        p.price as product_price,
        p.stock as product_stock
      FROM outbound_records outbound_rec
      LEFT JOIN products p ON outbound_rec.product_id = p.id
      WHERE outbound_rec.barcode = ${barcode}
      ORDER BY outbound_rec.outbound_at DESC
    `;
    return result;
  } catch (error) {
    console.error("获取出库历史失败:", error);
    throw error;
  }
}

/**
 * 删除出库记录
 * @param {number} id - 出库记录ID
 * @returns {boolean} 删除是否成功
 */
export async function deleteOutboundRecord(id) {
  try {
    const result = await sql`
      DELETE FROM outbound_records 
      WHERE id = ${id}
      RETURNING id
    `;

    const deleted = result.length > 0;
    if (deleted) {
      console.log("✅ 出库记录删除成功, ID:", id);
    }
    return deleted;
  } catch (error) {
    console.error("删除出库记录失败:", error);
    throw error;
  }
}

/**
 * 获取热门出库商品
 * @param {number} limit - 限制数量
 * @returns {Array} 热门商品列表
 */
export async function getPopularOutboundProducts(limit = 10) {
  try {
    const result = await sql`
      SELECT 
        outbound_rec.barcode,
        COUNT(*) as outbound_count,
        SUM(outbound_rec.quantity) as total_quantity,
        p.name as product_name,
        p.price as product_price,
        p.stock as product_stock,
        MAX(outbound_rec.outbound_at) as last_outbound
      FROM outbound_records outbound_rec
      LEFT JOIN products p ON outbound_rec.product_id = p.id
      GROUP BY outbound_rec.barcode, p.name, p.price, p.stock
      ORDER BY outbound_count DESC, last_outbound DESC
      LIMIT ${limit}
    `;
    return result;
  } catch (error) {
    console.error("获取热门商品失败:", error);
    throw error;
  }
}
