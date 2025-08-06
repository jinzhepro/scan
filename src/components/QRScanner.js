"use client";

import { toast } from "sonner";
import { useQRScanner } from "@/hooks/useQRScanner";

/**
 * 二维码扫描组件
 * 提供摄像头预览和扫码结果显示
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
  } = useQRScanner();

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
   * 渲染扫描结果
   */
  const renderScanResult = () => {
    if (!scanResult) return null;

    return (
      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="text-lg font-semibold text-green-800 mb-2">
          扫描成功！
        </h3>
        <div className="mb-2">
          <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-sm rounded">
            {scanResult.type === 'QR_CODE' ? '二维码' : `条形码 (${scanResult.type})`}
          </span>
        </div>
        <div className="bg-white p-3 rounded border">
          <p className="text-sm text-gray-600 mb-1">扫描内容：</p>
          <p className="font-mono text-sm break-all">{scanResult.data}</p>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={resetScan}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            继续扫描
          </button>
          <button
            onClick={() => copyToClipboard(scanResult.data)}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            复制内容
          </button>
        </div>
      </div>
    );
  };

  /**
   * 渲染摄像头预览
   */
  const renderCameraPreview = () => {
    // if (!isScanning) return null;

    return (
      <div className="mt-6">
        <div className="relative bg-black rounded-lg overflow-hidden">
          {/* 视频预览 */}
          <video
            ref={videoRef}
            className={`w-full h-64 object-cover ${
              isIOS() ? "cursor-pointer" : ""
            }`}
            playsInline
            muted
            title={isIOS() ? "点击启动摄像头" : "摄像头预览"}
          />

          {/* 扫描框 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 border-2 border-blue-500 rounded-lg relative">
              {/* 四个角的装饰 */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500"></div>

              {/* 扫描线 */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-blue-500 animate-pulse"></div>
            </div>
          </div>

          {/* 加载提示 */}
          {isLoading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="text-white text-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-3"></div>
                <p className="mb-2">正在启动摄像头...</p>
                {isIOS() && (
                  <p className="text-sm text-yellow-300">
                    iOS设备可能需要手动点击启动
                  </p>
                )}
              </div>
            </div>
          )}

          {/* iOS 特殊提示覆盖层 */}
          {isScanning && !isLoading && isIOS() && (
            <div className="absolute top-2 left-2 right-2 bg-black bg-opacity-70 text-white text-xs p-2 rounded">
              💡 如果摄像头未显示画面，请点击视频区域
            </div>
          )}
        </div>

        {/* 隐藏的画布用于图像处理 */}
        <canvas ref={canvasRef} className="hidden" />

        {/* 停止按钮 */}
        <div className="mt-4 text-center">
          <button
            onClick={stopScanning}
            className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            停止扫描
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">二维码/条形码扫描器</h2>
        
        {/* 调试信息 */}
        <div className="mb-4 p-2 bg-gray-100 rounded text-xs text-left">
          <p><strong>调试状态:</strong></p>
          <p>设备类型: {isIOS() ? '📱 iOS' : isAndroid() ? '🤖 Android' : '💻 其他'}</p>
          <p>isScanning: {isScanning ? '✅' : '❌'}</p>
          <p>isLoading: {isLoading ? '⏳' : '✅'}</p>
          <p>scanResult: {scanResult ? '✅' : '❌'}</p>
          <p>error: {error ? '❌' : '✅'}</p>
        </div>

        {/* 开始扫描按钮 */}
        {!isScanning && !scanResult && (
          <div className="space-y-3">
            <button
              onClick={() => {
                console.log('🔘 用户点击了开始扫描按钮');
                startScanning();
              }}
              disabled={isLoading}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "启动中..." : "开始扫描"}
            </button>

            {/* 重试按钮 - 仅在加载状态下显示 */}
            {isLoading && (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">启动时间较长？</p>
                <button
                  onClick={() => {
                    stopScanning();
                    setTimeout(startScanning, 500);
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm"
                >
                  重新尝试
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 摄像头预览 */}
      {renderCameraPreview()}

      {/* 扫描结果 */}
      {renderScanResult()}

      {/* 使用说明 */}
      {!isScanning && !scanResult && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">使用说明：</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• 点击&ldquo;开始扫描&rdquo;按钮启动摄像头</li>
            <li>• 将二维码或条形码对准摄像头扫描框内</li>
            <li>• 保持适当距离，确保码清晰可见</li>
            <li>• 支持多种格式：QR码、EAN、UPC、Code128等</li>
            <li>• 扫描成功后会自动显示结果和格式类型</li>
            {isIOS() && (
              <>
                <li className="text-orange-600 font-medium">
                  • iPhone/iPad 用户：如摄像头未启动，请点击视频区域
                </li>
                <li className="text-orange-600">
                  • 建议使用 Safari 浏览器获得最佳体验
                </li>
                <li className="text-orange-600">
                  • 请确保允许摄像头权限并在 HTTPS 环境下访问
                </li>
              </>
            )}
            {isAndroid() && (
              <>
                <li className="text-blue-600 font-medium">
                  • Android 用户：已自动优化性能设置
                </li>
                <li className="text-blue-600">
                  • 建议使用 Chrome 浏览器获得最佳体验
                </li>
                <li className="text-blue-600">
                  • 如遇卡顿，系统会自动降低分辨率和帧率
                </li>
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
