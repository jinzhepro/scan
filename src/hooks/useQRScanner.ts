/**
 * 二维码扫描Hook
 * 使用HTML5 MediaDevices API和jsQR库实现二维码扫描功能
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { QRScanner, QRScanResult, CameraConstraints, validateQRCode, formatQRCode } from '@/utils/qrScanner'

export interface UseQRScannerOptions {
  onSuccess?: (data: string) => void
  onError?: (error: string) => void
  autoStart?: boolean
  constraints?: CameraConstraints
}

export interface UseQRScannerReturn {
  // 状态
  isSupported: boolean
  isLoading: boolean
  isScanning: boolean
  error: string | null
  result: string | null
  
  // 摄像头信息
  cameraInfo: { facingMode?: string; deviceId?: string } | null
  supportsFlashlight: boolean
  flashEnabled: boolean
  
  // 操作方法
  startCamera: () => Promise<void>
  stopCamera: () => Promise<void>
  startScanning: () => void
  stopScanning: () => void
  restartScan: () => void
  switchCamera: () => Promise<void>
  toggleFlashlight: () => Promise<void>
  
  // 设置方法
  setConstraints: (constraints: CameraConstraints) => void
}

export function useQRScanner(
  videoRef: React.RefObject<HTMLVideoElement>,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  options: UseQRScannerOptions = {}
): UseQRScannerReturn {
  const {
    onSuccess,
    onError,
    autoStart = false,
    constraints: initialConstraints = { facingMode: 'environment' }
  } = options

  // 状态管理
  const [isLoading, setIsLoading] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [cameraInfo, setCameraInfo] = useState<{ facingMode?: string; deviceId?: string } | null>(null)
  const [supportsFlashlight, setSupportsFlashlight] = useState(false)
  const [flashEnabled, setFlashEnabled] = useState(false)
  const [constraints, setConstraints] = useState<CameraConstraints>(initialConstraints)

  // 扫描器实例
  const scannerRef = useRef<QRScanner | null>(null)

  // 检查浏览器支持
  const isSupported = QRScanner.isSupported()

  /**
   * 扫描成功回调
   */
  const handleScanSuccess = useCallback((scanResult: QRScanResult) => {
    const formattedData = formatQRCode(scanResult.data)
    
    if (!validateQRCode(formattedData)) {
      setError('无效的二维码格式')
      return
    }

    setResult(formattedData)
    setIsScanning(false)
    onSuccess?.(formattedData)
  }, [onSuccess])

  /**
   * 扫描错误回调
   */
  const handleScanError = useCallback((errorMessage: string) => {
    setError(errorMessage)
    setIsScanning(false)
    onError?.(errorMessage)
  }, [onError])

  /**
   * 启动摄像头
   */
  const startCamera = useCallback(async () => {
    if (!isSupported) {
      const errorMsg = '当前浏览器不支持摄像头功能'
      setError(errorMsg)
      onError?.(errorMsg)
      return
    }

    if (!videoRef.current || !canvasRef.current) {
      const errorMsg = '视频元素未准备就绪'
      setError(errorMsg)
      onError?.(errorMsg)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // 创建扫描器实例
      if (!scannerRef.current) {
        scannerRef.current = new QRScanner(
          videoRef.current,
          canvasRef.current,
          handleScanSuccess,
          handleScanError
        )
      }

      // 启动摄像头
      await scannerRef.current.startCamera(constraints)
      
      // 更新摄像头信息
      setCameraInfo(scannerRef.current.getCurrentCameraInfo())
      
      // 检查闪光灯支持
      const flashSupported = await scannerRef.current.supportsFlashlight()
      setSupportsFlashlight(flashSupported)

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '启动摄像头失败'
      setError(errorMsg)
      onError?.(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }, [isSupported, videoRef, canvasRef, constraints, handleScanSuccess, handleScanError, onError])

  /**
   * 停止摄像头
   */
  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      await scannerRef.current.stopCamera()
      setCameraInfo(null)
      setSupportsFlashlight(false)
      setFlashEnabled(false)
    }
    setIsScanning(false)
  }, [])

  /**
   * 开始扫描
   */
  const startScanning = useCallback(() => {
    if (scannerRef.current && !isScanning) {
      scannerRef.current.startScanning()
      setIsScanning(true)
      setError(null)
      setResult(null)
    }
  }, [isScanning])

  /**
   * 停止扫描
   */
  const stopScanning = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.stopScanning()
      setIsScanning(false)
    }
  }, [])

  /**
   * 重新开始扫描
   */
  const restartScan = useCallback(() => {
    setError(null)
    setResult(null)
    startScanning()
  }, [startScanning])

  /**
   * 切换摄像头
   */
  const switchCamera = useCallback(async () => {
    if (!scannerRef.current) return

    try {
      setIsLoading(true)
      await scannerRef.current.switchCamera()
      setCameraInfo(scannerRef.current.getCurrentCameraInfo())
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '切换摄像头失败'
      setError(errorMsg)
      onError?.(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }, [onError])

  /**
   * 切换闪光灯
   */
  const toggleFlashlight = useCallback(async () => {
    if (!scannerRef.current || !supportsFlashlight) return

    try {
      const newFlashState = !flashEnabled
      await scannerRef.current.toggleFlashlight(newFlashState)
      setFlashEnabled(newFlashState)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '闪光灯控制失败'
      setError(errorMsg)
      onError?.(errorMsg)
    }
  }, [flashEnabled, supportsFlashlight, onError])

  /**
   * 自动启动
   */
  useEffect(() => {
    if (autoStart && isSupported) {
      startCamera()
    }

    // 清理函数
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stopCamera()
        scannerRef.current = null
      }
    }
  }, [autoStart, isSupported, startCamera])

  /**
   * 约束变化时重新启动摄像头
   */
  useEffect(() => {
    if (scannerRef.current) {
      startCamera()
    }
  }, [constraints, startCamera])

  return {
    // 状态
    isSupported,
    isLoading,
    isScanning,
    error,
    result,
    
    // 摄像头信息
    cameraInfo,
    supportsFlashlight,
    flashEnabled,
    
    // 操作方法
    startCamera,
    stopCamera,
    startScanning,
    stopScanning,
    restartScan,
    switchCamera,
    toggleFlashlight,
    
    // 设置方法
    setConstraints
  }
}