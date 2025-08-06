'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import jsQR from 'jsqr';

/**
 * 二维码扫描 Hook
 * 提供摄像头控制和二维码识别功能
 */
export function useQRScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);

  /**
   * 启动摄像头并开始扫描
   */
  const startScanning = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setScanResult(null);

      // 请求摄像头权限
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // 优先使用后置摄像头
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsScanning(true);
        
        // 等待视频加载完成后开始扫描
        videoRef.current.onloadedmetadata = () => {
          setIsLoading(false);
          scanQRCode();
        };
      }
    } catch (err) {
      console.error('启动摄像头失败:', err);
      setError('无法访问摄像头，请检查权限设置');
      setIsLoading(false);
    }
  }, []);

  /**
   * 停止扫描并关闭摄像头
   */
  const stopScanning = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    setIsScanning(false);
    setIsLoading(false);
    setError(null);
  }, []);

  /**
   * 扫描二维码
   */
  const scanQRCode = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isScanning) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // 将视频帧绘制到画布上
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // 获取图像数据
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // 使用 jsQR 识别二维码
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      
      if (code) {
        setScanResult({
          data: code.data,
          location: code.location,
          timestamp: Date.now()
        });
        stopScanning();
        return;
      }
    }

    // 继续扫描
    animationRef.current = requestAnimationFrame(scanQRCode);
  }, [isScanning, stopScanning]);

  /**
   * 重新扫描
   */
  const resetScan = useCallback(() => {
    setScanResult(null);
    setError(null);
  }, []);

  /**
   * 组件卸载时清理资源
   */
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  return {
    isScanning,
    scanResult,
    error,
    isLoading,
    videoRef,
    canvasRef,
    startScanning,
    stopScanning,
    resetScan
  };
}