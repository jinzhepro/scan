'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RotateCcw, Flashlight, FlashlightOff, Camera } from 'lucide-react'
import { useQRScanner } from '@/hooks/useQRScanner'

/**
 * 扫码页面组件
 * 使用HTML5 MediaDevices API和jsQR库实现二维码扫描功能
 */
export default function ScanPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 使用二维码扫描Hook
  const {
    isSupported,
    isLoading,
    isScanning,
    error,
    result,
    cameraInfo,
    supportsFlashlight,
    flashEnabled,
    startCamera,
    stopCamera,
    startScanning,
    stopScanning,
    restartScan,
    switchCamera,
    toggleFlashlight,
    setConstraints
  } = useQRScanner(videoRef, canvasRef, {
    autoStart: true,
    onSuccess: (data) => {
      console.log('扫描成功:', data)
      // 跳转到商品详情页
      router.push(`/product/${data}`)
    },
    onError: (errorMessage) => {
      console.error('扫描失败:', errorMessage)
    }
  })

  /**
   * 返回首页
   */
  const goBack = async () => {
    await stopCamera()
    router.back()
  }

  /**
   * 处理摄像头切换
   */
  const handleSwitchCamera = async () => {
    try {
      await switchCamera()
    } catch (err) {
      console.error('切换摄像头失败:', err)
    }
  }

  /**
   * 处理闪光灯切换
   */
  const handleToggleFlashlight = async () => {
    try {
      await toggleFlashlight()
    } catch (err) {
      console.error('切换闪光灯失败:', err)
    }
  }

  // 如果浏览器不支持，显示错误信息
  if (!isSupported) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white p-6">
          <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-semibold mb-2">不支持摄像头功能</h2>
          <p className="text-white/70 mb-6">
            当前浏览器不支持摄像头功能，请使用现代浏览器访问
          </p>
          <button
            onClick={goBack}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200"
          >
            返回
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* 头部导航 */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center justify-between p-4 pt-12">
          <button
            onClick={goBack}
            className="w-10 h-10 bg-black/30 rounded-full flex items-center justify-center backdrop-blur-sm"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          
          <h1 className="text-white font-semibold">扫描二维码</h1>
          
          <div className="flex items-center gap-2">
            {/* 切换摄像头 */}
            <button
              onClick={handleSwitchCamera}
              disabled={isLoading}
              className="w-10 h-10 bg-black/30 rounded-full flex items-center justify-center backdrop-blur-sm disabled:opacity-50"
              title="切换摄像头"
            >
              <RotateCcw className="w-5 h-5 text-white" />
            </button>
            
            {/* 闪光灯切换 */}
            {supportsFlashlight && (
              <button
                onClick={handleToggleFlashlight}
                disabled={isLoading}
                className="w-10 h-10 bg-black/30 rounded-full flex items-center justify-center backdrop-blur-sm disabled:opacity-50"
                title={flashEnabled ? '关闭闪光灯' : '打开闪光灯'}
              >
                {flashEnabled ? (
                  <FlashlightOff className="w-5 h-5 text-white" />
                ) : (
                  <Flashlight className="w-5 h-5 text-white" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 摄像头视频流 */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />

      {/* 隐藏的canvas用于图像处理 */}
      <canvas
        ref={canvasRef}
        className="hidden"
      />

      {/* 扫描框和引导线 */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="relative">
          {/* 扫描框 */}
          <div className="w-64 h-64 border-2 border-blue-500 rounded-2xl relative">
            {/* 四个角的装饰 */}
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
            
            {/* 扫描线 */}
            {isScanning && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-pulse"></div>
            )}
          </div>
          
          {/* 提示文字 */}
          <div className="text-center mt-6">
            <p className="text-white text-lg font-medium mb-2">
              {isLoading ? '正在启动摄像头...' : 
               isScanning ? '将二维码对准扫描框' : 
               error ? '扫描失败' : '扫描完成'}
            </p>
            <p className="text-white/70 text-sm">
              {isLoading ? '请稍候' :
               isScanning ? '保持设备稳定，确保二维码清晰可见' :
               error ? error :
               result ? `识别到二维码: ${result}` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* 底部操作区 */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/50 to-transparent">
        <div className="p-6 pb-8">
          {/* 错误重试按钮 */}
          {error && (
            <div className="mb-4">
              <button
                onClick={restartScan}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200"
              >
                重新扫描
              </button>
            </div>
          )}
          
          {/* 手动开始扫描按钮 */}
          {!isScanning && !error && !isLoading && (
            <div className="mb-4">
              <button
                onClick={startScanning}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                开始扫描
              </button>
            </div>
          )}

          {/* 停止扫描按钮 */}
          {isScanning && (
            <div className="mb-4">
              <button
                onClick={stopScanning}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200"
              >
                停止扫描
              </button>
            </div>
          )}
          
          {/* 加载状态 */}
          {isLoading && (
            <div className="flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
              <span className="text-white">初始化摄像头...</span>
            </div>
          )}
          
          {/* 状态信息 */}
          {!isLoading && !error && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-4 text-white/70">
                <Camera className="w-5 h-5" />
                <span className="text-sm">
                  {cameraInfo?.facingMode === 'user' ? '前置摄像头' : '后置摄像头'}
                </span>
                {supportsFlashlight && (
                  <>
                    <span className="text-white/50">•</span>
                    <span className="text-sm">
                      闪光灯{flashEnabled ? '已开启' : '已关闭'}
                    </span>
                  </>
                )}
              </div>
              
              <p className="text-white/50 text-xs mt-2">
                支持二维码和条形码扫描
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}