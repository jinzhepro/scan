"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
import { toast, Toaster } from "sonner";

/**
 * 条形码/二维码扫描页面组件
 * 使用ZXing库实现高精度摄像头扫描功能
 */
export default function ScannerPage() {
  // 状态管理
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState("");
  const [scanCount, setScanCount] = useState(0);
  const [lastScanTime, setLastScanTime] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editableResult, setEditableResult] = useState("");
  const [productInfo, setProductInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const [outboundRecords, setOutboundRecords] = useState([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);

  // DOM引用
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const scanFrameRef = useRef(null);

  /**
   * 组件初始化
   * 创建高精度代码读取器并配置优化参数
   */
  useEffect(() => {
    console.log("🚀 Initializing high-precision scanner component...");

    // 创建ZXing代码读取器实例，配置优化参数
    const hints = new Map();
    // 启用所有支持的格式以提高识别率
    hints.set("POSSIBLE_FORMATS", [
      "QR_CODE",
      "DATA_MATRIX",
      "UPC_E",
      "UPC_A",
      "EAN_8",
      "EAN_13",
      "CODE_128",
      "CODE_39",
      "CODE_93",
      "CODABAR",
      "ITF",
      "RSS_14",
      "RSS_EXPANDED",
      "PDF_417",
      "AZTEC",
      "MAXICODE",
    ]);
    // 尝试更难的模式以提高精确度
    hints.set("TRY_HARDER", true);
    // 纯条形码模式，减少误识别
    hints.set("PURE_BARCODE", false);

    codeReaderRef.current = new BrowserMultiFormatReader(hints);
    console.log(
      "📖 High-precision ZXing code reader created with optimized hints"
    );

    // 组件卸载时清理资源
    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, []);

  /**
   * 开始高精度扫描功能
   * 使用优化的摄像头配置开始连续扫描
   */
  const handleStartScan = async () => {
    console.log("🎯 Starting high-precision scan process...");

    if (!videoRef.current) {
      console.error("❌ Cannot start scan: missing video element");
      return;
    }

    console.log("🎥 Video element:", videoRef.current);

    setIsScanning(true);
    setResult("");
    setScanCount(0);
    setLastScanTime(Date.now());

    try {
      // 配置高分辨率视频约束以提高扫描精确度
      const constraints = {
        video: {
          facingMode: "environment", // 优先使用后置摄像头
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
          frameRate: { ideal: 30, min: 15 },
          focusMode: "continuous",
          exposureMode: "continuous",
          whiteBalanceMode: "continuous",
        },
      };

      console.log(
        "📷 Requesting high-resolution camera with constraints:",
        constraints
      );

      // 开始扫描，使用优化的回调函数
      await codeReaderRef.current.decodeFromConstraints(
        constraints,
        videoRef.current,
        (result, err) => {
          const currentTime = Date.now();
          setScanCount((prev) => prev + 1);

          if (result) {
            const scanDuration = currentTime - lastScanTime;
            console.log("🎉 Scan result found:", result);
            console.log("📝 Result text:", result.text);
            console.log("⏱️ Scan duration:", scanDuration + "ms");
            console.log("🔢 Total scan attempts:", scanCount + 1);

            setResult(result.text);
            setEditableResult(result.text);
            setIsEditing(false); // 新扫描结果时退出编辑模式

            // 扫描成功后自动停止扫描
            handleStopScan();

            // 自动查询商品信息但不记录历史
            queryProductInfoWithoutHistory(result.text);
          }

          if (err && !(err instanceof NotFoundException)) {
            console.error("❌ Scan error:", err);
            // 只在严重错误时显示错误信息
            if (err.name !== "NotFoundError") {
              setResult(`扫描错误: ${err.message}`);
            }
          }
        }
      );

      console.log(
        "✅ Started high-precision continuous decode with optimized constraints"
      );
    } catch (error) {
      console.error("❌ Failed to start scanning:", error);
      setResult(`启动扫描失败: ${error.message}`);
      setIsScanning(false);
    }
  };

  /**
   * 查询商品信息（不记录历史）
   * 根据扫描到的条形码查询数据库中的商品信息，但不记录历史
   */
  const queryProductInfo = async () => {
    if (!result) {
      toast.error("请先扫描商品条形码");
      return;
    }

    setIsLoading(true);
    try {
      console.log("🔍 Querying product info for barcode:", result);

      const response = await fetch(
        `/api/products/barcode/${encodeURIComponent(result)}`
      );
      const data = await response.json();

      if (data.success) {
        if (data.found) {
          console.log("✅ Product found:", data.data);
          setProductInfo(data.data);
          // 查询成功后自动查询出库记录
          await queryOutboundRecords(result);
        } else {
          console.log("ℹ️ Product not found");
          setProductInfo(null);
          setOutboundRecords([]);
          toast.warning("未找到该商品信息");
        }
      } else {
        console.error("❌ Query failed:", data);
        setProductInfo(null);
        setOutboundRecords([]);
        toast.error("查询失败：" + (data.error || data.message || "未知错误"));
      }
    } catch (error) {
      console.error("❌ Failed to query product:", error);
      setProductInfo(null);
      setOutboundRecords([]);
      toast.error("查询失败：网络错误");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 查询当前商品的出库记录
   * @param {string} barcode - 商品条形码
   */
  const queryOutboundRecords = async (barcode) => {
    setIsLoadingRecords(true);
    try {
      console.log("🔍 Querying outbound records for barcode:", barcode);

      const response = await fetch(
        `/api/outbound-records?barcode=${encodeURIComponent(barcode)}&limit=20`
      );
      const data = await response.json();

      if (data.success) {
        // 过滤出当前条形码的记录
        const filteredRecords = data.data.filter(
          (record) => record.barcode === barcode
        );
        setOutboundRecords(filteredRecords);
        console.log("✅ Outbound records found:", filteredRecords.length);
      } else {
        console.error("❌ Query outbound records failed:", data);
        setOutboundRecords([]);
      }
    } catch (error) {
      console.error("❌ Failed to query outbound records:", error);
      setOutboundRecords([]);
    } finally {
      setIsLoadingRecords(false);
    }
  };

  /**
   * 查询商品信息（内部使用，不记录历史）
   * 扫描成功后自动调用的查询函数
   */
  const queryProductInfoWithoutHistory = async (barcode) => {
    setIsLoading(true);
    try {
      console.log("🔍 Auto querying product info for barcode:", barcode);

      const response = await fetch(
        `/api/products/barcode/${encodeURIComponent(barcode)}`
      );
      const data = await response.json();

      if (data.success) {
        if (data.found) {
          console.log("✅ Product found:", data.data);
          setProductInfo(data.data);
          // 查询成功后自动查询出库记录
          await queryOutboundRecords(barcode);
        } else {
          console.log("ℹ️ Product not found");
          setProductInfo(null);
          setOutboundRecords([]);
        }
      } else {
        console.error("❌ Query failed:", data);
        setProductInfo(null);
        setOutboundRecords([]);
      }
    } catch (error) {
      console.error("❌ Failed to query product:", error);
      setProductInfo(null);
      setOutboundRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 处理商品出库
   * 先查询商品信息，确认后进行出库操作，成功后记录到历史
   */
  const handleOutbound = async () => {
    if (!result) {
      toast.error("请先扫描商品条形码");
      return;
    }

    setIsLoading(true);

    try {
      console.log("🔍 Querying product info for outbound:", result);

      const product = productInfo;
      console.log("✅ Product found for outbound:", product);

      if (product.stock <= 0) {
        toast.warning("库存不足，无法出库");
        setIsLoading(false);
        return;
      }

      // 确认出库操作
      if (
        !confirm(
          `确认要出库商品"${product.name}"吗？\n当前库存：${product.stock}`
        )
      ) {
        setIsLoading(false);
        return;
      }

      console.log("📦 Processing outbound for product:", product.id);

      // 执行出库操作
      const outboundResponse = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stock: product.stock - 1,
        }),
      });

      const outboundData = await outboundResponse.json();

      if (outboundData.success) {
        console.log("✅ Outbound successful:", outboundData);

        // 更新商品信息显示
        const updatedProduct = {
          ...product,
          stock: product.stock - 1,
        };
        setProductInfo(updatedProduct);

        // 创建出库记录
        try {
          const outboundRecordResponse = await fetch("/api/outbound-records", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              barcode: result,
              productId: product.id,
              quantity: 1,
            }),
          });

          if (outboundRecordResponse.ok) {
            console.log("✅ 出库记录创建成功");
          }
        } catch (recordError) {
          console.error("❌ 创建出库记录失败:", recordError);
        }

        // 记录到出库历史（只有出库成功才记录）
        setScanHistory((prev) => [
          {
            barcode: result,
            product: updatedProduct,
            timestamp: new Date().toLocaleString(),
            found: true,
            action: "outbound", // 标记为出库操作
            quantity: 1,
          },
          ...prev.slice(0, 9),
        ]);

        // 刷新出库记录
        await queryOutboundRecords(result);

        toast.success("出库成功！库存已更新");
      } else {
        console.error("❌ Outbound failed:", outboundData);
        toast.error(
          "出库失败：" +
            (outboundData.error || outboundData.message || "未知错误")
        );
      }
    } catch (error) {
      console.error("❌ Outbound error:", error);
      toast.error("出库失败：网络错误");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 开始编辑扫描结果
   */
  const handleStartEdit = () => {
    setIsEditing(true);
    setEditableResult(result);
  };

  /**
   * 保存编辑的结果
   */
  const handleSaveEdit = () => {
    setResult(editableResult);
    setIsEditing(false);
    console.log("✅ Result edited and saved:", editableResult);
  };

  /**
   * 取消编辑
   */
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditableResult(result);
  };

  /**
   * 处理编辑内容变化
   */
  const handleEditChange = (e) => {
    setEditableResult(e.target.value);
  };

  /**
   * 停止扫描
   * 只停止扫描，不清除已有的结果和商品信息
   */
  const handleStopScan = () => {
    console.log("⏹️ Stopping scanner...");

    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      console.log("✅ Scanner stopped");
    }
    setIsScanning(false);
  };

  /**
   * 重置扫描器
   * 停止扫描并清除所有状态
   */
  const handleReset = () => {
    console.log("🔄 Resetting scanner...");

    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      console.log("✅ Scanner reset completed");
    }
    setIsScanning(false);
    setResult("");
    setScanCount(0);
    setLastScanTime(0);
    setIsEditing(false);
    setEditableResult("");
    setProductInfo(null);
    setIsLoading(false);
    console.log("🧹 All states cleared");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-2">
      <div className="max-w-4xl mx-auto px-2">
        {/* 页面标题 */}
        <div className="text-center mb-4">
          <h6 className="text-xl font-bold text-gray-900 mb-4">
            高精度条形码/二维码扫描器
          </h6>
          <p className="text-gray-600 max-w-2xl mx-auto">
            使用优化的ZXing JavaScript库从高分辨率摄像头扫描任何支持的1D/2D码。
          </p>
        </div>
        {/* 视频预览区域 */}
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-lg shadow-lg p-4 relative w-full max-w-lg">
            <video
              ref={videoRef}
              className="border border-gray-300 rounded w-full"
              style={{
                objectFit: "cover",
                aspectRatio: "4/3",
                maxWidth: "100%",
                height: "auto",
              }}
            />

            {/* 扫描统计信息 */}
            {isScanning && (
              <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                扫描次数: {scanCount}
              </div>
            )}
          </div>
        </div>
        {/* 控制按钮 */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={handleStartScan}
            disabled={isScanning}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            {isScanning ? "扫描中..." : "开始扫描"}
          </button>
          {isScanning && (
            <button
              onClick={handleStopScan}
              className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              停止扫描
            </button>
          )}
          <button
            onClick={handleReset}
            className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            重置
          </button>
          {/* <Link href="/init-db">
            <button className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-6 rounded-lg transition-colors">
              初始化数据库
            </button>
          </Link> */}
        </div>

        {/* 扫描结果显示 */}
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              扫描结果:
            </label>
            {result && !isEditing && (
              <button
                onClick={handleStartEdit}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
              >
                ✏️ 编辑
              </button>
            )}
          </div>

          {isEditing ? (
            // 编辑模式
            <div className="space-y-3">
              <textarea
                value={editableResult}
                onChange={handleEditChange}
                className="w-full bg-white border border-gray-300 rounded-lg p-4 min-h-[100px] text-sm text-gray-900 font-mono resize-vertical focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="编辑扫描结果..."
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-1 px-3 rounded text-sm transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="bg-green-500 hover:bg-green-600 text-white font-medium py-1 px-3 rounded text-sm transition-colors"
                >
                  保存
                </button>
              </div>
            </div>
          ) : (
            // 显示模式
            <div className="bg-white border border-gray-300 rounded-lg p-4 min-h-[100px] relative group">
              <pre className="whitespace-pre-wrap text-sm text-gray-900 font-mono">
                {result || "等待扫描结果..."}
              </pre>
              {result && (
                <button
                  onClick={handleStartEdit}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded"
                >
                  编辑
                </button>
              )}
            </div>
          )}
        </div>

        {/* 商品信息显示 */}
        {result && (
          <div className="max-w-2xl mx-auto mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              商品信息:
            </label>

            {isLoading ? (
              <div className="bg-white border border-gray-300 rounded-lg p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-gray-600 text-sm">正在查询商品信息...</p>
              </div>
            ) : productInfo ? (
              <div className="bg-white border border-green-300 rounded-lg p-4 border-l-4 border-l-green-500">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {productInfo.name}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-gray-600">条形码:</span>
                    <p className="font-mono text-gray-900">
                      {productInfo.barcode}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">价格:</span>
                    <p className="font-semibold text-green-600">
                      ¥{productInfo.price}
                    </p>
                  </div>
                  {productInfo.stock !== null && (
                    <div>
                      <span className="text-gray-600">库存:</span>
                      <p
                        className={`font-semibold ${
                          productInfo.stock > 0
                            ? "text-gray-900"
                            : "text-red-600"
                        }`}
                      >
                        {productInfo.stock}
                      </p>
                    </div>
                  )}
                  {productInfo.expiry_date && (
                    <div>
                      <span className="text-gray-600">有效期:</span>
                      <p className="text-gray-900">{productInfo.expiry_date}</p>
                    </div>
                  )}
                </div>

                {/* 操作按钮 */}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={queryProductInfo}
                    className="px-4 py-2 rounded-lg font-medium text-sm transition-colors bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    🔍 重新查询
                  </button>
                  <button
                    onClick={handleOutbound}
                    disabled={!productInfo.stock || productInfo.stock <= 0}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      productInfo.stock > 0
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    📦 出库 (-1)
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-300 rounded-lg p-4 text-center">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    扫描成功
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    条形码: <span className="font-mono">{result}</span>
                  </p>
                  <p className="text-gray-500 text-sm">
                    点击查询按钮获取商品信息，或直接出库
                  </p>
                </div>

                {/* 操作按钮 */}
                <div className="flex justify-center gap-2">
                  <button
                    onClick={queryProductInfo}
                    className="px-4 py-2 rounded-lg font-medium text-sm transition-colors bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    🔍 查询商品信息
                  </button>
                  <button
                    onClick={handleOutbound}
                    className="px-4 py-2 rounded-lg font-medium text-sm transition-colors bg-red-500 hover:bg-red-600 text-white"
                  >
                    📦 直接出库
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 当前商品出库记录 */}
        {result && productInfo && (
          <div className="max-w-2xl mx-auto mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              当前商品出库记录:
            </label>

            {isLoadingRecords ? (
              <div className="bg-white border border-gray-300 rounded-lg p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-gray-600 text-sm">正在查询出库记录...</p>
              </div>
            ) : outboundRecords.length > 0 ? (
              <div className="bg-white border border-gray-300 rounded-lg divide-y divide-gray-200">
                {outboundRecords.map((record, index) => (
                  <div key={index} className="p-3 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm text-gray-900">
                            {record.barcode}
                          </span>
                          <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-800">
                            出库
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p className="font-medium">{record.product_name}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-red-600 font-medium">
                              出库数量: {record.quantity || 1}
                            </span>
                            <span>价格: ¥{record.product_price}</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(record.outbound_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-gray-300 rounded-lg p-4 text-center">
                <p className="text-gray-500 text-sm">暂无出库记录</p>
              </div>
            )}
          </div>
        )}

        {/* 出库历史 */}
        {scanHistory.length > 0 && (
          <div className="max-w-2xl mx-auto mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              出库历史 (最近10条):
            </label>
            <div className="bg-white border border-gray-300 rounded-lg divide-y divide-gray-200">
              {scanHistory.map((scan, index) => (
                <div key={index} className="p-3 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-gray-900">
                          {scan.barcode}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            scan.found
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {scan.found ? "已识别" : "未知"}
                        </span>
                      </div>
                      {scan.product && (
                        <div className="text-sm text-gray-600">
                          <p className="font-medium">{scan.product.name}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span>价格: ¥{scan.product.price}</span>
                            <span className="text-red-600 font-medium">
                              出库数量: {scan.quantity || 1}
                            </span>
                            {scan.product.stock !== null && (
                              <span
                                className={`font-medium ${
                                  scan.product.stock > 0
                                    ? "text-gray-700"
                                    : "text-red-600"
                                }`}
                              >
                                出库后库存: {scan.product.stock}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {scan.timestamp}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 返回首页链接 */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            ← 返回首页
          </Link>
        </div>

        {/* 页脚信息 */}
        <footer className="text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            基于{" "}
            <a
              href="https://github.com/zxing-js/library"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800"
            >
              ZXing JavaScript库
            </a>{" "}
            构建
          </p>
        </footer>
      </div>
      <Toaster position="top-center" richColors />
    </div>
  );
}
