import postgres from "postgres";

// 创建PostgreSQL连接
const sql = postgres(process.env.DATABASE_URL, {
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
        expiry_date VARCHAR(255),
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
 * 创建订单表
 */
export async function createOrdersTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(255) UNIQUE NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        discount_amount DECIMAL(10, 2) DEFAULT 0,
        final_amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log("✅ 订单表创建成功");
    return true;
  } catch (error) {
    console.error("❌ 创建订单表失败:", error);
    return false;
  }
}

/**
 * 创建订单商品表
 */
export async function createOrderItemsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        barcode VARCHAR(255) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        quantity INTEGER NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log("✅ 订单商品表创建成功");
    return true;
  } catch (error) {
    console.error("❌ 创建订单商品表失败:", error);
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
  await createOrdersTable();
  await createOrderItemsTable();

  console.log("✅ 数据库初始化完成");
}
