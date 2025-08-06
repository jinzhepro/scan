import { NextResponse } from "next/server";
import {
  getOutboundRecords,
  getOutboundStatistics,
  getPopularOutboundProducts,
  createOutboundRecord,
  getOutboundHistoryByBarcode,
} from "@/lib/outboundRecords";

/**
 * 获取出库记录列表
 * GET /api/outbound-records?limit=50&offset=0&stats=true&popular=true&barcode=xxx
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const includeStats = searchParams.get("stats") === "true";
    const includePopular = searchParams.get("popular") === "true";
    const barcode = searchParams.get("barcode");

    const response = {
      success: true,
    };

    // 获取出库记录
    let records;
    if (barcode) {
      // 如果指定了条形码，直接查询该条形码的记录
      records = await getOutboundHistoryByBarcode(barcode);
    } else {
      // 否则获取所有记录
      records = await getOutboundRecords(limit, offset);
    }
    
    response.data = records;
    response.count = records.length;

    // 获取统计信息
    if (includeStats) {
      const stats = await getOutboundStatistics();
      response.statistics = stats;
    }

    // 获取热门商品
    if (includePopular) {
      const popular = await getPopularOutboundProducts(10);
      response.popular = popular;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("获取出库记录失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: "获取出库记录失败",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * 创建出库记录
 * POST /api/outbound-records
 */
export async function POST(request) {
  try {
    const { barcode, productId, quantity = 1 } = await request.json();

    if (!barcode) {
      return NextResponse.json(
        {
          success: false,
          error: "条形码不能为空",
        },
        { status: 400 }
      );
    }

    // 创建出库记录
    const record = await createOutboundRecord(barcode, productId, quantity);

    return NextResponse.json({
      success: true,
      data: record,
      message: "出库记录创建成功",
    });
  } catch (error) {
    console.error("创建出库记录失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: "创建出库记录失败",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
