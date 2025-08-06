import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import type { ScanHistory, ApiResponse } from "@/types";

/**
 * 获取扫描历史记录
 * GET /api/scan-history?user_id=xxx&limit=10&offset=0
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<ScanHistory[]>>> {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");
    const barcode = searchParams.get("barcode");

    // 验证参数
    if (limit > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "单次查询数量不能超过100条",
        },
        { status: 400 }
      );
    }

    // 获取当前用户（如果没有提供user_id）
    let actualUserId = userId;
    if (!actualUserId) {
      const authHeader = request.headers.get("authorization");
      if (authHeader) {
        try {
          const token = authHeader.replace("Bearer ", "");
          const {
            data: { user },
          } = await supabaseAdmin.auth.getUser(token);
          if (user) {
            actualUserId = user.id;
          }
        } catch (err) {
          console.warn("获取用户信息失败:", err);
        }
      }
    }

    // 构建查询
    let query = supabaseAdmin
      .from("scan_history_detail")
      .select("*")
      .order("scanned_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // 如果指定了用户ID，则过滤
    if (actualUserId) {
      query = query.eq("user_id", actualUserId);
    }

    // 如果指定了条形码，则过滤
    if (barcode) {
      query = query.eq("barcode", barcode);
    }

    const { data: scanHistory, error } = await query;

    if (error) {
      console.error("获取扫描历史失败:", error);
      return NextResponse.json(
        {
          success: false,
          message: "获取扫描历史失败",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "获取成功",
      data: scanHistory || [],
    });
  } catch (error) {
    console.error("API错误:", error);
    return NextResponse.json(
      {
        success: false,
        message: "服务器内部错误",
      },
      { status: 500 }
    );
  }
}

/**
 * 记录扫描历史
 * POST /api/scan-history
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ id: string }>>> {
  try {
    const body = await request.json();
    const { barcode, user_id } = body;

    // 验证必填字段
    if (!barcode) {
      return NextResponse.json(
        {
          success: false,
          message: "条形码为必填项",
        },
        { status: 400 }
      );
    }

    // 获取用户ID（从认证头或请求体）
    let actualUserId = user_id;
    if (!actualUserId) {
      const authHeader = request.headers.get("authorization");
      if (authHeader) {
        try {
          const token = authHeader.replace("Bearer ", "");
          const {
            data: { user },
          } = await supabaseAdmin.auth.getUser(token);
          if (user) {
            actualUserId = user.id;
          }
        } catch (err) {
          console.warn("获取用户信息失败:", err);
        }
      }
    }

    if (!actualUserId) {
      return NextResponse.json(
        {
          success: false,
          message: "需要提供用户信息",
        },
        { status: 401 }
      );
    }

    // 调用记录扫描历史函数
    const { data, error } = await supabaseAdmin.rpc("record_scan_history", {
      p_user_id: actualUserId,
      p_barcode: barcode,
    });

    if (error) {
      console.error("记录扫描历史失败:", error);
      return NextResponse.json(
        {
          success: false,
          message: "记录扫描历史失败",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "记录成功",
        data: { id: data },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("API错误:", error);
    return NextResponse.json(
      {
        success: false,
        message: "服务器内部错误",
      },
      { status: 500 }
    );
  }
}

/**
 * 删除扫描历史记录
 * DELETE /api/scan-history?id=xxx
 */
export async function DELETE(
  request: NextRequest
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "需要提供记录ID",
        },
        { status: 400 }
      );
    }

    // 获取当前用户
    const authHeader = request.headers.get("authorization");
    let currentUserId: string | null = null;

    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const {
          data: { user },
        } = await supabaseAdmin.auth.getUser(token);
        if (user) {
          currentUserId = user.id;
        }
      } catch (err) {
        console.warn("获取用户信息失败:", err);
      }
    }

    if (!currentUserId) {
      return NextResponse.json(
        {
          success: false,
          message: "需要登录",
        },
        { status: 401 }
      );
    }

    // 检查记录是否属于当前用户
    const { data: scanRecord, error: fetchError } = await supabaseAdmin
      .from("scan_history")
      .select("user_id")
      .eq("id", id)
      .single();

    if (fetchError || !scanRecord) {
      return NextResponse.json(
        {
          success: false,
          message: "记录不存在",
        },
        { status: 404 }
      );
    }

    if (scanRecord.user_id !== currentUserId) {
      return NextResponse.json(
        {
          success: false,
          message: "无权限删除此记录",
        },
        { status: 403 }
      );
    }

    // 删除记录
    const { error: deleteError } = await supabaseAdmin
      .from("scan_history")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("删除扫描历史失败:", deleteError);
      return NextResponse.json(
        {
          success: false,
          message: "删除失败",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "删除成功",
      data: null,
    });
  } catch (error) {
    console.error("API错误:", error);
    return NextResponse.json(
      {
        success: false,
        message: "服务器内部错误",
      },
      { status: 500 }
    );
  }
}
