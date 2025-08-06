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
 * @returns {Object|null} 更新后的商品信息或null（如果商品不存在）
 */
export async function updateProduct(id, updateData) {
  try {
    const { name, price, stock, expiry_date } = updateData;

    // 验证商品ID
    if (!id || isNaN(id)) {
      throw new Error("无效的商品ID");
    }

    // 验证库存不能为负数
    if (stock !== undefined && stock < 0) {
      throw new Error("库存不能为负数");
    }

    // 构建动态更新字段，只包含非undefined的值
    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = $' + (updateValues.length + 2)); // +2 因为id是第一个参数
      updateValues.push(name);
    }
    if (price !== undefined) {
      updateFields.push('price = $' + (updateValues.length + 2));
      updateValues.push(price);
    }
    if (stock !== undefined) {
      updateFields.push('stock = $' + (updateValues.length + 2));
      updateValues.push(stock);
    }
    if (expiry_date !== undefined) {
      updateFields.push('expiry_date = $' + (updateValues.length + 2));
      updateValues.push(expiry_date);
    }

    // 如果没有要更新的字段，直接返回当前商品信息
    if (updateFields.length === 0) {
      const result = await sql`SELECT * FROM products WHERE id = ${id}`;
      return result[0] || null;
    }

    // 添加updated_at字段
    updateFields.push('updated_at = CURRENT_TIMESTAMP');

    // 构建SQL查询
    const query = `
      UPDATE products 
      SET ${updateFields.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    const result = await sql.unsafe(query, [id, ...updateValues]);

    if (result.length === 0) {
      console.log("⚠️ 商品不存在, ID:", id);
      return null;
    }

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
