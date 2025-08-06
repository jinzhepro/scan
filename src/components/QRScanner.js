"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useQRScanner } from "@/hooks/useQRScanner";

/**
 * 摄像头条形码扫描组件
 * 提供全屏摄像头预览、实时扫描和拍照扫描功能
 */
export default function QRScanner() {
  const {
    isScanning,
    scanResult,
    error,
    isLoading,
    videoRef,
    canvasRef,
    startScanning,
    stopScanning,
    resetScan,
    capturePhoto,
  } = useQRScanner();

  const [showControls, setShowControls] = useState(true);

  /**
   * 检测是否为iOS设备
   */
  const isIOS = () => {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
  };

  /**
   * 检测是否为Safari浏览器
   */
  const isSafari = () => {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  };

  /**
   * 检测是否为安卓设备
   */
  const isAndroid = () => {
    return /Android/i.test(navigator.userAgent);
  };

  /**
   * 复制扫描结果到剪贴板
   */
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("已复制到剪贴板", {
        duration: 2000,
      });
    } catch (err) {
      toast.error("复制失败", {
        description: "请手动复制内容",
        duration: 3000,
      });
    }
  };

  /**
   * 渲染扫描结果弹窗
   */
  const renderScanResult = () => {
    if (!scanResult) return null;

    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform animate-in slide-in-from-bottom-4">
          {/* 成功图标 */}
          <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4 mx-auto">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h3 className="text-xl font-bold text-gray-800 text-center mb-2">
            扫描成功！
          </h3>
          
          <div className="text-center mb-4">
            <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
              {scanResult.type} 条形码
            </span>
          </div>

          {/* 扫描内容 */}
          <div className="bg-gray-50 p-4 rounded-xl mb-6">
            <p className="text-sm text-gray-600 mb-2">扫描内容：</p>
            <p className="font-mono text-lg break-all text-gray-800 bg-white p-3 rounded-lg border">
              {scanResult.data}
            </p>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <button
              onClick={resetScan}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
            >
              继续扫描
            </button>
            <button
              onClick={() => copyToClipboard(scanResult.data)}
              className="flex-1 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-semibold"
            >
              复制内容
            </button>
          </div>

          {/* 关闭按钮 */}
          <button
            onClick={resetScan}
            className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  /**
   * 渲染全屏摄像头预览
   */
  const renderCameraPreview = () => {
    if (!isScanning) return null;

    return (
      <div className="fixed inset-0 bg-black z-50">
        {/* 视频预览 - 全屏 */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          onClick={() => {
            if (isIOS()) {
              // iOS设备点击启动摄像头
              if (videoRef.current && videoRef.current.paused) {
                videoRef.current.play();
              }
            } else {
              // 其他设备点击隐藏/显示控制界面
              setShowControls(!showControls);
            }
          }}
          title={isIOS() ? "点击启动摄像头" : "点击隐藏/显示控制"}
        />

        {/* 扫描框 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 md:w-80 md:h-80 border-2 border-white rounded-lg relative">
            {/* 四个角的装饰 */}
            <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-blue-400"></div>
            <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-blue-400"></div>
            <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-blue-400"></div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-blue-400"></div>

            {/* 扫描线动画 */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-blue-400 animate-pulse shadow-lg"></div>
            
            {/* 扫描提示 */}
            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-white text-center">
              <p className="text-sm bg-black bg-opacity-50 px-3 py-1 rounded-full">
                将条形码对准扫描框
              </p>
            </div>
          </div>
        </div>

        {/* 顶部控制栏 */}
        {showControls && (
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4 z-10">
            <div className="flex items-center justify-between text-white">
              <button
                onClick={stopScanning}
                className="flex items-center space-x-2 bg-black/50 px-4 py-2 rounded-full hover:bg-black/70 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>关闭</span>
              </button>
              
              <div className="text-center">
                <h2 className="text-lg font-semibold">条形码扫描</h2>
                <p className="text-sm text-gray-300">实时扫描中...</p>
              </div>
              
              <div className="w-20"></div> {/* 占位符保持居中 */}
            </div>
          </div>
        )}

        {/* 底部控制栏 */}
        {showControls && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 z-10">
            <div className="flex items-center justify-center space-x-8">
              {/* 拍照按钮 */}
              <button
                onClick={capturePhoto}
                className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors shadow-lg"
                title="拍照扫描"
              >
                <svg className="w-8 h-8 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
            
            {/* 操作提示 */}
            <div className="mt-4 text-center text-white">
              <p className="text-sm text-gray-300">
                点击拍照按钮进行拍照扫描，或保持稳定进行实时扫描
              </p>
              {isIOS() && (
                <p className="text-xs text-yellow-300 mt-1">
                  💡 iOS设备：如摄像头未显示，请点击屏幕启动
                </p>
              )}
            </div>
          </div>
        )}

        {/* 加载提示 */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
            <div className="text-white text-center p-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-lg mb-2">正在启动摄像头...</p>
              {isIOS() && (
                <p className="text-sm text-yellow-300">
                  iOS设备可能需要手动点击启动
                </p>
              )}
            </div>
          </div>
        )}

        {/* 隐藏的画布用于图像处理 */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  };

  return (
    <div className="w-full h-full">
      {/* 摄像头预览 - 全屏 */}
      {renderCameraPreview()}

      {/* 扫描结果弹窗 */}
      {renderScanResult()}

      {/* 启动界面 */}
      {!isScanning && !scanResult && (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* 摄像头图标 */}
            <div className="flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6 mx-auto">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-3">条形码扫描器</h2>
            <p className="text-gray-600 mb-8">启动摄像头开始扫描条形码</p>

            {/* 开始扫描按钮 */}
            <button
              onClick={() => {
                console.log("🔘 用户点击了开始扫描按钮");
                startScanning();
              }}
              disabled={isLoading}
              className="w-full py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold mb-4"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  启动中...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  启动摄像头
                </div>
              )}
            </button>

            {/* 重试按钮 */}
            {isLoading && (
              <button
                onClick={() => {
                  stopScanning();
                  setTimeout(startScanning, 500);
                }}
                className="w-full py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors text-sm"
              >
                重新尝试
              </button>
            )}

            {/* 功能说明 */}
            <div className="mt-8 text-left">
              <h3 className="font-semibold text-gray-800 mb-3 text-center">功能特点</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>实时扫描识别</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>拍照扫描功能</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>支持多种条形码格式</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>自动设备优化</span>
                </div>
              </div>
            </div>

            {/* 设备特殊提示 */}
            {isIOS() && (
              <div className="mt-6 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-700">
                  <strong>iOS 用户提示：</strong><br />
                  如摄像头未自动启动，请点击视频区域手动启动
                </p>
              </div>
            )}
            
            {isAndroid() && (
              <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Android 用户：</strong><br />
                  已自动优化性能设置，确保流畅扫描体验
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
