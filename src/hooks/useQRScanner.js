'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  BrowserMultiFormatReader,
  NotFoundException
} from '@zxing/library';
import { toast } from 'sonner';

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
   * 创建 ZXing 解码器实例
   * @returns {BrowserMultiFormatReader} 配置好的解码器实例
   */
  const createDecoder = useCallback(() => {
    // 使用默认配置，支持所有格式
    return new BrowserMultiFormatReader();
  }, []);

  /**
   * 从 Canvas 解码条形码
   * @param {HTMLCanvasElement} canvas - 包含图像的 Canvas 元素
   * @returns {Promise<string>} 解码结果
   */
  const decodeFromCanvas = useCallback(async (canvas) => {
    const reader = createDecoder();
    
    try {
      // 使用 BrowserMultiFormatReader 的 decodeFromCanvas 方法
      const result = await reader.decodeFromCanvas(canvas);
      return result.text; // 直接返回 text 属性
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new Error('未检测到条形码');
      }
      throw error;
    }
  }, [createDecoder]);

  /**
   * 检测是否为iOS设备
   */
  const isIOS = useCallback(() => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }, []);

  /**
   * 检测是否为Safari浏览器
   */
  const isSafari = useCallback(() => {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  }, []);

  /**
   * 检测是否为安卓设备
   */
  const isAndroid = useCallback(() => {
    return /Android/i.test(navigator.userAgent);
  }, []);

  /**
   * 检测是否为低端设备（需要性能优化）
   */
  const isLowEndDevice = useCallback(() => {
    // 检测设备内存（如果可用）
    const memory = navigator.deviceMemory;
    if (memory && memory <= 2) return true;
    
    // 检测CPU核心数（如果可用）
    const cores = navigator.hardwareConcurrency;
    if (cores && cores <= 2) return true;
    
    // 检测是否为老旧安卓设备
    const userAgent = navigator.userAgent;
    if (/Android [4-6]\./i.test(userAgent)) return true;
    
    return false;
  }, []);

  /**
   * 启动摄像头并开始扫描
   */
  const startScanning = useCallback(async () => {
    try {
      console.log('🎥 开始启动摄像头...');
      setIsLoading(true);
      setError(null);
      setScanResult(null);

      // 检查浏览器支持
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('❌ 浏览器不支持摄像头功能');
        throw new Error('您的浏览器不支持摄像头功能');
      }
      console.log('✅ 浏览器支持摄像头功能');

      // 检查是否为 HTTPS 或 localhost
      const isSecureContext = window.isSecureContext || 
        window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1';
      
      console.log('🔒 安全上下文检查:', { 
        isSecureContext, 
        hostname: window.location.hostname,
        protocol: window.location.protocol 
      });
      
      if (!isSecureContext) {
        console.error('❌ 不是安全上下文');
        throw new Error('摄像头功能需要在 HTTPS 环境下使用，请使用 HTTPS 访问或在本地环境测试');
      }
      console.log('✅ 安全上下文检查通过');

      // 设备检测
      const isIOSDevice = isIOS();
      const isSafariBrowser = isSafari();
      const isAndroidDevice = isAndroid();
      const isLowEnd = isLowEndDevice();

      // 基础摄像头配置
      let constraints = {
        video: {
          facingMode: 'environment',
        },
        audio: false
      };

      // 根据设备类型优化配置
      if (isIOSDevice && isSafariBrowser) {
        // iOS Safari 使用简单配置
        constraints.video = {
          facingMode: 'environment',
        };
      } else if (isAndroidDevice) {
        // 安卓设备优化配置
        if (isLowEnd) {
          // 低端安卓设备：使用最低配置以确保流畅性
          constraints.video = {
            facingMode: { ideal: 'environment' },
            width: { ideal: 640, max: 854 },
            height: { ideal: 480, max: 640 },
            frameRate: { ideal: 15, max: 20 }
          };
        } else {
          // 中高端安卓设备：平衡性能和质量
          constraints.video = {
            facingMode: { ideal: 'environment' },
            width: { ideal: 854, max: 1280 },
            height: { ideal: 640, max: 720 },
            frameRate: { ideal: 20, max: 30 }
          };
        }
      } else {
        // 其他设备（桌面浏览器等）：使用高质量配置
        constraints.video = {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          aspectRatio: { ideal: 16/9 },
          frameRate: { ideal: 30, max: 60 }
        };
      }

      let stream = null;
      
      console.log('📱 设备检测:', { 
        isIOSDevice, 
        isSafariBrowser, 
        isAndroidDevice, 
        isLowEnd,
        deviceMemory: navigator.deviceMemory,
        hardwareConcurrency: navigator.hardwareConcurrency
      });
      console.log('🎯 摄像头配置:', constraints);
      
      if (isAndroidDevice) {
        console.log('🤖 安卓设备性能优化:');
        console.log('  - 设备类型:', isLowEnd ? '低端设备' : '中高端设备');
        console.log('  - 扫描频率:', isLowEnd ? '10 FPS' : '15 FPS');
        console.log('  - 处理分辨率:', isLowEnd ? '480x360' : '640x480');
      }
      
      try {
        // 首次尝试获取摄像头
        console.log('🔄 首次尝试获取摄像头权限...');
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('✅ 首次摄像头权限获取成功');
      } catch (firstError) {
        console.warn('⚠️ 首次摄像头请求失败，尝试简化配置:', firstError);
        
        // 如果失败，尝试最简单的配置
        const fallbackConstraints = {
          video: true,
          audio: false
        };
        
        console.log('🔄 尝试简化配置:', fallbackConstraints);
        try {
          stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
          console.log('✅ 简化配置摄像头权限获取成功');
        } catch (secondError) {
          console.warn('⚠️ 简化配置也失败，尝试后置摄像头:', secondError);
          // 如果还是失败，尝试只请求后置摄像头
          const backCameraConstraints = {
            video: { facingMode: 'environment' },
            audio: false
          };
          console.log('🔄 尝试后置摄像头配置:', backCameraConstraints);
          stream = await navigator.mediaDevices.getUserMedia(backCameraConstraints);
          console.log('✅ 后置摄像头权限获取成功');
        }
      }

      streamRef.current = stream;
      console.log('💾 摄像头流已保存到 streamRef');
      
      if (videoRef.current && stream) {
        console.log('🎬 设置视频元素的摄像头流');
        videoRef.current.srcObject = stream;
        
        // 获取到摄像头流后立即显示预览区域
        console.log('👁️ 设置 isScanning 为 true，显示预览区域');
        setIsScanning(true);
        
        // iOS Safari 特殊属性设置
        videoRef.current.setAttribute('playsinline', true);
        videoRef.current.setAttribute('webkit-playsinline', true);
        videoRef.current.setAttribute('muted', true);
        videoRef.current.muted = true;
        
        // iOS 特殊属性
        if (isIOSDevice) {
          videoRef.current.setAttribute('x5-playsinline', true);
          videoRef.current.setAttribute('x5-video-player-type', 'h5');
          videoRef.current.setAttribute('x5-video-player-fullscreen', false);
        }

        // 设置超时保护，防止无限加载
        const loadingTimeout = setTimeout(() => {
          if (isLoading) {
            console.warn('摄像头加载超时');
            setIsLoading(false);
            if (isIOSDevice) {
              toast.info('加载超时', {
                description: '请点击视频区域手动启动摄像头',
                duration: 5000,
              });
            } else {
              toast.error('摄像头启动超时', {
                description: '请重试或检查设备权限',
                duration: 4000,
              });
            }
          }
        }, 10000); // 10秒超时

        // 设置视频事件监听
        const handleVideoReady = () => {
          clearTimeout(loadingTimeout);
          setIsLoading(false);
          // isScanning 已经在获取流后设置为 true，这里不需要重复设置
          if (!animationRef.current) {
            scanQRCode();
          }
        };

        const handleVideoError = (error) => {
          clearTimeout(loadingTimeout);
          console.error('视频播放错误:', error);
          setIsLoading(false);
          toast.error('视频播放失败', {
            description: isIOSDevice ? '请点击视频区域手动启动' : '请检查摄像头设置',
            duration: 4000,
          });
        };

        // 视频可以播放时的处理
        const handleCanPlay = () => {
          clearTimeout(loadingTimeout);
          setIsLoading(false);
          // isScanning 已经在获取流后设置为 true，这里不需要重复设置
          if (!animationRef.current) {
            scanQRCode();
          }
        };

        // 添加事件监听器
        videoRef.current.onloadedmetadata = handleVideoReady;
        videoRef.current.oncanplay = handleCanPlay;
        videoRef.current.onerror = handleVideoError;

        try {
          // 尝试自动播放
          await videoRef.current.play();
          
          // 播放成功后更新加载状态
          clearTimeout(loadingTimeout);
          setIsLoading(false);
          // isScanning 已经在获取流后设置为 true，这里不需要重复设置
          
          // 如果是iOS设备，给用户一个提示
          if (isIOSDevice && isSafariBrowser) {
            toast.info('iOS 设备提示', {
              description: '如果摄像头未启动，请点击视频区域',
              duration: 3000,
            });
          }
          
          // 开始扫描
          if (!animationRef.current) {
            scanQRCode();
          }
        } catch (playError) {
          console.warn('自动播放失败:', playError);
          
          // iOS Safari 经常需要用户交互才能播放
          if (isIOSDevice) {
            clearTimeout(loadingTimeout);
            setIsLoading(false);
            
            toast.info('需要手动启动', {
              description: '请点击视频区域启动摄像头',
              duration: 5000,
            });
            
            // 添加点击事件监听器
            const handleVideoClick = async () => {
              try {
                await videoRef.current.play();
                setIsScanning(true);
                toast.success('摄像头已启动', {
                  description: '开始扫描二维码',
                  duration: 2000,
                });
                videoRef.current.removeEventListener('click', handleVideoClick);
                
                // 开始扫描
                if (!animationRef.current) {
                  scanQRCode();
                }
              } catch (clickPlayError) {
                console.error('点击播放失败:', clickPlayError);
                toast.error('播放失败', {
                  description: '请检查摄像头权限',
                  duration: 3000,
                });
              }
            };
            
            if (videoRef.current) {
              videoRef.current.addEventListener('click', handleVideoClick);
            }
          } else {
            clearTimeout(loadingTimeout);
            setIsLoading(false);
            throw playError;
          }
        }
      }
    } catch (err) {
      console.error('启动摄像头失败:', err);
      
      let errorMessage = '无法访问摄像头';
      let description = '请检查设备权限和网络环境';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = '摄像头权限被拒绝';
        description = isIOS() ? '请在Safari设置中允许摄像头访问' : '请在浏览器设置中允许摄像头访问';
      } else if (err.name === 'NotFoundError') {
        errorMessage = '未找到摄像头设备';
        description = '请检查设备是否有摄像头';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = '设备不支持摄像头功能';
        description = '请使用支持摄像头的设备';
      } else if (err.name === 'NotReadableError') {
        errorMessage = '摄像头被占用';
        description = '请关闭其他使用摄像头的应用';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = '摄像头配置不支持';
        description = '设备摄像头不支持当前配置';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // 使用 Sonner toast 显示错误消息
      toast.error(errorMessage, {
        description: description,
        duration: 5000,
      });
      
      setError(errorMessage);
      setIsLoading(false);
    }
  }, [isIOS, isSafari]);

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
   * 扫描条形码 - 使用 video 元素直接解码
   */
  const scanQRCode = useCallback(async () => {
    if (!videoRef.current || !isScanning) {
      return;
    }

    const video = videoRef.current;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      console.log('🎥 视频准备就绪，开始扫描条形码');
      
      // 使用 ZXing 的 decodeFromVideoDevice 方法直接从 video 元素解码
      try {
        console.log('🔍 开始ZXing条形码识别...');
        
        const decoder = createDecoder();
        const result = await decoder.decodeFromVideoDevice(video);
        
        console.log('🎉 条形码识别成功!', {
          text: result.text,
          format: result.format
        });
        
        const scanResult = {
          data: result.text,
          timestamp: Date.now(),
          type: result.format || 'QR_CODE'
        };
        
        setScanResult(scanResult);
        
        // 显示扫描成功的 toast
        toast.success('条形码扫描成功！', {
          description: `内容: ${result.text.length > 30 ? result.text.substring(0, 30) + '...' : result.text}`,
          duration: 3000,
        });
        
        stopScanning();
      } catch (err) {
        // ZXing 识别失败是正常的，不需要处理
        if (!(err instanceof NotFoundException)) {
          console.warn('⚠️ 条形码识别错误:', err);
        }
      }
    } else {
      console.log('⏳ 视频未准备就绪，readyState:', video.readyState);
    }

    // 根据设备性能调整扫描频率
    const isAndroidDevice = isAndroid();
    const isLowEnd = isLowEndDevice();
    
    if (isAndroidDevice && isLowEnd) {
      // 低端安卓设备：降低扫描频率到 10 FPS
      setTimeout(() => {
        if (isScanning) {
          animationRef.current = requestAnimationFrame(scanQRCode);
        }
      }, 100);
    } else if (isAndroidDevice) {
      // 中端安卓设备：降低扫描频率到 15 FPS
      setTimeout(() => {
        if (isScanning) {
          animationRef.current = requestAnimationFrame(scanQRCode);
        }
      }, 66);
    } else {
      // 其他设备：正常频率
      animationRef.current = requestAnimationFrame(scanQRCode);
    }
  }, [isScanning, stopScanning, isAndroid, isLowEndDevice, createDecoder]);

  /**
   * 重新扫描
   */
  const resetScan = useCallback(() => {
    setScanResult(null);
    setError(null);
  }, []);

  /**
   * 图像预处理函数 - 增强条形码识别效果
   */
  const preprocessImage = (canvas, context) => {
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // 转换为灰度图像并增强对比度
    for (let i = 0; i < data.length; i += 4) {
      // 计算灰度值
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      
      // 增强对比度 (简单的阈值处理)
      const enhanced = gray > 128 ? 255 : 0;
      
      data[i] = enhanced;     // R
      data[i + 1] = enhanced; // G
      data[i + 2] = enhanced; // B
      // data[i + 3] 保持不变 (Alpha)
    }
    
    context.putImageData(imageData, 0, 0);
    return imageData;
  };

  /**
   * 创建不同尺寸的画布进行多尺度识别
   */
  const createScaledCanvas = (originalCanvas, scale) => {
    const scaledCanvas = document.createElement('canvas');
    const scaledContext = scaledCanvas.getContext('2d');
    
    scaledCanvas.width = originalCanvas.width * scale;
    scaledCanvas.height = originalCanvas.height * scale;
    
    // 使用高质量缩放
    scaledContext.imageSmoothingEnabled = true;
    scaledContext.imageSmoothingQuality = 'high';
    
    scaledContext.drawImage(originalCanvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
    
    return scaledCanvas;
  };

  /**
   * 拍照并识别条形码 - 增强版
   */
  const captureAndScan = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isScanning) {
      console.warn('⚠️ 拍照失败：视频或画布未准备就绪');
      toast.error('拍照失败', {
        description: '请确保摄像头已启动',
        duration: 3000,
      });
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      console.warn('⚠️ 拍照失败：视频未准备就绪');
      toast.error('拍照失败', {
        description: '请等待摄像头完全启动',
        duration: 3000,
      });
      return;
    }

    console.log('📸 开始拍照识别...');
    
    // 设置画布尺寸为视频尺寸
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // 将当前视频帧绘制到画布上
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    console.log('📐 拍照尺寸:', { width: canvas.width, height: canvas.height });
    
    // 使用新的解码方法识别条形码
    try {
      console.log('🔍 开始增强识别拍照图片中的条形码...');
      
      // 增强识别策略
      const enhancedDecode = async () => {
        const attempts = [];
        
        // 策略1: 原始图像识别
        attempts.push(
          (async () => {
            console.log('🔍 策略1: 原始图像识别...');
            try {
              return await decodeFromCanvas(canvas);
            } catch (error) {
              console.log('❌ 原始图像识别失败:', error.message);
              throw error;
            }
          })()
        );
        
        // 策略2: 预处理后识别
        attempts.push(
          (async () => {
            console.log('🔍 策略2: 预处理图像识别...');
            try {
              const processedCanvas = document.createElement('canvas');
              const processedContext = processedCanvas.getContext('2d');
              processedCanvas.width = canvas.width;
              processedCanvas.height = canvas.height;
              processedContext.drawImage(canvas, 0, 0);
              
              // 应用图像预处理
              preprocessImage(processedCanvas, processedContext);
              
              return await decodeFromCanvas(processedCanvas);
            } catch (error) {
              console.log('❌ 预处理图像识别失败:', error.message);
              throw error;
            }
          })()
        );
        
        // 策略3: 多尺度识别
        const scales = [0.5, 1.5, 2.0];
        scales.forEach(scale => {
          attempts.push(
            (async () => {
              console.log(`🔍 策略3: ${scale}x 尺度识别...`);
              try {
                const scaledCanvas = createScaledCanvas(canvas, scale);
                return await decodeFromCanvas(scaledCanvas);
              } catch (error) {
                console.log(`❌ ${scale}x 尺度识别失败:`, error.message);
                throw error;
              }
            })()
          );
        });
        
        // 策略4: 旋转角度识别
        const rotations = [90, 180, 270];
        rotations.forEach(angle => {
          attempts.push(
            (async () => {
              console.log(`🔍 策略4: ${angle}° 旋转识别...`);
              try {
                const rotatedCanvas = document.createElement('canvas');
                const rotatedContext = rotatedCanvas.getContext('2d');
                
                if (angle === 90 || angle === 270) {
                  rotatedCanvas.width = canvas.height;
                  rotatedCanvas.height = canvas.width;
                } else {
                  rotatedCanvas.width = canvas.width;
                  rotatedCanvas.height = canvas.height;
                }
                
                rotatedContext.translate(rotatedCanvas.width / 2, rotatedCanvas.height / 2);
                rotatedContext.rotate((angle * Math.PI) / 180);
                rotatedContext.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
                
                return await decodeFromCanvas(rotatedCanvas);
              } catch (error) {
                console.log(`❌ ${angle}° 旋转识别失败:`, error.message);
                throw error;
              }
            })()
          );
        });
        
        // 并行执行所有识别策略，返回第一个成功的结果
        try {
          const resultText = await Promise.any(attempts);
          return resultText;
        } catch (aggregateError) {
          // 所有策略都失败了
          console.log('❌ 所有识别策略都失败了');
          throw new Error('所有识别策略都失败');
        }
      };
      
      // 执行增强识别
      enhancedDecode()
        .then(resultText => {
          console.log('🎉 拍照条形码识别成功!', {
            text: resultText
          });
          
          const scanResult = {
            data: resultText,
            timestamp: Date.now(),
            type: 'BARCODE', // 通用类型
            method: 'capture' // 标记为拍照识别
          };
          
          setScanResult(scanResult);
          
          // 显示扫描成功的 toast
          toast.success('拍照识别成功！', {
            description: `内容: ${resultText.length > 30 ? resultText.substring(0, 30) + '...' : resultText}`,
            duration: 3000,
          });
          
          // 拍照识别成功后停止扫描
          stopScanning();
        })
        .catch(err => {
          console.log('❌ 拍照识别失败:', err.message);
          
          toast.error('拍照识别失败', {
            description: '尝试了多种识别策略仍未找到条形码，请确保条形码清晰完整并重新拍照',
            duration: 5000,
          });
        });
    } catch (err) {
      console.warn('⚠️ 拍照条形码识别初始化错误:', err);
      toast.error('识别功能异常', {
        description: '请重试或刷新页面',
        duration: 3000,
      });
    }
  }, [isScanning, stopScanning, decodeFromCanvas]);

  /**
   * 从文件上传识别条形码
   */
  const scanFromFile = useCallback((file) => {
    if (!file) {
      toast.error('请选择图片文件', {
        duration: 3000,
      });
      return;
    }

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('文件格式错误', {
        description: '请选择图片文件（JPG、PNG等）',
        duration: 3000,
      });
      return;
    }

    console.log('📁 开始从文件识别条形码...', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        console.log('🖼️ 图片加载完成:', {
          width: img.width,
          height: img.height
        });
        
        // 创建临时画布
        const tempCanvas = document.createElement('canvas');
        const tempContext = tempCanvas.getContext('2d');
        
        // 设置画布尺寸
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        
        // 绘制图片到画布
        tempContext.drawImage(img, 0, 0);
        
        // 获取图像数据
        const imageData = tempContext.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        
        // 使用新的解码方法识别条形码 - 增强版
        try {
          console.log('🔍 开始增强识别上传图片中的条形码...');
          
          // 增强识别策略 (文件版本)
           const enhancedFileDecode = async () => {
            const attempts = [];
            
            // 策略1: 原始图像识别
            attempts.push(
              (async () => {
                console.log('🔍 策略1: 原始图像识别...');
                try {
                  return await decodeFromCanvas(tempCanvas);
                } catch (error) {
                  console.log('❌ 原始图像识别失败:', error.message);
                  throw error;
                }
              })()
            );
            
            // 策略2: 预处理后识别
            attempts.push(
              (async () => {
                console.log('🔍 策略2: 预处理图像识别...');
                try {
                  const processedCanvas = document.createElement('canvas');
                  const processedContext = processedCanvas.getContext('2d');
                  processedCanvas.width = tempCanvas.width;
                  processedCanvas.height = tempCanvas.height;
                  processedContext.drawImage(tempCanvas, 0, 0);
                  
                  // 应用图像预处理
                  preprocessImage(processedCanvas, processedContext);
                  
                  return await decodeFromCanvas(processedCanvas);
                } catch (error) {
                  console.log('❌ 预处理图像识别失败:', error.message);
                  throw error;
                }
              })()
            );
            
            // 策略3: 多尺度识别
            const scales = [0.5, 0.75, 1.25, 1.5, 2.0];
            scales.forEach(scale => {
              attempts.push(
                (async () => {
                  console.log(`🔍 策略3: ${scale}x 尺度识别...`);
                  try {
                    const scaledCanvas = createScaledCanvas(tempCanvas, scale);
                    return await decodeFromCanvas(scaledCanvas);
                  } catch (error) {
                    console.log(`❌ ${scale}x 尺度识别失败:`, error.message);
                    throw error;
                  }
                })()
              );
            });
            
            // 策略4: 旋转角度识别
            const rotations = [90, 180, 270];
            rotations.forEach(angle => {
              attempts.push(
                (async () => {
                  console.log(`🔍 策略4: ${angle}° 旋转识别...`);
                  try {
                    const rotatedCanvas = document.createElement('canvas');
                    const rotatedContext = rotatedCanvas.getContext('2d');
                    
                    if (angle === 90 || angle === 270) {
                      rotatedCanvas.width = tempCanvas.height;
                      rotatedCanvas.height = tempCanvas.width;
                    } else {
                      rotatedCanvas.width = tempCanvas.width;
                      rotatedCanvas.height = tempCanvas.height;
                    }
                    
                    rotatedContext.translate(rotatedCanvas.width / 2, rotatedCanvas.height / 2);
                    rotatedContext.rotate((angle * Math.PI) / 180);
                    rotatedContext.drawImage(tempCanvas, -tempCanvas.width / 2, -tempCanvas.height / 2);
                    
                    return await decodeFromCanvas(rotatedCanvas);
                  } catch (error) {
                    console.log(`❌ ${angle}° 旋转识别失败:`, error.message);
                    throw error;
                  }
                })()
              );
            });
            
            // 策略5: 组合策略 (预处理 + 缩放)
            const combinedScales = [0.75, 1.25, 1.5];
            combinedScales.forEach(scale => {
              attempts.push(
                (async () => {
                  console.log(`🔍 策略5: 预处理+${scale}x缩放识别...`);
                  try {
                    const processedCanvas = document.createElement('canvas');
                    const processedContext = processedCanvas.getContext('2d');
                    processedCanvas.width = tempCanvas.width;
                    processedCanvas.height = tempCanvas.height;
                    processedContext.drawImage(tempCanvas, 0, 0);
                    
                    // 应用图像预处理
                    preprocessImage(processedCanvas, processedContext);
                    
                    // 再进行缩放
                    const scaledCanvas = createScaledCanvas(processedCanvas, scale);
                    
                    return await decodeFromCanvas(scaledCanvas);
                  } catch (error) {
                    console.log(`❌ 预处理+${scale}x缩放识别失败:`, error.message);
                    throw error;
                  }
                })()
              );
            });
            
            // 并行执行所有识别策略，返回第一个成功的结果
            try {
              const resultText = await Promise.any(attempts);
              return resultText;
            } catch (aggregateError) {
              // 所有策略都失败了
              console.log('❌ 所有文件识别策略都失败了');
              throw new Error('所有识别策略都失败');
            }
          };
          
          // 执行增强识别
           enhancedFileDecode()
            .then(resultText => {
              console.log('🎉 文件条形码识别成功!', {
                text: resultText
              });
              
              const scanResult = {
                data: resultText,
                timestamp: Date.now(),
                type: 'BARCODE', // 通用类型
                method: 'file' // 标记为文件识别
              };
              
              setScanResult(scanResult);
              
              // 显示扫描成功的 toast
              toast.success('文件识别成功！', {
                description: `内容: ${resultText.length > 30 ? resultText.substring(0, 30) + '...' : resultText}`,
                duration: 3000,
              });
            })
            .catch(err => {
              console.log('❌ 文件识别失败:', err.message);
              
              toast.error('文件识别失败', {
                description: '尝试了多种识别策略仍未找到条形码，请确保图片中包含清晰完整的条形码',
                duration: 5000,
              });
            });
        } catch (err) {
          console.warn('⚠️ 文件条形码识别初始化错误:', err);
          toast.error('识别功能异常', {
            description: '请重试或刷新页面',
            duration: 3000,
          });
        }
      };
      
      img.onerror = () => {
        console.error('❌ 图片加载失败');
        toast.error('图片加载失败', {
          description: '请检查图片文件是否损坏',
          duration: 3000,
        });
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = () => {
      console.error('❌ 文件读取失败');
      toast.error('文件读取失败', {
        description: '请重新选择文件',
        duration: 3000,
      });
    };
    
    reader.readAsDataURL(file);
  }, [decodeFromCanvas]);

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
    resetScan,
    captureAndScan,
    scanFromFile
  };
}