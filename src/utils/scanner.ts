import jsQR from 'jsqr'

/**
 * 扫码结果接口
 */
export interface ScanResult {
  data: string
  format?: string
  timestamp: number
}

/**
 * 摄像头配置接口
 */
export interface CameraConfig {
  facingMode: 'user' | 'environment'
  width?: number
  height?: number
}

/**
 * 扫码器类
 * 处理摄像头调用和条形码识别
 */
export class BarcodeScanner {
  private video: HTMLVideoElement | null = null
  private canvas: HTMLCanvasElement | null = null
  private context: CanvasRenderingContext2D | null = null
  private stream: MediaStream | null = null
  private animationId: number | null = null
  private isScanning = false

  /**
   * 初始化扫码器
   */
  constructor(
    private videoElement: HTMLVideoElement,
    private canvasElement: HTMLCanvasElement,
    private onScanSuccess: (result: ScanResult) => void,
    private onScanError: (error: string) => void
  ) {
    this.video = videoElement
    this.canvas = canvasElement
    this.context = canvasElement.getContext('2d')
  }

  /**
   * 启动摄像头
   */
  async startCamera(config: CameraConfig = { facingMode: 'environment' }): Promise<void> {
    try {
      // 检查浏览器是否支持摄像头
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('当前浏览器不支持摄像头功能')
      }

      // 请求摄像头权限
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: config.facingMode,
          width: { ideal: config.width || 1280 },
          height: { ideal: config.height || 720 },
          aspectRatio: { ideal: 16/9 }
        },
        audio: false
      }

      this.stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      if (this.video) {
        this.video.srcObject = this.stream
        this.video.setAttribute('playsinline', 'true') // iOS Safari兼容
        this.video.play()
        
        // 等待视频加载完成
        await new Promise<void>((resolve) => {
          if (this.video) {
            this.video.onloadedmetadata = () => {
              resolve()
            }
          }
        })
        
        // 设置canvas尺寸
        if (this.canvas && this.video) {
          this.canvas.width = this.video.videoWidth
          this.canvas.height = this.video.videoHeight
        }
      }
    } catch (error) {
      console.error('启动摄像头失败:', error)
      this.onScanError('无法启动摄像头，请检查权限设置')
    }
  }

  /**
   * 开始扫描
   */
  startScanning(): void {
    if (this.isScanning) return
    
    this.isScanning = true
    this.scanFrame()
  }

  /**
   * 停止扫描
   */
  stopScanning(): void {
    this.isScanning = false
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  /**
   * 关闭摄像头
   */
  stopCamera(): void {
    this.stopScanning()
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }
    
    if (this.video) {
      this.video.srcObject = null
    }
  }

  /**
   * 切换摄像头（前置/后置）
   */
  async switchCamera(): Promise<void> {
    const currentFacingMode = this.getCurrentFacingMode()
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user'
    
    this.stopCamera()
    await this.startCamera({ facingMode: newFacingMode })
    this.startScanning()
  }

  /**
   * 获取当前摄像头方向
   */
  private getCurrentFacingMode(): 'user' | 'environment' {
    if (!this.stream) return 'environment'
    
    const videoTrack = this.stream.getVideoTracks()[0]
    const settings = videoTrack.getSettings()
    return settings.facingMode as 'user' | 'environment' || 'environment'
  }

  /**
   * 扫描单帧图像
   */
  private scanFrame(): void {
    if (!this.isScanning || !this.video || !this.canvas || !this.context) {
      return
    }

    // 检查视频是否准备就绪
    if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
      // 将视频帧绘制到canvas
      this.context.drawImage(
        this.video,
        0,
        0,
        this.canvas.width,
        this.canvas.height
      )

      // 获取图像数据
      const imageData = this.context.getImageData(
        0,
        0,
        this.canvas.width,
        this.canvas.height
      )

      // 使用jsQR识别二维码/条形码
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      })

      if (code) {
        // 识别成功
        this.stopScanning()
        this.onScanSuccess({
          data: code.data,
          format: 'QR_CODE', // jsQR主要识别二维码，但也能识别一些条形码
          timestamp: Date.now()
        })
        return
      }
    }

    // 继续下一帧
    this.animationId = requestAnimationFrame(() => this.scanFrame())
  }

  /**
   * 检查浏览器是否支持摄像头
   */
  static isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  }

  /**
   * 获取可用的摄像头设备
   */
  static async getVideoDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      return devices.filter(device => device.kind === 'videoinput')
    } catch (error) {
      console.error('获取摄像头设备失败:', error)
      return []
    }
  }
}

/**
 * 验证条形码格式
 */
export function validateBarcode(barcode: string): boolean {
  // 基本的条形码格式验证
  if (!barcode || typeof barcode !== 'string') {
    return false
  }

  // 移除空格和特殊字符
  const cleanBarcode = barcode.trim().replace(/[^0-9]/g, '')
  
  // 检查长度（常见条形码长度：8, 12, 13, 14位）
  const validLengths = [8, 12, 13, 14]
  if (!validLengths.includes(cleanBarcode.length)) {
    return false
  }

  // 检查是否全为数字
  return /^\d+$/.test(cleanBarcode)
}

/**
 * 格式化条形码
 */
export function formatBarcode(barcode: string): string {
  return barcode.trim().replace(/[^0-9]/g, '')
}