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
    const { name, barcode, price, stock = 0, available_stock, expiry_date } = productData;
    
    // 如果没有指定可用库存，默认等于总库存
    const availableStockValue = available_stock !== undefined ? available_stock : stock;

    const result = await sql`
      INSERT INTO products (
        name, barcode, price, stock, available_stock, expiry_date
      ) VALUES (
        ${name}, ${barcode}, ${price}, ${stock}, ${availableStockValue}, ${expiry_date || null}
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
    const { name, price, stock, available_stock, expiry_date } = updateData;

    // 验证商品ID
    if (!id || isNaN(id)) {
      throw new Error("无效的商品ID");
    }

    // 验证库存不能为负数
    if (stock !== undefined && stock < 0) {
      throw new Error("库存不能为负数");
    }
    
    // 验证可用库存不能为负数
    if (available_stock !== undefined && available_stock < 0) {
      throw new Error("可用库存不能为负数");
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
    if (available_stock !== undefined) {
      updateFields.push('available_stock = $' + (updateValues.length + 2));
      updateValues.push(available_stock);
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

/**
 * 调整商品库存
 * @param {number} id - 商品ID
 * @param {Object} adjustmentData - 调整数据
 * @param {string} adjustmentData.type - 调整类型：'add'增加、'subtract'减少、'set'设置
 * @param {number} adjustmentData.quantity - 调整数量
 * @param {string} adjustmentData.reason - 调整原因
 * @param {boolean} adjustmentData.adjustAvailableStock - 是否同时调整可用库存，默认true
 * @param {boolean} adjustmentData.onlyAvailableStock - 是否仅调整可用库存，默认false
 * @returns {Object} 调整结果
 */
export async function adjustProductStock(id, adjustmentData) {
  try {
    const { type, quantity, reason, adjustAvailableStock = true, onlyAvailableStock = false } = adjustmentData;

    // 验证参数
    if (!id || isNaN(id)) {
      throw new Error("无效的商品ID");
    }

    if (!type || !['add', 'subtract', 'set'].includes(type)) {
      throw new Error("无效的调整类型");
    }

    if (!quantity || isNaN(quantity) || quantity <= 0) {
      throw new Error("无效的调整数量");
    }

    // 获取当前商品信息
    const currentProduct = await sql`
      SELECT * FROM products WHERE id = ${id}
    `;

    if (currentProduct.length === 0) {
      return {
        success: false,
        error: "商品不存在"
      };
    }

    const product = currentProduct[0];
    const oldStock = product.stock;
    const oldAvailableStock = product.available_stock || 0;
    let newStock;
    let newAvailableStock;

    // 根据调整类型计算新库存
    if (onlyAvailableStock) {
      // 仅调整可用库存
      newStock = oldStock; // 总库存保持不变
      
      switch (type) {
        case 'add':
          newAvailableStock = oldAvailableStock + quantity;
          break;
        case 'subtract':
          newAvailableStock = oldAvailableStock - quantity;
          
          if (newAvailableStock < 0) {
            return {
              success: false,
              error: `减少数量(${quantity})超过当前可用库存(${oldAvailableStock})`
            };
          }
          break;
        case 'set':
          newAvailableStock = quantity;
          
          if (newAvailableStock < 0) {
            return {
              success: false,
              error: "可用库存不能设置为负数"
            };
          }
          break;
        default:
          return {
            success: false,
            error: "无效的调整类型"
          };
      }
      
      // 确保可用库存不超过总库存
      if (newAvailableStock > newStock) {
        return {
          success: false,
          error: `可用库存(${newAvailableStock})不能超过总库存(${newStock})`
        };
      }
    } else {
      // 调整总库存（可选择是否同时调整可用库存）
      switch (type) {
        case 'add':
          newStock = oldStock + quantity;
          newAvailableStock = adjustAvailableStock ? oldAvailableStock + quantity : oldAvailableStock;
          break;
        case 'subtract':
          newStock = oldStock - quantity;
          newAvailableStock = adjustAvailableStock ? oldAvailableStock - quantity : oldAvailableStock;
          
          if (newStock < 0) {
            return {
              success: false,
              error: `减少数量(${quantity})超过当前库存(${oldStock})`
            };
          }
          
          if (adjustAvailableStock && newAvailableStock < 0) {
            return {
              success: false,
              error: `减少数量(${quantity})超过当前可用库存(${oldAvailableStock})`
            };
          }
          break;
        case 'set':
          newStock = quantity;
          newAvailableStock = adjustAvailableStock ? Math.min(quantity, oldAvailableStock) : oldAvailableStock;
          
          if (newStock < 0) {
            return {
              success: false,
              error: "库存不能设置为负数"
            };
          }
          break;
        default:
          return {
            success: false,
            error: "无效的调整类型"
          };
      }
      
      // 确保可用库存不超过总库存
      if (newAvailableStock > newStock) {
        newAvailableStock = newStock;
      }
    }

    // 更新库存
    const result = await sql`
      UPDATE products 
      SET stock = ${newStock}, 
          available_stock = ${newAvailableStock},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return {
        success: false,
        error: "库存更新失败"
      };
    }

    console.log(`✅ 库存调整成功: ${product.name} (${product.barcode}) 总库存: ${oldStock} → ${newStock}, 可用库存: ${oldAvailableStock} → ${newAvailableStock} (${type}: ${quantity})`);

    return {
      success: true,
      product: result[0],
      oldStock,
      newStock,
      oldAvailableStock,
      newAvailableStock,
      adjustment: {
        type,
        quantity,
        reason,
        adjustAvailableStock
      }
    };
  } catch (error) {
    console.error("调整库存失败:", error);
    throw error;
  }
}
