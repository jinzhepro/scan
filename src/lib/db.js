import { neon } from "@neondatabase/serverless";


const sql = neon(process.env.DATABASE_URL, {
  ssl: "require",
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10,
});

export default sql;

/**
 * 测试数据库连接
 */
export async function testConnection() {
  try {
    const result = await sql`SELECT version()`;
    console.log("✅ 数据库连接成功:", result[0].version);
    return true;
  } catch (error) {
    console.error("❌ 数据库连接失败:", error);
    return false;
  }
}

/**
 * 创建商品表
 */
export async function createProductsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        barcode VARCHAR(255) UNIQUE NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        stock INTEGER DEFAULT 0,
        available_stock INTEGER DEFAULT 0,
        expiry_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log("✅ 商品表创建成功");
    return true;
  } catch (error) {
    console.error("❌ 创建商品表失败:", error);
    return false;
  }
}



/**
 * 添加可用库存字段到现有商品表
 */
export async function addAvailableStockColumn() {
  try {
    // 检查字段是否已存在
    const columnExists = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name = 'available_stock'
    `;

    if (columnExists.length === 0) {
      // 添加可用库存字段
      await sql`
        ALTER TABLE products 
        ADD COLUMN available_stock INTEGER DEFAULT 0
      `;
      
      // 将现有商品的可用库存设置为与总库存相同
      await sql`
        UPDATE products 
        SET available_stock = stock 
        WHERE available_stock IS NULL OR available_stock = 0
      `;
      
      console.log("✅ 可用库存字段添加成功");
    } else {
      console.log("ℹ️  可用库存字段已存在，跳过添加");
    }
    
    return true;
  } catch (error) {
    console.error("❌ 添加可用库存字段失败:", error);
    return false;
  }
}



/**
 * 初始化数据库表
 */
export async function initDatabase() {
  console.log("🔄 正在初始化数据库...");

  const connectionTest = await testConnection();
  if (!connectionTest) {
    throw new Error("数据库连接失败");
  }

  await createProductsTable();
  await addAvailableStockColumn(); // 添加可用库存字段迁移

  console.log("✅ 数据库初始化完成");
}
