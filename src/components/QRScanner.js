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
    captureAndScan,
    scanFromFile,
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
   * 处理文件上传
   */
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log("📁 用户选择了文件:", file.name);
      scanFromFile(file);
    }
    // 清空input值，允许重复选择同一文件
    event.target.value = '';
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
        <div className="mb-2 flex gap-2 flex-wrap">
          <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-sm rounded">
            条形码 ({scanResult.type})
          </span>
          {scanResult.method && (
            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
              {scanResult.method === 'capture' ? '拍照识别' : 
               scanResult.method === 'file' ? '文件识别' : '实时扫描'}
            </span>
          )}
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

        {/* 控制按钮 */}
        <div className="mt-4 text-center space-y-2">
          <div className="flex gap-3 justify-center">
            <button
              onClick={captureAndScan}
              disabled={isLoading || !isScanning}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              拍照识别
            </button>
            <button
              onClick={stopScanning}
              className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              停止扫描
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg mb-4 mx-auto">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12h-4.01M12 12v4m6-4h.01M12 8h.01" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">条形码扫描器</h2>
          <p className="text-gray-600 mb-6">支持实时扫描、拍照识别和文件上传识别</p>

          {/* 扫描模式选择 */}
          {!isScanning && !scanResult && (
            <div className="space-y-4">
              {/* 实时扫描 */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  实时扫描
                </h3>
                <p className="text-sm text-blue-600 mb-3">启动摄像头进行实时条形码识别</p>
                <button
                  onClick={() => {
                    console.log("🔘 用户点击了开始扫描按钮");
                    startScanning();
                  }}
                  disabled={isLoading}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "启动中..." : "开始实时扫描"}
                </button>
              </div>

              {/* 文件上传 */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  上传图片识别
                </h3>
                <p className="text-sm text-green-600 mb-3">选择包含条形码的图片文件进行识别</p>
                <label className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer inline-block text-center">
                  选择图片文件
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

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
      </div>

      {/* 摄像头预览 */}
      {renderCameraPreview()}

      {/* 扫描结果 */}
      {renderScanResult()}

      {/* 使用说明 */}
      {!isScanning && !scanResult && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">使用说明：</h3>
          <div className="text-sm text-gray-600 space-y-3">
            {/* 实时扫描说明 */}
            <div>
              <h4 className="font-medium text-blue-700 mb-1">📹 实时扫描模式：</h4>
              <ul className="space-y-1 ml-4">
                <li>• 点击&ldquo;开始实时扫描&rdquo;启动摄像头</li>
                <li>• 将条形码对准摄像头扫描框内</li>
                <li>• 保持适当距离，确保条形码清晰可见</li>
                <li>• 可点击&ldquo;拍照识别&rdquo;按钮进行单次识别</li>
              </ul>
            </div>

            {/* 文件上传说明 */}
            <div>
              <h4 className="font-medium text-green-700 mb-1">📁 文件上传模式：</h4>
              <ul className="space-y-1 ml-4">
                <li>• 点击&ldquo;选择图片文件&rdquo;上传包含条形码的图片</li>
                <li>• 支持 JPG、PNG、GIF 等常见图片格式</li>
                <li>• 确保图片中的条形码清晰可见</li>
                <li>• 无需摄像头权限，适合批量处理</li>
              </ul>
            </div>

            {/* 通用说明 */}
            <div>
              <h4 className="font-medium text-gray-700 mb-1">🔧 通用功能：</h4>
              <ul className="space-y-1 ml-4">
                <li>• 支持多种格式：EAN、UPC、Code128、Code39等</li>
                <li>• 识别成功后会显示结果和格式类型</li>
                <li>• 可复制识别结果到剪贴板</li>
                <li>• 支持连续扫描多个条形码</li>
              </ul>
            </div>

            {/* 设备特定说明 */}
            {isIOS() && (
              <div>
                <h4 className="font-medium text-orange-600 mb-1">📱 iOS 设备提示：</h4>
                <ul className="space-y-1 ml-4">
                  <li>• 如摄像头未启动，请点击视频区域</li>
                  <li>• 建议使用 Safari 浏览器获得最佳体验</li>
                  <li>• 请确保允许摄像头权限并在 HTTPS 环境下访问</li>
                </ul>
              </div>
            )}
            {isAndroid() && (
              <div>
                <h4 className="font-medium text-blue-600 mb-1">🤖 Android 设备提示：</h4>
                <ul className="space-y-1 ml-4">
                  <li>• 已自动优化性能设置</li>
                  <li>• 建议使用 Chrome 浏览器获得最佳体验</li>
                  <li>• 如遇卡顿，系统会自动降低分辨率和帧率</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
