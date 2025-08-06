import { NextResponse } from "next/server";
import { addOutboundStockColumns } from "@/lib/db";

/**
 * 数据库迁移API
 * 用于添加缺失的数据库字段
 */
export async function POST() {
  try {
    console.log("🔄 开始数据库迁移...");

    // 添加出库记录表的库存字段
    await addOutboundStockColumns();

    console.log("✅ 数据库迁移完成");

    return NextResponse.json({
      success: true,
      message: "数据库迁移成功，已添加出库记录库存字段",
    });
  } catch (error) {
    console.error("❌ 数据库迁移失败:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "数据库迁移失败",
      },
      { status: 500 }
    );
  }
}

/**
 * 获取数据库表结构信息
 */
export async function GET() {
  try {
    const sql = (await import("@/lib/db")).default;
    
    // 查询出库记录表的字段信息
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'outbound_records'
      ORDER BY ordinal_position
    `;

    return NextResponse.json({
      success: true,
      data: {
        table: "outbound_records",
        columns: columns,
      },
    });
  } catch (error) {
    console.error("❌ 获取表结构失败:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "获取表结构失败",
      },
      { status: 500 }
    );
  }
}