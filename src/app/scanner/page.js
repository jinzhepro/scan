"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";

/**
 * 条形码/二维码扫描页面组件
 * 基于ZXing库实现从摄像头实时扫描功能
 */
export default function ScannerPage() {
  // 状态管理
  const [result, setResult] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  // DOM引用
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

  /**
   * 组件初始化
   * 创建代码读取器
   */
  useEffect(() => {
    console.log('🚀 Initializing scanner component...');
    
    // 创建ZXing代码读取器实例
    codeReaderRef.current = new BrowserMultiFormatReader();
    console.log('📖 ZXing code reader created:', codeReaderRef.current);

    // 组件卸载时清理资源
    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, []);

  /**
   * 开始扫描功能
   * 使用默认摄像头开始连续扫描
   */
  const handleStartScan = () => {
    console.log('🎯 Starting scan process...');
    
    if (!videoRef.current) {
      console.error('❌ Cannot start scan: missing video element');
      return;
    }

    console.log('🎥 Video element:', videoRef.current);

    setIsScanning(true);
    setResult('');

    codeReaderRef.current.decodeFromVideoDevice(
      undefined, // 使用默认摄像头
      videoRef.current,
      (result, err) => {
        if (result) {
          console.log('🎉 Scan result found:', result);
          console.log('📝 Result text:', result.text);
          setResult(result.text);
        }
        if (err && !(err instanceof NotFoundException)) {
          console.error('❌ Scan error:', err);
          setResult(`Error: ${err.message}`);
        }
      }
    );

    console.log('✅ Started continuous decode from default camera');
  };

  /**
   * 重置扫描器
   * 停止扫描并清除结果
   */
  const handleReset = () => {
    console.log('🔄 Resetting scanner...');
    
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      console.log('✅ Scanner reset completed');
    }
    setIsScanning(false);
    setResult('');
    console.log('🧹 UI state cleared');
  };



  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            条形码/二维码扫描器
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            使用ZXing JavaScript库从设备摄像头扫描任何支持的1D/2D码。
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
          <div className="bg-white rounded-lg shadow-lg p-4">
            <video
              ref={videoRef}
              width="400"
              height="300"
              className="border border-gray-300 rounded"
              style={{ objectFit: "cover" }}
            />
          </div>
        </div>



        {/* 扫描结果显示 */}
        <div className="max-w-2xl mx-auto">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            扫描结果:
          </label>
          <div className="bg-white border border-gray-300 rounded-lg p-4 min-h-[100px]">
            <pre className="whitespace-pre-wrap text-sm text-gray-900 font-mono">
              {result || "等待扫描结果..."}
            </pre>
          </div>
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
