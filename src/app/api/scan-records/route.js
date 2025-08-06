import { NextResponse } from "next/server";
import {
  getScanRecords,
  getScanStatistics,
  getPopularScannedProducts,
} from "@/lib/scanRecords";

/**
 * 获取扫描记录列表
 * GET /api/scan-records?limit=50&offset=0&stats=true&popular=true
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const includeStats = searchParams.get("stats") === "true";
    const includePopular = searchParams.get("popular") === "true";

    const response = {
      success: true,
    };

    // 获取扫描记录
    const records = await getScanRecords(limit, offset);
    response.data = records;
    response.count = records.length;

    // 获取统计信息
    if (includeStats) {
      const stats = await getScanStatistics();
      response.statistics = stats;
    }

    // 获取热门商品
    if (includePopular) {
      const popular = await getPopularScannedProducts(10);
      response.popular = popular;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("获取扫描记录失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: "获取扫描记录失败",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
