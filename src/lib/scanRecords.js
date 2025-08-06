import sql from "./db.js";

/**
 * 创建扫描记录
 * @param {string} barcode - 扫描的条形码
 * @param {number|null} productId - 商品ID（如果找到对应商品）
 * @returns {Object} 创建的扫描记录
 */
export async function createScanRecord(barcode, productId = null) {
  try {
    const result = await sql`
      INSERT INTO scan_records (barcode, product_id)
      VALUES (${barcode}, ${productId})
      RETURNING *
    `;

    console.log("✅ 扫描记录创建成功:", result[0]);
    return result[0];
  } catch (error) {
    console.error("创建扫描记录失败:", error);
    throw error;
  }
}

/**
 * 获取扫描记录列表
 * @param {number} limit - 限制数量
 * @param {number} offset - 偏移量
 * @returns {Array} 扫描记录列表（包含商品信息）
 */
export async function getScanRecords(limit = 50, offset = 0) {
  try {
    const result = await sql`
      SELECT 
        sr.*,
        p.name as product_name,
        p.price as product_price
      FROM scan_records sr
      LEFT JOIN products p ON sr.product_id = p.id
      ORDER BY sr.scanned_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return result;
  } catch (error) {
    console.error("获取扫描记录失败:", error);
    throw error;
  }
}

/**
 * 获取扫描统计信息
 * @returns {Object} 统计信息
 */
export async function getScanStatistics() {
  try {
    const [totalScans] = await sql`
      SELECT COUNT(*) as total FROM scan_records
    `;

    const [todayScans] = await sql`
      SELECT COUNT(*) as today FROM scan_records
      WHERE DATE(scanned_at) = CURRENT_DATE
    `;

    const [uniqueProducts] = await sql`
      SELECT COUNT(DISTINCT barcode) as unique_products FROM scan_records
    `;

    const [knownProducts] = await sql`
      SELECT COUNT(*) as known FROM scan_records
      WHERE product_id IS NOT NULL
    `;

    return {
      totalScans: parseInt(totalScans.total),
      todayScans: parseInt(todayScans.today),
      uniqueProducts: parseInt(uniqueProducts.unique_products),
      knownProducts: parseInt(knownProducts.known),
      unknownProducts:
        parseInt(totalScans.total) - parseInt(knownProducts.known),
    };
  } catch (error) {
    console.error("获取扫描统计失败:", error);
    throw error;
  }
}

/**
 * 根据条形码获取扫描历史
 * @param {string} barcode - 条形码
 * @returns {Array} 该条形码的扫描历史
 */
export async function getScanHistoryByBarcode(barcode) {
  try {
    const result = await sql`
      SELECT 
        sr.*,
        p.name as product_name,
        p.price as product_price
      FROM scan_records sr
      LEFT JOIN products p ON sr.product_id = p.id
      WHERE sr.barcode = ${barcode}
      ORDER BY sr.scanned_at DESC
    `;
    return result;
  } catch (error) {
    console.error("获取扫描历史失败:", error);
    throw error;
  }
}

/**
 * 删除扫描记录
 * @param {number} id - 扫描记录ID
 * @returns {boolean} 删除是否成功
 */
export async function deleteScanRecord(id) {
  try {
    const result = await sql`
      DELETE FROM scan_records 
      WHERE id = ${id}
      RETURNING id
    `;

    const deleted = result.length > 0;
    if (deleted) {
      console.log("✅ 扫描记录删除成功, ID:", id);
    }
    return deleted;
  } catch (error) {
    console.error("删除扫描记录失败:", error);
    throw error;
  }
}

/**
 * 获取热门扫描商品
 * @param {number} limit - 限制数量
 * @returns {Array} 热门商品列表
 */
export async function getPopularScannedProducts(limit = 10) {
  try {
    const result = await sql`
      SELECT 
        sr.barcode,
        COUNT(*) as scan_count,
        p.name as product_name,
        p.price as product_price,
        MAX(sr.scanned_at) as last_scanned
      FROM scan_records sr
      LEFT JOIN products p ON sr.product_id = p.id
      GROUP BY sr.barcode, p.name, p.price
      ORDER BY scan_count DESC, last_scanned DESC
      LIMIT ${limit}
    `;
    return result;
  } catch (error) {
    console.error("获取热门商品失败:", error);
    throw error;
  }
}
