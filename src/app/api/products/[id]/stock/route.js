import { NextResponse } from "next/server";
import { adjustProductStock } from "@/lib/products";

/**
 * 调整商品库存
 * PUT /api/products/[id]/stock
 * Body: { type: 'add' | 'subtract' | 'set', quantity: number, reason?: string }
 */
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const { type, quantity, reason } = await request.json();

    // 验证商品ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        {
          success: false,
          error: "无效的商品ID",
        },
        { status: 400 }
      );
    }

    // 验证调整类型
    if (!type || !["add", "subtract", "set"].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: "无效的调整类型，必须是 add、subtract 或 set",
        },
        { status: 400 }
      );
    }

    // 验证数量
    if (!quantity || isNaN(parseInt(quantity)) || parseInt(quantity) <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "无效的数量，必须是大于0的整数",
        },
        { status: 400 }
      );
    }

    // 调整库存
    const result = await adjustProductStock(parseInt(id), {
      type,
      quantity: parseInt(quantity),
      reason: reason || "手动调整",
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.product,
      message: "库存调整成功",
      adjustment: {
        type,
        quantity: parseInt(quantity),
        reason: reason || "手动调整",
        oldStock: result.oldStock,
        newStock: result.product.stock,
      },
    });
  } catch (error) {
    console.error("库存调整失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: "库存调整失败：" + error.message,
      },
      { status: 500 }
    );
  }
}
