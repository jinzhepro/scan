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

      // 检查浏览器支持
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('您的浏览器不支持摄像头功能');
      }

      // 检查是否为 HTTPS 或 localhost
      const isSecureContext = window.isSecureContext || 
        window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1';
      
      if (!isSecureContext) {
        throw new Error('摄像头功能需要在 HTTPS 环境下使用，请使用 HTTPS 访问或在本地环境测试');
      }

      // 移动端优化的摄像头配置
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' }, // 优先使用后置摄像头
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          // 移动端优化
          aspectRatio: { ideal: 16/9 },
          frameRate: { ideal: 30, max: 60 }
        },
        audio: false
      };

      // 请求摄像头权限
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // 移动端播放优化
        videoRef.current.setAttribute('playsinline', true);
        videoRef.current.setAttribute('webkit-playsinline', true);
        videoRef.current.muted = true;
        
        await videoRef.current.play();
        setIsScanning(true);
        
        // 等待视频加载完成后开始扫描
        videoRef.current.onloadedmetadata = () => {
          setIsLoading(false);
          scanQRCode();
        };
      }
    } catch (err) {
      console.error('启动摄像头失败:', err);
      
      let errorMessage = '无法访问摄像头';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = '摄像头权限被拒绝，请在浏览器设置中允许访问摄像头';
      } else if (err.name === 'NotFoundError') {
        errorMessage = '未找到摄像头设备';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = '您的设备不支持摄像头功能';
      } else if (err.name === 'NotReadableError') {
        errorMessage = '摄像头被其他应用占用，请关闭其他使用摄像头的应用';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
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