"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

/**
 * 数据库初始化页面
 * 用于初始化PostgreSQL数据库表结构
 */
export default function InitDbPage() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [seedLoading, setSeedLoading] = useState(false);

  /**
   * 获取数据库统计信息
   */
  const fetchStats = async () => {
    try {
      const response = await fetch("/api/seed");
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("获取统计信息失败:", error);
    }
  };

  /**
   * 页面加载时获取统计信息
   */
  useEffect(() => {
    fetchStats();
  }, []);

  /**
   * 初始化数据库
   */
  const handleInitDatabase = async () => {
    setIsInitializing(true);
    setResult(null);
    setError(null);

    try {
      console.log("🔄 Initializing database...");

      const response = await fetch("/api/init-db", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        console.log("✅ Database initialized successfully");
        setResult("数据库初始化成功！已创建商品表和扫描记录表。");
        // 刷新统计信息
        fetchStats();
      } else {
        console.error("❌ Database initialization failed:", data.error);
        setError(data.error || "数据库初始化失败");
      }
    } catch (err) {
      console.error("❌ Failed to initialize database:", err);
      setError("网络错误：" + err.message);
    } finally {
      setIsInitializing(false);
    }
  };

  /**
   * 执行种子数据操作
   */
  const handleSeedOperation = async (action, actionName) => {
    setSeedLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/seed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.message);
        setError(null);
        // 刷新统计信息
        fetchStats();
      } else {
        setError(data.error || `${actionName}失败`);
        setResult(null);
      }
    } catch (error) {
      console.error(`${actionName}失败:`, error);
      setError(`${actionName}失败: ${error.message}`);
      setResult(null);
    } finally {
      setSeedLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">数据库管理</h1>
          <p className="text-gray-600">
            初始化PostgreSQL数据库表结构，创建商品表和扫描记录表。
          </p>
        </div>

        {/* 数据库统计信息 */}
        {stats && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">
              数据库统计
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white p-3 rounded border">
                <span className="text-gray-600">商品数量:</span>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.products}
                </p>
              </div>
              <div className="bg-white p-3 rounded border">
                <span className="text-gray-600">扫描记录:</span>
                <p className="text-2xl font-bold text-green-600">
                  {stats.scanRecords}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 初始化按钮 */}
        <div className="text-center mb-8">
          <button
            onClick={handleInitDatabase}
            disabled={isInitializing}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-3 px-8 rounded-lg transition-colors"
          >
            {isInitializing ? "正在初始化..." : "初始化数据库"}
          </button>
        </div>

        {/* 种子数据操作 */}
        <div className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            种子数据管理
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            管理数据库中的示例数据，包含15个常见商品的信息。
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleSeedOperation("seed", "插入种子数据")}
              disabled={seedLoading}
              className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${
                seedLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {seedLoading ? "操作中..." : "插入种子数据"}
            </button>

            <button
              onClick={() => handleSeedOperation("clear", "清空所有数据")}
              disabled={seedLoading}
              className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${
                seedLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {seedLoading ? "操作中..." : "清空所有数据"}
            </button>

            <button
              onClick={() => handleSeedOperation("reset", "重置数据库")}
              disabled={seedLoading}
              className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${
                seedLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-700"
              }`}
            >
              {seedLoading ? "操作中..." : "重置数据库"}
            </button>
          </div>

          <div className="mt-4 text-xs text-gray-500">
            <p>
              • <strong>插入种子数据</strong>:
              添加15个示例商品（如果数据库为空）
            </p>
            <p>
              • <strong>清空所有数据</strong>: 删除所有商品和扫描记录
            </p>
            <p>
              • <strong>重置数据库</strong>: 清空数据并重新插入种子数据
            </p>
          </div>
        </div>

        {/* 结果显示 */}
        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-green-800">{result}</p>
              </div>
            </div>
          </div>
        )}

        {/* 错误显示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* 数据库表结构说明 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            数据库表结构
          </h2>

          <div className="space-y-6">
            {/* 商品表 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                商品表 (products)
              </h3>
              <div className="bg-gray-50 rounded p-3">
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>
                    <code>id</code> - 主键，自增
                  </li>
                  <li>
                    <code>name</code> - 商品名称
                  </li>
                  <li>
                    <code>barcode</code> - 条形码（唯一）
                  </li>
                  <li>
                    <code>price</code> - 价格
                  </li>
                  <li>
                    <code>stock</code> - 库存
                  </li>
                  <li>
                    <code>expiry_date</code> - 有效期
                  </li>
                  <li>
                    <code>created_at</code> - 创建时间
                  </li>
                  <li>
                    <code>updated_at</code> - 更新时间
                  </li>
                </ul>
              </div>
            </div>

            {/* 扫描记录表 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                扫描记录表 (scan_records)
              </h3>
              <div className="bg-gray-50 rounded p-3">
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>
                    <code>id</code> - 主键，自增
                  </li>
                  <li>
                    <code>barcode</code> - 扫描的条形码
                  </li>
                  <li>
                    <code>product_id</code> - 关联的商品ID（可为空）
                  </li>
                  <li>
                    <code>scanned_at</code> - 扫描时间
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 导航链接 */}
        <div className="text-center space-x-4">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            ← 返回首页
          </Link>
          <Link
            href="/scanner"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            开始扫描 →
          </Link>
        </div>
      </div>
    </div>
  );
}
