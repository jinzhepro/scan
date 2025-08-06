"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";

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
            // 成功扫描后可以选择停止扫描
            // handleReset();
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
    console.log("🧹 All states cleared");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            高精度条形码/二维码扫描器
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            使用优化的ZXing JavaScript库从高分辨率摄像头扫描任何支持的1D/2D码。
            支持多种格式，采用高精度算法提升识别准确率。
          </p>
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
          <button
            onClick={handleReset}
            className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            重置
          </button>
        </div>

        {/* 视频预览区域 */}
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-lg shadow-lg p-4 relative">
            <video
              ref={videoRef}
              width="480"
              height="360"
              className="border border-gray-300 rounded"
              style={{ 
                objectFit: "cover",
                width: "480px",
                height: "360px",
                maxWidth: "480px",
                maxHeight: "360px"
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
    </div>
  );
}
