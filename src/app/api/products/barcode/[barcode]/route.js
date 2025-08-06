import { NextResponse } from "next/server";
import { findProductByBarcode } from "@/lib/products";

/**
 * 根据条形码查找商品
 * GET /api/products/barcode/[barcode]
 */
export async function GET(request, { params }) {
  try {
    const { barcode } = await params;

    // 查找商品
    const product = await findProductByBarcode(barcode);

    if (!product) {
      return NextResponse.json({
        success: true,
        found: false,
        barcode: barcode,
        message: "未找到对应商品",
      });
    }

    return NextResponse.json({
      success: true,
      found: true,
      data: product,
      barcode: barcode,
      message: "商品找到",
    });
  } catch (error) {
    console.error("条形码查询失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: "条形码查询失败",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
