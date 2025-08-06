import { NextResponse } from "next/server";
import {
  seedDatabase,
  clearAllData,
  resetDatabase,
  getDatabaseStats,
} from "@/lib/seed";

/**
 * GET - 获取数据库统计信息
 */
export async function GET() {
  try {
    const stats = await getDatabaseStats();
    return NextResponse.json({
      success: true,
      data: stats,
      message: "获取数据库统计信息成功",
    });
  } catch (error) {
    console.error("获取数据库统计信息失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: "获取数据库统计信息失败",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST - 执行种子数据操作
 * Body: { action: 'seed' | 'clear' | 'reset' }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { action } = body;

    let result;

    switch (action) {
      case "seed":
        // 插入种子数据
        result = await seedDatabase();
        break;

      case "clear":
        // 清空所有数据
        result = await clearAllData();
        break;

      case "reset":
        // 重新初始化（清空并插入种子数据）
        result = await resetDatabase();
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: "无效的操作类型",
            message: "支持的操作: seed, clear, reset",
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: result.message,
    });
  } catch (error) {
    console.error("种子数据操作失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: "种子数据操作失败",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
