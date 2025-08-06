import sql from "./db.js";

/**
 * 根据条形码查找商品
 * @param {string} barcode - 商品条形码
 * @returns {Object|null} 商品信息或null
 */
export async function findProductByBarcode(barcode) {
  try {
    const result = await sql`
      SELECT * FROM products 
      WHERE barcode = ${barcode}
      LIMIT 1
    `;
    return result[0] || null;
  } catch (error) {
    console.error("查找商品失败:", error);
    throw error;
  }
}

/**
 * 创建新商品
 * @param {Object} productData - 商品数据
 * @returns {Object} 创建的商品信息
 */
export async function createProduct(productData) {
  try {
    const { name, barcode, price, stock = 0, expiry_date } = productData;

    const result = await sql`
      INSERT INTO products (
        name, barcode, price, stock, expiry_date
      ) VALUES (
        ${name}, ${barcode}, ${price}, ${stock}, ${expiry_date || null}
      )
      RETURNING *
    `;

    console.log("✅ 商品创建成功:", result[0]);
    return result[0];
  } catch (error) {
    console.error("创建商品失败:", error);
    throw error;
  }
}

/**
 * 更新商品信息
 * @param {number} id - 商品ID
 * @param {Object} updateData - 更新的数据
 * @returns {Object} 更新后的商品信息
 */
export async function updateProduct(id, updateData) {
  try {
    const { name, price, stock, expiry_date } = updateData;

    const result = await sql`
      UPDATE products 
      SET 
        name = COALESCE(${name}, name),
        price = COALESCE(${price}, price),
        stock = COALESCE(${stock}, stock),
        expiry_date = COALESCE(${expiry_date}, expiry_date),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    console.log("✅ 商品更新成功:", result[0]);
    return result[0];
  } catch (error) {
    console.error("更新商品失败:", error);
    throw error;
  }
}

/**
 * 删除商品
 * @param {number} id - 商品ID
 * @returns {boolean} 删除是否成功
 */
export async function deleteProduct(id) {
  try {
    const result = await sql`
      DELETE FROM products 
      WHERE id = ${id}
      RETURNING id
    `;

    const deleted = result.length > 0;
    if (deleted) {
      console.log("✅ 商品删除成功, ID:", id);
    }
    return deleted;
  } catch (error) {
    console.error("删除商品失败:", error);
    throw error;
  }
}

/**
 * 获取所有商品列表
 * @param {number} limit - 限制数量
 * @param {number} offset - 偏移量
 * @returns {Array} 商品列表
 */
export async function getAllProducts(limit = 50, offset = 0) {
  try {
    const result = await sql`
      SELECT * FROM products 
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return result;
  } catch (error) {
    console.error("获取商品列表失败:", error);
    throw error;
  }
}

/**
 * 搜索商品
 * @param {string} keyword - 搜索关键词
 * @returns {Array} 搜索结果
 */
export async function searchProducts(keyword) {
  try {
    const result = await sql`
      SELECT * FROM products 
      WHERE 
        name ILIKE ${"%" + keyword + "%"} OR
        barcode ILIKE ${"%" + keyword + "%"}
      ORDER BY created_at DESC
    `;
    return result;
  } catch (error) {
    console.error("搜索商品失败:", error);
    throw error;
  }
}

/**
 * 获取即将过期的商品
 * @param {number} days - 多少天内过期（默认7天）
 * @returns {Array} 即将过期的商品列表
 */
export async function getExpiringProducts(days = 7) {
  try {
    const result = await sql`
      SELECT * FROM products 
      WHERE expiry_date IS NOT NULL 
        AND expiry_date <= CURRENT_DATE + INTERVAL '${days} days'
        AND expiry_date >= CURRENT_DATE
      ORDER BY expiry_date ASC
    `;
    return result;
  } catch (error) {
    console.error("获取即将过期商品失败:", error);
    throw error;
  }
}

/**
 * 获取已过期的商品
 * @returns {Array} 已过期的商品列表
 */
export async function getExpiredProducts() {
  try {
    const result = await sql`
      SELECT * FROM products 
      WHERE expiry_date IS NOT NULL 
        AND expiry_date < CURRENT_DATE
      ORDER BY expiry_date DESC
    `;
    return result;
  } catch (error) {
    console.error("获取已过期商品失败:", error);
    throw error;
  }
}
