import { NextResponse } from "next/server";
import { getExpiringProducts, getExpiredProducts } from "@/lib/products";

/**
 * 获取即将过期和已过期的商品
 * GET /api/products/expiry?type=expiring&days=7
 * GET /api/products/expiry?type=expired
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "expiring";
    const days = parseInt(searchParams.get("days") || "7");

    let products;
    if (type === "expired") {
      products = await getExpiredProducts();
    } else {
      products = await getExpiringProducts(days);
    }

    return NextResponse.json({
      success: true,
      data: products,
      count: products.length,
      type,
      ...(type === "expiring" && { days }),
    });
  } catch (error) {
    console.error("获取过期商品信息失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: "获取过期商品信息失败",
        message: error.message,
      },
      { status: 500 }
    );
  }
}