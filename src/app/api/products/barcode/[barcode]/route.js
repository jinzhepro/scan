import { NextResponse } from "next/server";
import { findProductByBarcode } from "@/lib/products";
import { createScanRecord } from "@/lib/scanRecords";

/**
 * 根据条形码查找商品并记录扫描
 * GET /api/products/barcode/[barcode]
 */
export async function GET(request, { params }) {
  try {
    const { barcode } = await params;

    // 查找商品
    const product = await findProductByBarcode(barcode);

    // 记录扫描
    await createScanRecord(barcode, product?.id || null);

    if (!product) {
      return NextResponse.json({
        success: true,
        found: false,
        barcode: barcode,
        message: "未找到对应商品，已记录扫描",
      });
    }

    return NextResponse.json({
      success: true,
      found: true,
      data: product,
      barcode: barcode,
      message: "商品找到，已记录扫描",
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
