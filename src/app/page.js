"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
import { toast, Toaster } from "sonner";

/**
 * 条形码/二维码扫描页面组件
 * 使用ZXing库实现高精度摄像头扫描功能
 */
export default function ScannerPage() {
  // 状态管理
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState("");
  const [scanCount, setScanCount] = useState(0);
  const [lastScanTime, setLastScanTime] = useState(0);
  // 移除isEditing状态，始终保持可编辑
  const [editableResult, setEditableResult] = useState("");
  const [productInfo, setProductInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);


  // 库存调整相关状态
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockAdjustment, setStockAdjustment] = useState({
    type: "add",
    quantity: "",
    reason: "",
    adjustAvailableStock: true,
    onlyAvailableStock: false,
  });
  const [isAdjustingStock, setIsAdjustingStock] = useState(false);

  // 订单相关状态
  const [orderItems, setOrderItems] = useState([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [discountAmount, setDiscountAmount] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false); // 结算loading状态
  
  // 视频预览模态框状态
  const [showVideoModal, setShowVideoModal] = useState(false);

  // DOM引用
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const scanFrameRef = useRef(null);

  /**
   * 组件初始化
   * 创建高精度代码读取器并配置优化参数
   */
  useEffect(() => {
    console.log("🚀 Initializing high-precision scanner component...");

    // 创建ZXing代码读取器实例，配置优化参数
    const hints = new Map();
    // 启用所有支持的格式以提高识别率
    hints.set("POSSIBLE_FORMATS", [
      "QR_CODE",
      "DATA_MATRIX",
      "UPC_E",
      "UPC_A",
      "EAN_8",
      "EAN_13",
      "CODE_128",
      "CODE_39",
      "CODE_93",
      "CODABAR",
      "ITF",
      "RSS_14",
      "RSS_EXPANDED",
      "PDF_417",
      "AZTEC",
      "MAXICODE",
    ]);
    // 尝试更难的模式以提高精确度
    hints.set("TRY_HARDER", true);
    // 纯条形码模式，减少误识别
    hints.set("PURE_BARCODE", false);

    codeReaderRef.current = new BrowserMultiFormatReader(hints);
    console.log(
      "📖 High-precision ZXing code reader created with optimized hints"
    );

    // 组件卸载时清理资源
    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, []);

  /**
   * 从localStorage加载订单数据
   */
  useEffect(() => {
    const savedOrder = localStorage.getItem('scannerOrder');
    if (savedOrder) {
      try {
        const orderData = JSON.parse(savedOrder);
        setOrderItems(orderData.items || []);
        setOrderTotal(orderData.total || 0);
        setDiscountAmount(orderData.discountAmount || '');
      } catch (error) {
        console.error('加载订单数据失败:', error);
      }
    }
  }, []);

  /**
   * 保存订单数据到localStorage
   */
  const saveOrderToStorage = (items, total, discount = discountAmount) => {
    try {
      const orderData = {
        items,
        total,
        discountAmount: discount,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('scannerOrder', JSON.stringify(orderData));
    } catch (error) {
      console.error('保存订单数据失败:', error);
    }
  };

  /**
   * 计算订单总价
   */
  const calculateOrderTotal = (items) => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  /**
   * 添加商品到订单
   */
  const addToOrder = () => {
    if (!productInfo) {
      toast.error('请先扫描商品');
      return;
    }

    const availableStock = productInfo.available_stock || 0;
    const existingItemIndex = orderItems.findIndex(item => item.barcode === productInfo.barcode);
    let newItems;

    if (existingItemIndex >= 0) {
      // 如果商品已存在，检查是否超过可用库存
      const currentQuantity = orderItems[existingItemIndex].quantity;
      if (currentQuantity >= availableStock) {
        toast.error(`库存不足，当前可用库存：${availableStock}`);
        return;
      }
      newItems = [...orderItems];
      newItems[existingItemIndex].quantity += 1;
      // 更新可用库存信息（以防库存发生变化）
      newItems[existingItemIndex].availableStock = availableStock;
    } else {
      // 如果商品不存在，检查库存是否足够
      if (availableStock < 1) {
        toast.error(`库存不足，当前可用库存：${availableStock}`);
        return;
      }
      const newItem = {
        barcode: productInfo.barcode,
        name: productInfo.name,
        price: parseFloat(productInfo.price),
        quantity: 1,
        availableStock: availableStock
      };
      newItems = [...orderItems, newItem];
    }

    const newTotal = calculateOrderTotal(newItems);
    setOrderItems(newItems);
    setOrderTotal(newTotal);
    saveOrderToStorage(newItems, newTotal);
    
    toast.success('商品已加入订单');
  };

  /**
   * 从订单中移除商品
   */
  const removeFromOrder = (barcode) => {
    const newItems = orderItems.filter(item => item.barcode !== barcode);
    const newTotal = calculateOrderTotal(newItems);
    setOrderItems(newItems);
    setOrderTotal(newTotal);
    saveOrderToStorage(newItems, newTotal);
    toast.success('商品已从订单中移除');
  };

  /**
   * 更新订单商品数量
   */
  const updateOrderItemQuantity = (barcode, newQuantity) => {

    // 查找订单项并检查库存限制
    const orderItem = orderItems.find(item => item.barcode === barcode);
    if (orderItem) {
      const availableStock = orderItem.availableStock || 0;
      if (newQuantity > availableStock) {
        toast.error(`库存不足，当前可用库存：${availableStock}`);
        return;
      }
    }

    const newItems = orderItems.map(item => 
      item.barcode === barcode ? { ...item, quantity: newQuantity } : item
    );
    const newTotal = calculateOrderTotal(newItems);
    setOrderItems(newItems);
    setOrderTotal(newTotal);
    saveOrderToStorage(newItems, newTotal);
  };

  /**
   * 更新优惠金额
   */
  const updateDiscountAmount = (amount) => {
     const discount = amount === '' ? '' : Math.max(0, parseFloat(amount) || 0);
     setDiscountAmount(discount);
     saveOrderToStorage(orderItems, orderTotal, discount);
   };

  /**
   * 清空订单
   */
  const clearOrder = () => {
    setOrderItems([]);
    setOrderTotal(0);
    setDiscountAmount('');
    localStorage.removeItem('scannerOrder');
    toast.success('订单已清空');
  };

  /**
   * 重置页面状态（结算后使用）
   */
  const resetPageState = () => {
    // 重置订单相关状态
    setOrderItems([]);
    setOrderTotal(0);
    setDiscountAmount('');
    setIsCheckingOut(false); // 重置结算loading状态
    localStorage.removeItem('scannerOrder');
    
    // 重置扫描相关状态
    setResult('');
    setEditableResult('');
    setProductInfo(null);
    setScanCount(0);
    setLastScanTime(0);
    
    // 重置库存调整状态
    setShowStockModal(false);
    setStockAdjustment({
      type: 'add',
      quantity: '',
      reason: '',
      adjustAvailableStock: true,
      onlyAvailableStock: false,
    });
    setIsAdjustingStock(false);
  };

  /**
   * 处理订单结算
   */
  const handleCheckout = async () => {
    if (orderItems.length === 0) {
      toast.error('订单为空，无法结算');
      return;
    }

    // 防止重复提交
    if (isCheckingOut) {
      return;
    }

    setIsCheckingOut(true); // 开始结算loading

    try {
      const totalAmount = orderTotal;
      const discount = parseFloat(discountAmount) || 0;
      const finalAmount = Math.max(0, totalAmount - discount);

      const orderData = {
        items: orderItems,
        totalAmount,
        discountAmount: discount,
        finalAmount
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`订单结算成功！订单号：${result.order.orderNumber}`);
        // 重置页面状态
        resetPageState();
      } else {
        toast.error(result.error || '订单结算失败');
      }
    } catch (error) {
      console.error('订单结算失败:', error);
      toast.error('订单结算失败，请重试');
    } finally {
      setIsCheckingOut(false); // 结束结算loading
    }
  };

  /**
   * 打开视频预览模态框并自动开始扫描
   */
  const handleOpenVideoModal = () => {
    setShowVideoModal(true);
    // 等待模态框完全打开后自动开始扫描
    setTimeout(() => {
      handleStartScan();
    }, 100);
  };

  /**
   * 关闭视频预览模态框并停止扫描
   */
  const handleCloseVideoModal = () => {
    // 如果正在扫描，先停止扫描
    if (isScanning) {
      handleStopScan();
    }
    setShowVideoModal(false);
  };

  /**
   * 开始高精度扫描功能
   * 使用优化的摄像头配置开始连续扫描
   */
  const handleStartScan = async () => {
    console.log("🎯 Starting high-precision scan process...");

    if (!videoRef.current) {
      console.error("❌ Cannot start scan: missing video element");
      return;
    }

    console.log("🎥 Video element:", videoRef.current);
    
    setIsScanning(true);
    setResult("");
    setScanCount(0);
    setLastScanTime(Date.now());

    try {
      // 配置高分辨率视频约束以提高扫描精确度
      const constraints = {
        video: {
          facingMode: "environment", // 优先使用后置摄像头
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
          frameRate: { ideal: 30, min: 15 },
          focusMode: "continuous",
          exposureMode: "continuous",
          whiteBalanceMode: "continuous",
        },
      };

      console.log(
        "📷 Requesting high-resolution camera with constraints:",
        constraints
      );

      // 开始扫描，使用优化的回调函数
      await codeReaderRef.current.decodeFromConstraints(
        constraints,
        videoRef.current,
        (result, err) => {
          const currentTime = Date.now();
          setScanCount((prev) => prev + 1);

          if (result) {
            const scanDuration = currentTime - lastScanTime;
            console.log("🎉 Scan result found:", result);
            console.log("📝 Result text:", result.text);
            console.log("⏱️ Scan duration:", scanDuration + "ms");
            console.log("🔢 Total scan attempts:", scanCount + 1);

            setResult(result.text);
            setEditableResult(result.text);

            // 扫描成功后自动停止扫描
            handleStopScan();

            // 扫描成功后关闭模态框
            setShowVideoModal(false);

            // 自动查询商品信息但不记录历史
            queryProductInfoWithoutHistory(result.text);
          }

          if (err && !(err instanceof NotFoundException)) {
            console.error("❌ Scan error:", err);
            // 只在严重错误时显示错误信息
            if (err.name !== "NotFoundError") {
              setResult(`扫描错误: ${err.message}`);
            }
          }
        }
      );

      console.log(
        "✅ Started high-precision continuous decode with optimized constraints"
      );
    } catch (error) {
      console.error("❌ Failed to start scanning:", error);
      setResult(`启动扫描失败: ${error.message}`);
      setIsScanning(false);
    }
  };

  /**
   * 查询商品信息（不记录历史）
   * 根据扫描到的条形码查询数据库中的商品信息，但不记录历史
   */
  const queryProductInfo = async () => {
    if (!result) {
      toast.error("请先扫描商品条形码");
      return;
    }

    setIsLoading(true);
    try {
      console.log("🔍 Querying product info for barcode:", result);

      const response = await fetch(
        `/api/products/barcode/${encodeURIComponent(result)}`
      );
      const data = await response.json();

      if (data.success) {
        if (data.found) {
          console.log("✅ Product found:", data.data);
          setProductInfo(data.data);
          
        } else {
          console.log("ℹ️ Product not found");
          setProductInfo(null);
  
          toast.warning("未找到该商品信息");
        }
      } else {
        console.error("❌ Query failed:", data);
        setProductInfo(null);

        toast.error("查询失败：" + (data.error || data.message || "未知错误"));
      }
    } catch (error) {
      console.error("❌ Failed to query product:", error);
      setProductInfo(null);
      toast.error("查询失败：网络错误");
    } finally {
      setIsLoading(false);
    }
  };



  /**
   * 查询商品信息（内部使用，不记录历史）
   * 扫描成功后自动调用的查询函数
   */
  const queryProductInfoWithoutHistory = async (barcode) => {
    setIsLoading(true);
    try {
      console.log("🔍 Auto querying product info for barcode:", barcode);

      const response = await fetch(
        `/api/products/barcode/${encodeURIComponent(barcode)}`
      );
      const data = await response.json();

      if (data.success) {
        if (data.found) {
          console.log("✅ Product found:", data.data);
          setProductInfo(data.data);

        } else {
          console.log("ℹ️ Product not found");
          setProductInfo(null);

        }
      } else {
        console.error("❌ Query failed:", data);
        setProductInfo(null);
      }
    } catch (error) {
      console.error("❌ Failed to query product:", error);
      setProductInfo(null);
    } finally {
      setIsLoading(false);
    }
  };



  /**
   * 处理编辑内容变化
   * 直接更新result和editableResult，保持同步
   */
  const handleEditChange = (e) => {
    const newValue = e.target.value;
    setEditableResult(newValue);
    setResult(newValue);
  };

  /**
   * 停止扫描
   * 只停止扫描，不清除已有的结果和商品信息
   */
  const handleStopScan = () => {
    console.log("⏹️ Stopping scanner...");

    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      console.log("✅ Scanner stopped");
    }
    setIsScanning(false);
  };

  /**
   * 重置扫描器
   * 停止扫描并清除所有状态
   */
  const handleReset = () => {
    console.log("🔄 Resetting scanner...");

    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      console.log("✅ Scanner reset completed");
    }
    setIsScanning(false);
    setResult("");
    setScanCount(0);
    setLastScanTime(0);
    setEditableResult("");
    setProductInfo(null);
    setIsLoading(false);
    console.log("🧹 All states cleared");
  };

  /**
   * 显示库存调整模态框
   */
  const showStockAdjustment = () => {
    if (!productInfo) {
      toast.error("请先查询商品信息");
      return;
    }
    setStockAdjustment({
      type: "add",
      quantity: "",
      reason: "",
      adjustAvailableStock: true,
    });
    setShowStockModal(true);
  };

  /**
   * 关闭库存调整模态框
   */
  const closeStockModal = () => {
    setShowStockModal(false);
    setStockAdjustment({
      type: "add",
      quantity: "",
      reason: "",
      adjustAvailableStock: true,
      onlyAvailableStock: false,
    });
  };

  /**
   * 处理库存调整
   */
  const handleStockAdjustment = async () => {
    if (!productInfo || !stockAdjustment.quantity) {
      toast.error("请输入调整数量");
      return;
    }

    const quantity = parseInt(stockAdjustment.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error("请输入有效的数量");
      return;
    }

    // 如果是减少库存，检查是否会导致负库存
    if (stockAdjustment.type === "subtract" && quantity > productInfo.stock) {
      toast.error("减少数量不能超过当前库存");
      return;
    }

    // 如果是设置库存，检查数量是否合理
    if (stockAdjustment.type === "set" && quantity < 0) {
      toast.error("库存数量不能为负数");
      return;
    }

    setIsAdjustingStock(true);

    try {
      const response = await fetch(`/api/products/${productInfo.id}/stock`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: stockAdjustment.type,
          quantity: parseInt(stockAdjustment.quantity),
          reason: stockAdjustment.reason || "扫描页面调整",
          adjustAvailableStock: stockAdjustment.adjustAvailableStock,
          onlyAvailableStock: stockAdjustment.onlyAvailableStock,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("库存调整成功");
        // 刷新商品信息
        await queryProductInfo();
        closeStockModal();
      } else {
        toast.error("库存调整失败：" + (data.error || "未知错误"));
      }
    } catch (error) {
      console.error("库存调整失败:", error);
      toast.error("库存调整失败：网络错误");
    } finally {
      setIsAdjustingStock(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-2">
      <div className="max-w-4xl mx-auto px-2">
        {/* 页面标题 */}
        <div className="text-center mb-4">
          {/* <h6 className="text-xl font-bold text-gray-900 mb-4">
            高精度条形码/二维码扫描器
          </h6>
          <p className="text-gray-600 max-w-2xl mx-auto mb-4">
            使用优化的ZXing JavaScript库从高分辨率摄像头扫描任何支持的1D/2D码。
          </p> */}


        </div>
      

        {/* 扫描结果显示 */}
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              扫描结果:
            </label>
            <span
              onClick={isLoading ? undefined : queryProductInfo}
              className={`text-sm font-medium transition-colors cursor-pointer ${
                isLoading 
                  ? "text-gray-400 cursor-not-allowed" 
                  : "text-blue-600 hover:text-blue-800"
              }`}
            >
              {isLoading ? "查询中..." : "🔍 重新查询"}
            </span>
          </div>

          {/* 始终显示编辑模式 */}
          <div className="space-y-3">
            <textarea
              value={editableResult}
              rows={1}
              onChange={handleEditChange}
              className="w-full bg-white border border-gray-300 rounded-lg p-4 min-h-[100px] text-sm text-gray-900 font-mono resize-vertical focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="扫描结果将显示在这里，您可以直接编辑..."
            />
            
            {/* 重新查询按钮 - 放在扫描结果下方 */}
            {result && (
              <div className="flex justify-center">
                
              </div>
            )}
          </div>
        </div>
  {/* 控制按钮 */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={handleOpenVideoModal}
            disabled={isScanning}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            {isScanning ? "扫描中..." : "开始扫描"}
          </button>
          {isScanning && (
            <button
              onClick={handleStopScan}
              className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              停止扫描
            </button>
          )}
          <button
            onClick={handleReset}
            className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            重置
          </button>
          {/* <Link href="/init-db">
            <button className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-6 rounded-lg transition-colors">
              初始化数据库
            </button>
          </Link> */}
        </div>
        {/* 商品信息显示 */}
        {result && (
          <div className="max-w-2xl mx-auto mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              商品信息:
            </label>

            {isLoading ? (
              <div className="bg-white border border-gray-300 rounded-lg p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-gray-600 text-sm">正在查询商品信息...</p>
              </div>
            ) : productInfo ? (
              <div className="bg-white border border-green-300 rounded-lg p-4 border-l-4 border-l-green-500">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {productInfo.name}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-gray-600">条形码:</span>
                    <p className="font-mono text-gray-900">
                      {productInfo.barcode}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">价格:</span>
                    <p className="font-semibold text-green-600">
                      ¥{productInfo.price}
                    </p>
                  </div>
                  {productInfo.stock !== null && (
                    <div>
                      <span className="text-gray-600">总库存:</span>
                      <p
                        className={`font-semibold ${
                          productInfo.stock > 0
                            ? "text-gray-900"
                            : "text-red-600"
                        }`}
                      >
                        {productInfo.stock}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">可用库存:</span>
                    <p
                      className={`font-semibold ${
                        (productInfo.available_stock || 0) > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {productInfo.available_stock || 0}
                    </p>
                  </div>
                  {productInfo.expiry_date && (
                    <div>
                      <span className="text-gray-600">有效期:</span>
                      <p className="text-gray-900">{productInfo.expiry_date}</p>
                    </div>
                  )}
                </div>

                {/* 操作按钮 */}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={showStockAdjustment}
                    className="px-4 py-2 rounded-lg font-medium text-sm transition-colors bg-green-500 hover:bg-green-600 text-white"
                  >
                    📊 调整库存
                  </button>
                  <button
                    onClick={addToOrder}
                    className="px-4 py-2 rounded-lg font-medium text-sm transition-colors bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    🛒 加入订单
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-300 rounded-lg p-4 text-center">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    扫描成功
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    条形码: <span className="font-mono">{result}</span>
                  </p>
                  <p className="text-gray-500 text-sm">
                    点击查询按钮获取商品信息
                  </p>
                </div>

                {/* 提示信息 */}
                <p className="text-gray-500 text-sm">
                  使用上方的重新查询按钮获取商品信息
                </p>
              </div>
            )}
          </div>
        )}



        {/* 订单信息展示 */}
        {orderItems.length > 0 && (
          <div className="max-w-2xl mx-auto mt-6">
            <div className="bg-white border border-blue-300 rounded-lg p-4 border-l-4 border-l-blue-500">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  🛒 订单商品 ({orderItems.length}件)
                </h3>
                <button
                  onClick={clearOrder}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  清空订单
                </button>
              </div>

              {/* 订单商品列表 */}
              <div className="space-y-3 mb-4">
                {orderItems.map((item, index) => {
                  // 使用订单项中保存的库存信息
                  const availableStock = item.availableStock || 0;
                  
                  return (
                    <div key={item.barcode} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-600 font-mono">{item.barcode}</p>
                        <p className="text-sm text-green-600 font-semibold">¥{item.price.toFixed(2)}</p>
                        <p className="text-xs text-blue-600">
                          可用库存: {availableStock}
                          {item.quantity > availableStock && (
                            <span className="text-red-600 ml-1">(超出库存)</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateOrderItemQuantity(item.barcode, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            item.quantity <= 1
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                          }`}
                        >
                          -
                        </button>
                        <span className={`w-12 text-center font-semibold ${
                          item.quantity > availableStock 
                            ? 'text-red-600' 
                            : 'text-gray-900'
                        }`}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateOrderItemQuantity(item.barcode, item.quantity + 1)}
                          disabled={item.quantity >= availableStock}
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            item.quantity >= availableStock
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                          }`}
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromOrder(item.barcode)}
                          className="ml-2 text-red-600 hover:text-red-800 text-sm"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 订单总计 */}
              <div className="border-t pt-4">
                <div className="space-y-3">
                  {/* 商品小计 */}
                  <div className="flex justify-between items-center">
                    <span className="text-base text-gray-700">商品小计:</span>
                    <span className="text-base text-gray-900">¥{orderTotal.toFixed(2)}</span>
                  </div>
                  
                  {/* 优惠金额 */}
                  <div className="flex justify-between items-center">
                    <span className="text-base text-gray-700">优惠金额:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">¥</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={discountAmount}
                        onChange={(e) => updateDiscountAmount(e.target.value)}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right text-gray-900 placeholder-gray-400"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  {/* 最终总计 */}
                  <div className="flex justify-between items-center border-t pt-3">
                    <span className="text-lg font-semibold text-gray-900">应付总额:</span>
                    <span className="text-xl font-bold text-green-600">
                      ¥{Math.max(0, orderTotal - (parseFloat(discountAmount) || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                    className={`px-6 py-2 text-white font-medium rounded-lg transition-colors flex items-center gap-2 ${
                      isCheckingOut 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                  >
                    {isCheckingOut ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        结算中...
                      </>
                    ) : (
                      <>
                        💳 结算订单
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 返回首页链接 */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            ← 返回首页
          </Link>
        </div>

        {/* 库存调整模态框 */}
        {showStockModal && productInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    调整库存 - {productInfo.name}
                  </h3>
                  <button
                    onClick={closeStockModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  {/* 当前库存信息 */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-base">
                      <div>
                        <span className="text-gray-700 font-medium">
                          当前总库存:
                        </span>
                        <p className="font-bold text-lg text-gray-900">
                          {productInfo.stock}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-700 font-medium">
                          当前可用库存:
                        </span>
                        <p className="font-bold text-lg text-gray-900">
                          {productInfo.available_stock || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 调整类型 */}
                  <div>
                    <label className="block text-base font-semibold text-gray-800 mb-3">
                      调整类型
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setStockAdjustment({
                            ...stockAdjustment,
                            type: "add",
                          })
                        }
                        className={`px-4 py-3 text-base font-medium rounded-lg border transition-colors ${
                          stockAdjustment.type === "add"
                            ? "bg-green-500 text-white border-green-500 shadow-md"
                            : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                        }`}
                      >
                        增加
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setStockAdjustment({
                            ...stockAdjustment,
                            type: "subtract",
                          })
                        }
                        className={`px-4 py-3 text-base font-medium rounded-lg border transition-colors ${
                          stockAdjustment.type === "subtract"
                            ? "bg-red-500 text-white border-red-500 shadow-md"
                            : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                        }`}
                      >
                        减少
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setStockAdjustment({
                            ...stockAdjustment,
                            type: "set",
                          })
                        }
                        className={`px-4 py-3 text-base font-medium rounded-lg border transition-colors ${
                          stockAdjustment.type === "set"
                            ? "bg-blue-500 text-white border-blue-500 shadow-md"
                            : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                        }`}
                      >
                        设置
                      </button>
                    </div>
                  </div>

                  {/* 调整数量 */}
                  <div>
                    <label className="block text-base font-semibold text-gray-800 mb-3">
                      {stockAdjustment.type === "set" ? "设置为" : "调整数量"}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={stockAdjustment.quantity}
                      onChange={(e) =>
                        setStockAdjustment({
                          ...stockAdjustment,
                          quantity: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-500"
                      placeholder="请输入数量"
                    />
                  </div>

                  {/* 调整原因 */}
                  <div>
                    <label className="block text-base font-semibold text-gray-800 mb-3">
                      调整原因
                    </label>
                    <input
                      type="text"
                      value={stockAdjustment.reason}
                      onChange={(e) =>
                        setStockAdjustment({
                          ...stockAdjustment,
                          reason: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-500"
                      placeholder="请输入调整原因（可选）"
                    />
                  </div>

                  {/* 库存调整选项 */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-base font-semibold text-gray-800 mb-3">
                        调整选项
                      </label>
                      <div className="space-y-3">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="stockOption"
                            checked={
                              !stockAdjustment.onlyAvailableStock &&
                              stockAdjustment.adjustAvailableStock
                            }
                            onChange={() =>
                              setStockAdjustment({
                                ...stockAdjustment,
                                onlyAvailableStock: false,
                                adjustAvailableStock: true,
                              })
                            }
                            className="mr-3 w-4 h-4 text-blue-600"
                          />
                          <span className="text-base text-gray-800">
                            同时调整总库存和可用库存
                          </span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="stockOption"
                            checked={
                              !stockAdjustment.onlyAvailableStock &&
                              !stockAdjustment.adjustAvailableStock
                            }
                            onChange={() =>
                              setStockAdjustment({
                                ...stockAdjustment,
                                onlyAvailableStock: false,
                                adjustAvailableStock: false,
                              })
                            }
                            className="mr-3 w-4 h-4 text-blue-600"
                          />
                          <span className="text-base text-gray-800">
                            仅调整总库存
                          </span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="stockOption"
                            checked={stockAdjustment.onlyAvailableStock}
                            onChange={() =>
                              setStockAdjustment({
                                ...stockAdjustment,
                                onlyAvailableStock: true,
                                adjustAvailableStock: false,
                              })
                            }
                            className="mr-3 w-4 h-4 text-blue-600"
                          />
                          <span className="text-base text-gray-800">
                            仅调整可用库存
                          </span>
                        </label>
                      </div>
                      <p className="text-sm text-gray-600 mt-3 font-medium">
                        {stockAdjustment.onlyAvailableStock
                          ? "仅调整可用库存，总库存保持不变"
                          : stockAdjustment.adjustAvailableStock
                          ? "同时调整总库存和可用库存"
                          : "仅调整总库存，可用库存保持不变"}
                      </p>
                    </div>
                  </div>

                  {/* 调整结果预览 */}
                  {stockAdjustment.quantity && (
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <h4 className="text-base font-semibold text-gray-800 mb-3">
                        调整结果预览
                      </h4>
                      <div className="space-y-2 text-base">
                        {stockAdjustment.onlyAvailableStock ? (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-700 font-medium">
                                总库存：
                              </span>
                              <span className="text-gray-800 font-semibold">
                                {productInfo.stock} (保持不变)
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-700 font-medium">
                                可用库存：
                              </span>
                              <span className="text-blue-600 font-semibold">
                                {productInfo.available_stock} →{" "}
                                {(() => {
                                  const quantity =
                                    parseInt(stockAdjustment.quantity) || 0;
                                  if (stockAdjustment.type === "add") {
                                    return (
                                      (productInfo.available_stock || 0) +
                                      quantity
                                    );
                                  } else if (
                                    stockAdjustment.type === "subtract"
                                  ) {
                                    return Math.max(
                                      0,
                                      (productInfo.available_stock || 0) -
                                        quantity
                                    );
                                  } else if (stockAdjustment.type === "set") {
                                    return Math.min(
                                      quantity,
                                      productInfo.stock
                                    );
                                  }
                                  return productInfo.available_stock;
                                })()}
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-700 font-medium">
                                总库存：
                              </span>
                              <span className="text-blue-600 font-semibold">
                                {productInfo.stock} →{" "}
                                {(() => {
                                  const quantity =
                                    parseInt(stockAdjustment.quantity) || 0;
                                  if (stockAdjustment.type === "add") {
                                    return productInfo.stock + quantity;
                                  } else if (
                                    stockAdjustment.type === "subtract"
                                  ) {
                                    return Math.max(
                                      0,
                                      productInfo.stock - quantity
                                    );
                                  } else if (stockAdjustment.type === "set") {
                                    return quantity;
                                  }
                                  return productInfo.stock;
                                })()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-700 font-medium">
                                可用库存：
                              </span>
                              <span
                                className={`font-semibold ${
                                  stockAdjustment.adjustAvailableStock
                                    ? "text-blue-600"
                                    : "text-gray-800"
                                }`}
                              >
                                {stockAdjustment.adjustAvailableStock ? (
                                  <>
                                    {productInfo.available_stock} →{" "}
                                    {(() => {
                                      const quantity =
                                        parseInt(stockAdjustment.quantity) || 0;
                                      if (stockAdjustment.type === "add") {
                                        return (
                                          (productInfo.available_stock || 0) +
                                          quantity
                                        );
                                      } else if (
                                        stockAdjustment.type === "subtract"
                                      ) {
                                        return Math.max(
                                          0,
                                          (productInfo.available_stock || 0) -
                                            quantity
                                        );
                                      } else if (
                                        stockAdjustment.type === "set"
                                      ) {
                                        return Math.min(quantity, quantity);
                                      }
                                      return productInfo.available_stock;
                                    })()}
                                  </>
                                ) : (
                                  `${productInfo.available_stock} (保持不变)`
                                )}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                      {stockAdjustment.onlyAvailableStock && (
                        <p className="text-sm text-orange-600 mt-3 font-medium">
                          ⚠️ 请确保调整后的可用库存不超过总库存(
                          {productInfo.stock})
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* 操作按钮 */}
                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <button
                    type="button"
                    onClick={closeStockModal}
                    className="px-6 py-3 text-base font-medium text-gray-800 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={handleStockAdjustment}
                    disabled={!stockAdjustment.quantity || isAdjustingStock}
                    className="px-6 py-3 text-base font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                  >
                    {isAdjustingStock ? "调整中..." : "确认调整"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 视频预览模态框 */}
        {showVideoModal && (
          <div 
            className="fixed inset-0 bg-black flex items-center justify-center z-50"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
            onClick={handleCloseVideoModal}
          >
            <div 
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                {/* 模态框标题 */}
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">摄像头预览</h3>
                  <button
                    onClick={handleCloseVideoModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* 视频预览区域 */}
                <div className="flex justify-center mb-4">
                  <div className="bg-gray-50 rounded-lg p-4 relative w-full max-w-lg">
                    <video
                      ref={videoRef}
                      className="border border-gray-300 rounded w-full"
                      style={{
                        objectFit: "cover",
                        aspectRatio: "4/3",
                        maxWidth: "100%",
                        height: "auto",
                      }}
                    />

                    {/* 扫描统计信息 */}
                    {isScanning && (
                      <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                        扫描次数: {scanCount}
                      </div>
                    )}
                  </div>
                </div>

                {/* 模态框底部按钮 */}
                <div className="flex justify-between items-center">
                  <div className="flex gap-3">
                    <button
                      onClick={handleStartScan}
                      disabled={isScanning}
                      className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      {isScanning ? "扫描中..." : "开始扫描"}
                    </button>
                    {isScanning && (
                      <button
                        onClick={handleStopScan}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        停止扫描
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleCloseVideoModal}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 页脚信息 */}
        <footer className="text-center mt-12 pt-8 border-t border-gray-200">
          <div className="flex justify-center gap-4 mb-4">
            <Link href="/products" className="text-gray-500 hover:text-gray-700 transition-colors">
              商品管理
            </Link>
            <Link href="/orders" className="text-gray-500 hover:text-gray-700 transition-colors">
              订单管理
            </Link>
          </div>
          <p className="text-gray-500 text-sm">
            基于{" "}
            <a
              href="https://github.com/zxing-js/library"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800"
            >
              ZXing JavaScript库
            </a>{" "}
            构建
          </p>
        </footer>
      </div>
      <Toaster position="top-center" richColors />
    </div>
  );
}
