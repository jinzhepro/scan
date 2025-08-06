'use client';

import { useQRScanner } from '@/hooks/useQRScanner';

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
    resetScan
  } = useQRScanner();

  /**
   * 渲染扫描结果
   */
  const renderScanResult = () => {
    if (!scanResult) return null;

    return (
      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="text-lg font-semibold text-green-800 mb-2">扫描成功！</h3>
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
            onClick={() => navigator.clipboard?.writeText(scanResult.data)}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            复制内容
          </button>
        </div>
      </div>
    );
  };

  /**
   * 渲染错误信息
   */
  const renderError = () => {
    if (!error) return null;

    return (
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-semibold text-red-800 mb-2">扫描失败</h3>
        <p className="text-red-700">{error}</p>
        <button
          onClick={resetScan}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          重试
        </button>
      </div>
    );
  };

  /**
   * 渲染摄像头预览
   */
  const renderCameraPreview = () => {
    if (!isScanning) return null;

    return (
      <div className="mt-6">
        <div className="relative bg-black rounded-lg overflow-hidden">
          {/* 视频预览 */}
          <video
            ref={videoRef}
            className="w-full h-64 object-cover"
            playsInline
            muted
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
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p>正在启动摄像头...</p>
              </div>
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
        <h2 className="text-2xl font-bold text-gray-800 mb-4">二维码扫描器</h2>
        
        {/* 开始扫描按钮 */}
        {!isScanning && !scanResult && (
          <button
            onClick={startScanning}
            disabled={isLoading}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '启动中...' : '开始扫描'}
          </button>
        )}
      </div>

      {/* 摄像头预览 */}
      {renderCameraPreview()}

      {/* 扫描结果 */}
      {renderScanResult()}

      {/* 错误信息 */}
      {renderError()}

      {/* 使用说明 */}
      {!isScanning && !scanResult && !error && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">使用说明：</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• 点击&ldquo;开始扫描&rdquo;按钮启动摄像头</li>
            <li>• 将二维码对准扫描框</li>
            <li>• 系统会自动识别并显示结果</li>
            <li>• 支持各种类型的二维码和条形码</li>
          </ul>
        </div>
      )}
    </div>
  );
}