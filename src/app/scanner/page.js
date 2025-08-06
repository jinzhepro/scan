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
  const [result, setResult] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [lastScanTime, setLastScanTime] = useState(0);

  // DOM引用
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const scanFrameRef = useRef(null);

  /**
   * 组件初始化
   * 创建高精度代码读取器并配置优化参数
   */
  useEffect(() => {
    console.log('🚀 Initializing high-precision scanner component...');
    
    // 创建ZXing代码读取器实例，配置优化参数
    const hints = new Map();
    // 启用所有支持的格式以提高识别率
    hints.set('POSSIBLE_FORMATS', [
      'QR_CODE', 'DATA_MATRIX', 'UPC_E', 'UPC_A', 'EAN_8', 'EAN_13',
      'CODE_128', 'CODE_39', 'CODE_93', 'CODABAR', 'ITF', 'RSS_14',
      'RSS_EXPANDED', 'PDF_417', 'AZTEC', 'MAXICODE'
    ]);
    // 尝试更难的模式以提高精确度
    hints.set('TRY_HARDER', true);
    // 纯条形码模式，减少误识别
    hints.set('PURE_BARCODE', false);
    
    codeReaderRef.current = new BrowserMultiFormatReader(hints);
    console.log('📖 High-precision ZXing code reader created with optimized hints');

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
    console.log('🎯 Starting high-precision scan process...');
    
    if (!videoRef.current) {
      console.error('❌ Cannot start scan: missing video element');
      return;
    }

    console.log('🎥 Video element:', videoRef.current);

    setIsScanning(true);
    setResult('');
    setScanCount(0);
    setLastScanTime(Date.now());

    try {
      // 配置高分辨率视频约束以提高扫描精确度
      const constraints = {
        video: {
          facingMode: 'environment', // 优先使用后置摄像头
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
          frameRate: { ideal: 30, min: 15 },
          focusMode: 'continuous',
          exposureMode: 'continuous',
          whiteBalanceMode: 'continuous'
        }
      };

      console.log('📷 Requesting high-resolution camera with constraints:', constraints);

      // 开始扫描，使用优化的回调函数
      await codeReaderRef.current.decodeFromConstraints(
        constraints,
        videoRef.current,
        (result, err) => {
          const currentTime = Date.now();
          setScanCount(prev => prev + 1);
          
          if (result) {
            const scanDuration = currentTime - lastScanTime;
            console.log('🎉 Scan result found:', result);
            console.log('📝 Result text:', result.text);
            console.log('⏱️ Scan duration:', scanDuration + 'ms');
            console.log('🔢 Total scan attempts:', scanCount + 1);
            
            setResult(result.text);
            // 成功扫描后可以选择停止扫描
            // handleReset();
          }
          
          if (err && !(err instanceof NotFoundException)) {
            console.error('❌ Scan error:', err);
            // 只在严重错误时显示错误信息
            if (err.name !== 'NotFoundError') {
              setResult(`扫描错误: ${err.message}`);
            }
          }
        }
      );

      console.log('✅ Started high-precision continuous decode with optimized constraints');
    } catch (error) {
      console.error('❌ Failed to start scanning:', error);
      setResult(`启动扫描失败: ${error.message}`);
      setIsScanning(false);
    }
  };

  /**
   * 重置扫描器
   * 停止扫描并清除所有状态
   */
  const handleReset = () => {
    console.log('🔄 Resetting scanner...');
    
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      console.log('✅ Scanner reset completed');
    }
    setIsScanning(false);
    setResult('');
    setScanCount(0);
    setLastScanTime(0);
    console.log('🧹 All states cleared');
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
          <div className="mt-4 text-sm text-blue-600">
            💡 提示：将条码对准红色虚线框内，保持稳定以获得最佳扫描效果
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
              width="640"
              height="480"
              className="border border-gray-300 rounded"
              style={{ objectFit: "cover" }}
            />
            
            {/* 扫描提示框 */}
            <div 
              ref={scanFrameRef}
              className={`absolute inset-4 border-2 border-red-500 border-dashed rounded pointer-events-none scan-frame ${isScanning ? 'opacity-100' : 'opacity-70'}`}
              style={{
                top: '25%',
                left: '25%',
                right: '25%',
                bottom: '25%',
                animation: isScanning ? 'pulse 2s infinite' : 'none'
              }}
            >
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-2 py-1 rounded text-xs">
                将条码对准此区域
              </div>
              
              {/* 扫描线动画 */}
              {isScanning && (
                <div className="scan-line"></div>
              )}
            </div>
            
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
