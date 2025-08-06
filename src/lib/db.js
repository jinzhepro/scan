import postgres from "postgres";

/**
 * PostgreSQL数据库连接配置
 * 使用postgres.js库连接Supabase PostgreSQL数据库
 */
const sql = postgres(process.env.POSTGRES_URL, {
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
 * 创建出库记录表
 */
export async function createOutboundRecordsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS outbound_records (
        id SERIAL PRIMARY KEY,
        barcode VARCHAR(255) NOT NULL,
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER DEFAULT 1,
        outbound_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log("✅ 出库记录表创建成功");
    return true;
  } catch (error) {
    console.error("❌ 创建出库记录表失败:", error);
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
  await createOutboundRecordsTable();

  console.log("✅ 数据库初始化完成");
}
