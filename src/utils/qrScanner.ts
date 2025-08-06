/**
 * 二维码扫描工具类
 * 使用HTML5 MediaDevices API获取摄像头流，结合jsQR库解析二维码
 */

import jsQR from "jsqr";

export interface QRScanResult {
  data: string;
  location?: {
    topLeftCorner: { x: number; y: number };
    topRightCorner: { x: number; y: number };
    bottomLeftCorner: { x: number; y: number };
    bottomRightCorner: { x: number; y: number };
  };
}

export interface CameraConstraints {
  facingMode?: "user" | "environment";
  width?: number;
  height?: number;
}

export class QRScanner {
  private video: HTMLVideoElement;
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private stream: MediaStream | null = null;
  private animationId: number | null = null;
  private isScanning = false;
  private onSuccess: (result: QRScanResult) => void;
  private onError: (error: string) => void;

  constructor(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    onSuccess: (result: QRScanResult) => void,
    onError: (error: string) => void
  ) {
    this.video = video;
    this.canvas = canvas;
    this.onSuccess = onSuccess;
    this.onError = onError;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("无法获取Canvas 2D上下文");
    }
    this.context = context;

    // 设置视频元素属性
    this.video.setAttribute("playsinline", "true");
    this.video.setAttribute("muted", "true");
  }

  /**
   * 检查浏览器是否支持MediaDevices API
   */
  static isSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      typeof CanvasRenderingContext2D !== "undefined"
    );
  }

  /**
   * 获取可用的摄像头设备
   */
  static async getVideoDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((device) => device.kind === "videoinput");
    } catch (error) {
      console.error("获取摄像头设备失败:", error);
      return [];
    }
  }

  /**
   * 启动摄像头
   */
  async startCamera(constraints: CameraConstraints = {}): Promise<void> {
    try {
      // 停止现有流
      await this.stopCamera();

      // 构建媒体约束
      const mediaConstraints: MediaStreamConstraints = {
        video: {
          facingMode: constraints.facingMode || "environment",
          width: { ideal: constraints.width || 1280 },
          height: { ideal: constraints.height || 720 },
        },
        audio: false,
      };

      // 获取媒体流
      this.stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);

      // 设置视频源
      this.video.srcObject = this.stream;

      // 等待视频加载
      await new Promise<void>((resolve, reject) => {
        this.video.onloadedmetadata = () => {
          this.video
            .play()
            .then(() => resolve())
            .catch(reject);
        };
        this.video.onerror = () => reject(new Error("视频加载失败"));
      });

      // 设置Canvas尺寸
      this.updateCanvasSize();
    } catch (error) {
      console.error("启动摄像头失败:", error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 停止摄像头
   */
  async stopCamera(): Promise<void> {
    // 停止扫描
    this.stopScanning();

    // 停止媒体流
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    // 清空视频源
    this.video.srcObject = null;
  }

  /**
   * 开始扫描
   */
  startScanning(): void {
    if (this.isScanning) return;

    this.isScanning = true;
    this.scanFrame();
  }

  /**
   * 停止扫描
   */
  stopScanning(): void {
    this.isScanning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * 扫描单帧
   */
  private scanFrame(): void {
    if (!this.isScanning) return;

    try {
      // 更新Canvas尺寸
      this.updateCanvasSize();

      // 绘制视频帧到Canvas
      this.context.drawImage(
        this.video,
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );

      // 获取图像数据
      const imageData = this.context.getImageData(
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );

      // 使用jsQR解析二维码
      const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (qrCode) {
        // 找到二维码，停止扫描并回调
        this.stopScanning();
        this.onSuccess({
          data: qrCode.data,
          location: qrCode.location,
        });
        return;
      }

      // 继续下一帧
      this.animationId = requestAnimationFrame(() => this.scanFrame());
    } catch (error) {
      console.error("扫描帧处理失败:", error);
      this.onError("扫描过程中发生错误");
    }
  }

  /**
   * 更新Canvas尺寸以匹配视频
   */
  private updateCanvasSize(): void {
    if (this.video.videoWidth && this.video.videoHeight) {
      this.canvas.width = this.video.videoWidth;
      this.canvas.height = this.video.videoHeight;
    }
  }

  /**
   * 获取友好的错误消息
   */
  private getErrorMessage(error: any): string {
    if (error.name === "NotAllowedError") {
      return "摄像头权限被拒绝，请允许访问摄像头";
    }
    if (error.name === "NotFoundError") {
      return "未找到摄像头设备";
    }
    if (error.name === "NotSupportedError") {
      return "当前浏览器不支持摄像头功能";
    }
    if (error.name === "NotReadableError") {
      return "摄像头被其他应用占用";
    }
    if (error.name === "OverconstrainedError") {
      return "摄像头不支持请求的配置";
    }
    return error.message || "摄像头启动失败";
  }

  /**
   * 切换摄像头（前置/后置）
   */
  async switchCamera(): Promise<void> {
    if (!this.stream) {
      throw new Error("摄像头未启动");
    }

    // 获取当前约束
    const videoTrack = this.stream.getVideoTracks()[0];
    const settings = videoTrack.getSettings();
    const currentFacingMode = settings.facingMode;

    // 切换到相反的摄像头
    const newFacingMode = currentFacingMode === "user" ? "environment" : "user";

    await this.startCamera({ facingMode: newFacingMode });
  }

  /**
   * 获取当前摄像头信息
   */
  getCurrentCameraInfo(): { facingMode?: string; deviceId?: string } | null {
    if (!this.stream) return null;

    const videoTrack = this.stream.getVideoTracks()[0];
    const settings = videoTrack.getSettings();

    return {
      facingMode: settings.facingMode,
      deviceId: settings.deviceId,
    };
  }

  /**
   * 检查是否支持闪光灯
   */
  async supportsFlashlight(): Promise<boolean> {
    if (!this.stream) return false;

    try {
      const videoTrack = this.stream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities();
      return !!(capabilities as any).torch;
    } catch {
      return false;
    }
  }

  /**
   * 切换闪光灯
   */
  async toggleFlashlight(enabled: boolean): Promise<void> {
    if (!this.stream) {
      throw new Error("摄像头未启动");
    }

    try {
      const videoTrack = this.stream.getVideoTracks()[0];
      await videoTrack.applyConstraints({
        advanced: [{ torch: enabled } as any],
      });
    } catch (error) {
      throw new Error("闪光灯控制失败");
    }
  }
}

/**
 * 验证二维码/条形码格式
 */
export function validateQRCode(data: string): boolean {
  if (!data || data.trim().length === 0) {
    return false;
  }

  // 基本长度检查
  if (data.length < 3 || data.length > 200) {
    return false;
  }

  return true;
}

/**
 * 格式化二维码/条形码数据
 */
export function formatQRCode(data: string): string {
  return data.trim();
}
