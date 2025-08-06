"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Package,
  Search,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { ScanHistory } from "@/types";

/**
 * 扫描历史页面组件
 * 提供用户查看和管理扫描记录的功能
 */
export default function ScanHistoryPage() {
  const router = useRouter();

  const [scanHistory, setScanHistory] = useState<ScanHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredHistory, setFilteredHistory] = useState<ScanHistory[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * 加载扫描历史
   */
  const loadScanHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // 获取当前用户
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("请先登录");
        return;
      }

      // 查询扫描历史（使用视图获取完整信息）
      const { data, error: fetchError } = await supabase
        .from("scan_history_detail")
        .select("*")
        .eq("user_id", user.id)
        .order("scanned_at", { ascending: false })
        .limit(50);

      if (fetchError) {
        console.error("加载扫描历史失败:", fetchError);
        setError("加载扫描历史失败");
        return;
      }

      setScanHistory(data || []);
    } catch (err) {
      console.error("加载扫描历史失败:", err);
      setError("加载扫描历史失败");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 刷新数据
   */
  const refreshData = async () => {
    setRefreshing(true);
    await loadScanHistory();
    setRefreshing(false);
  };

  useEffect(() => {
    loadScanHistory();
  }, []);

  /**
   * 过滤扫描历史
   */
  useEffect(() => {
    if (!searchQuery) {
      setFilteredHistory(scanHistory);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = scanHistory.filter(
      (item) =>
        item.barcode.toLowerCase().includes(query) ||
        (item.product_name && item.product_name.toLowerCase().includes(query))
    );
    setFilteredHistory(filtered);
  }, [scanHistory, searchQuery]);

  /**
   * 删除扫描记录
   */
  const deleteScanRecord = async (id: string) => {
    try {
      const { error } = await supabase
        .from("scan_history")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("删除扫描记录失败:", error);
        setError("删除失败");
        return;
      }

      // 更新本地数据
      setScanHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("删除扫描记录失败:", err);
      setError("删除失败");
    }
  };

  /**
   * 格式化时间
   */
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) {
      return "刚刚";
    } else if (diffMins < 60) {
      return `${diffMins}分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  /**
   * 跳转到商品详情
   */
  const goToProduct = (barcode: string) => {
    router.push(`/product/${barcode}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner text-blue-600 mb-4"></div>
          <p className="text-text-secondary">正在加载扫描历史...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* 头部导航 */}
      <div className="bg-blue-600 text-white px-6 py-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold flex-1">扫描历史</h1>
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="p-2 -mr-2"
          >
            <RefreshCw
              className={`w-6 h-6 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* 搜索框 */}
        <div className="card mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-tertiary" />
            <input
              type="text"
              placeholder="搜索商品名称或条形码"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="card mb-6 border-l-4 border-status-error">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-status-error" />
              <p className="text-status-error">{error}</p>
            </div>
          </div>
        )}

        {/* 扫描历史列表 */}
        <div className="space-y-3">
          {filteredHistory.length === 0 ? (
            <div className="card text-center py-8">
              <Clock className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {searchQuery ? "没有找到相关记录" : "暂无扫描历史"}
              </h3>
              <p className="text-text-secondary mb-6">
                {searchQuery ? "尝试使用其他关键词搜索" : "开始扫码查询商品吧"}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => router.push("/scan")}
                  className="btn-primary"
                >
                  开始扫码
                </button>
              )}
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div key={item.id} className="card">
                <div className="flex items-start gap-4">
                  {/* 商品图片 */}
                  <div className="w-12 h-12 bg-background-tertiary rounded-lg flex items-center justify-center flex-shrink-0">
                    {item.product_image_url ? (
                      <img
                        src={item.product_image_url}
                        alt={item.product_name || "商品"}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-text-tertiary" />
                    )}
                  </div>

                  {/* 扫描信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-medium text-text-primary truncate">
                        {item.product_name || "未知商品"}
                      </h3>
                      <button
                        onClick={() => deleteScanRecord(item.id)}
                        className="p-1 text-text-tertiary hover:text-status-error transition-colors ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-sm text-text-secondary mb-1">
                      条形码: {item.barcode}
                    </p>

                    {item.product_price && (
                      <p className="text-sm font-medium text-blue-600 mb-2">
                        ¥{item.product_price.toFixed(2)}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-text-tertiary">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(item.scanned_at)}</span>
                      </div>

                      <button
                        onClick={() => goToProduct(item.barcode)}
                        className="text-xs text-blue-600 font-medium"
                      >
                        查看详情
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 底部提示 */}
        {filteredHistory.length > 0 && (
          <div className="text-center mt-8 text-text-tertiary text-sm">
            <p>显示最近 {filteredHistory.length} 条扫描记录</p>
          </div>
        )}
      </div>
    </div>
  );
}
