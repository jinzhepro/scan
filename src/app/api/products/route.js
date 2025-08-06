import { NextResponse } from "next/server";
import { getAllProducts, createProduct, searchProducts } from "@/lib/products";

/**
 * 获取商品列表或搜索商品
 * GET /api/products?search=keyword&limit=50&offset=0
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "200");
    const offset = parseInt(searchParams.get("offset") || "0");

    let products;
    if (search) {
      products = await searchProducts(search);
    } else {
      products = await getAllProducts(limit, offset);
    }

    return NextResponse.json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error) {
    console.error("获取商品列表失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: "获取商品列表失败",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * 创建新商品
 * POST /api/products
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { barcode, name, price, stock, expiry_date } = body;

    // 验证必需字段
    if (!barcode || !name || price === undefined) {
      return NextResponse.json(
        { error: "条形码、商品名称和价格为必需字段" },
        { status: 400 }
      );
    }

    const product = await createProduct({
      barcode,
      name,
      price,
      stock: stock || 0,
      expiry_date,
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("创建商品失败:", error);
    return NextResponse.json({ error: "创建商品失败" }, { status: 500 });
  }
}
