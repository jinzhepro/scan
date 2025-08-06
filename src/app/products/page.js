"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast, Toaster } from "sonner";

/**
 * 商品管理页面
 * 显示所有商品信息、出库统计，并可以查看每个商品的详细出库记录
 */
export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [outboundStats, setOutboundStats] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productOutboundRecords, setProductOutboundRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [showRecordsModal, setShowRecordsModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockAdjustment, setStockAdjustment] = useState({
    type: 'add', // 'add' 或 'subtract' 或 'set'
    quantity: '',
    reason: ''
  });
  const [isAdjustingStock, setIsAdjustingStock] = useState(false);

  /**
   * 获取所有商品信息
   */
  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      const data = await response.json();

      if (data.success) {
        setProducts(data.data);
      } else {
        toast.error("获取商品信息失败：" + (data.error || "未知错误"));
      }
    } catch (error) {
      console.error("获取商品信息失败:", error);
      toast.error("获取商品信息失败：网络错误");
    }
  };

  /**
   * 获取出库统计信息
   */
  const fetchOutboundStats = async () => {
    try {
      const response = await fetch("/api/outbound-records?stats=true&popular=true");
      const data = await response.json();

      if (data.success) {
        // 将热门商品数据转换为以条形码为键的对象
        const statsMap = {};
        if (data.popular) {
          data.popular.forEach(item => {
            statsMap[item.barcode] = {
              outbound_count: item.outbound_count,
              total_quantity: item.total_quantity,
              last_outbound: item.last_outbound
            };
          });
        }
        setOutboundStats(statsMap);
      } else {
        console.error("获取出库统计失败:", data);
      }
    } catch (error) {
      console.error("获取出库统计失败:", error);
    }
  };

  /**
   * 获取指定商品的出库记录
   * @param {string} barcode - 商品条形码
   */
  const fetchProductOutboundRecords = async (barcode) => {
    setIsLoadingRecords(true);
    try {
      const response = await fetch(`/api/outbound-records?barcode=${encodeURIComponent(barcode)}`);
      const data = await response.json();

      if (data.success) {
        setProductOutboundRecords(data.data);
      } else {
        toast.error("获取出库记录失败：" + (data.error || "未知错误"));
        setProductOutboundRecords([]);
      }
    } catch (error) {
      console.error("获取出库记录失败:", error);
      toast.error("获取出库记录失败：网络错误");
      setProductOutboundRecords([]);
    } finally {
      setIsLoadingRecords(false);
    }
  };

  /**
   * 显示商品出库记录
   * @param {Object} product - 商品信息
   */
  const showProductRecords = async (product) => {
    setSelectedProduct(product);
    setShowRecordsModal(true);
    await fetchProductOutboundRecords(product.barcode);
  };

  /**
   * 关闭出库记录模态框
   */
  const closeRecordsModal = () => {
    setShowRecordsModal(false);
    setSelectedProduct(null);
    setProductOutboundRecords([]);
  };

  /**
   * 显示库存调整模态框
   * @param {Object} product - 商品信息
   */
  const showStockAdjustment = (product) => {
    setSelectedProduct(product);
    setStockAdjustment({
      type: 'add',
      quantity: '',
      reason: ''
    });
    setShowStockModal(true);
  };

  /**
   * 关闭库存调整模态框
   */
  const closeStockModal = () => {
    setShowStockModal(false);
    setSelectedProduct(null);
    setStockAdjustment({
      type: 'add',
      quantity: '',
      reason: ''
    });
  };

  /**
   * 处理库存调整
   */
  const handleStockAdjustment = async () => {
    if (!selectedProduct || !stockAdjustment.quantity) {
      toast.error("请输入调整数量");
      return;
    }

    const quantity = parseInt(stockAdjustment.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error("请输入有效的数量");
      return;
    }

    // 如果是减少库存，检查是否会导致负库存
    if (stockAdjustment.type === 'subtract' && quantity > selectedProduct.stock) {
      toast.error("减少数量不能超过当前库存");
      return;
    }

    // 如果是设置库存，检查数量是否合理
    if (stockAdjustment.type === 'set' && quantity < 0) {
      toast.error("库存数量不能为负数");
      return;
    }

    setIsAdjustingStock(true);

    try {
      const response = await fetch(`/api/products/${selectedProduct.id}/stock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: stockAdjustment.type,
          quantity: quantity,
          reason: stockAdjustment.reason || '手动调整'
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("库存调整成功");
        // 刷新商品列表
        await fetchProducts();
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

  /**
   * 页面初始化
   */
  useEffect(() => {
    const initPage = async () => {
      setIsLoading(true);
      await Promise.all([fetchProducts(), fetchOutboundStats()]);
      setIsLoading(false);
    };

    initPage();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载商品信息...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4">
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">商品管理</h1>
          <p className="text-gray-600">查看所有商品信息、库存状态和出库统计</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">📦</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">商品总数</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">有库存商品</p>
                <p className="text-2xl font-bold text-gray-900">
                  {products.filter(p => p.stock > 0).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">缺货商品</p>
                <p className="text-2xl font-bold text-gray-900">
                  {products.filter(p => p.stock === 0).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">有出库记录</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.keys(outboundStats).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 商品列表 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">商品列表</h2>
          </div>

          {products.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">暂无商品数据</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      商品信息
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      条形码
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      价格
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      库存
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      出库统计
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => {
                    const stats = outboundStats[product.barcode];
                    return (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                            {product.expiry_date && (
                              <div className="text-sm text-gray-500">
                                有效期: {product.expiry_date}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-sm text-gray-900">
                            {product.barcode}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            ¥{product.price}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            product.stock > 0 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {stats ? (
                            <div className="text-sm">
                              <div className="text-gray-900">
                                出库 {stats.outbound_count} 次
                              </div>
                              <div className="text-gray-500">
                                总量 {stats.total_quantity}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">无出库记录</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => showProductRecords(product)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            查看出库记录
                          </button>
                          <button
                            onClick={() => showStockAdjustment(product)}
                            className="text-green-600 hover:text-green-900"
                          >
                            调整库存
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 返回首页链接 */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            ← 返回首页
          </Link>
        </div>
      </div>

      {/* 出库记录模态框 */}
      {showRecordsModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* 模态框标题 */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedProduct?.name} - 出库记录
                </h3>
                <button
                  onClick={closeRecordsModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">关闭</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 商品基本信息 */}
              {selectedProduct && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">条形码:</span>
                      <p className="font-mono">{selectedProduct.barcode}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">价格:</span>
                      <p>¥{selectedProduct.price}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">当前库存:</span>
                      <p className={selectedProduct.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                        {selectedProduct.stock}
                      </p>
                    </div>
                    {selectedProduct.expiry_date && (
                      <div>
                        <span className="text-gray-600">有效期:</span>
                        <p>{selectedProduct.expiry_date}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 出库记录列表 */}
              <div className="max-h-96 overflow-y-auto">
                {isLoadingRecords ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p className="text-gray-600">正在加载出库记录...</p>
                  </div>
                ) : productOutboundRecords.length > 0 ? (
                  <div className="space-y-2">
                    {productOutboundRecords.map((record, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-800">
                                出库
                              </span>
                              <span className="text-sm text-red-600 font-medium">
                                数量: {record.quantity || 1}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              <p>条形码: <span className="font-mono">{record.barcode}</span></p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-gray-500">
                              {new Date(record.outbound_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">该商品暂无出库记录</p>
                  </div>
                )}
              </div>

              {/* 模态框底部按钮 */}
              <div className="flex justify-end mt-6">
                <button
                  onClick={closeRecordsModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 库存调整模态框 */}
      {showStockModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* 模态框标题 */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  调整库存 - {selectedProduct?.name}
                </h3>
                <button
                  onClick={closeStockModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">关闭</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 商品基本信息 */}
              {selectedProduct && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">条形码:</span>
                      <p className="font-mono">{selectedProduct.barcode}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">当前库存:</span>
                      <p className={selectedProduct.stock > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        {selectedProduct.stock}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 调整类型选择 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  调整类型
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setStockAdjustment({...stockAdjustment, type: 'add'})}
                    className={`px-3 py-2 text-sm rounded-lg border ${
                      stockAdjustment.type === 'add'
                        ? 'bg-green-100 border-green-300 text-green-800'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    增加库存
                  </button>
                  <button
                    onClick={() => setStockAdjustment({...stockAdjustment, type: 'subtract'})}
                    className={`px-3 py-2 text-sm rounded-lg border ${
                      stockAdjustment.type === 'subtract'
                        ? 'bg-red-100 border-red-300 text-red-800'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    减少库存
                  </button>
                  <button
                    onClick={() => setStockAdjustment({...stockAdjustment, type: 'set'})}
                    className={`px-3 py-2 text-sm rounded-lg border ${
                      stockAdjustment.type === 'set'
                        ? 'bg-blue-100 border-blue-300 text-blue-800'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    设置库存
                  </button>
                </div>
              </div>

              {/* 数量输入 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {stockAdjustment.type === 'add' ? '增加数量' : 
                   stockAdjustment.type === 'subtract' ? '减少数量' : '设置数量'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={stockAdjustment.quantity}
                  onChange={(e) => setStockAdjustment({...stockAdjustment, quantity: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入数量"
                />
                {stockAdjustment.type === 'subtract' && selectedProduct && (
                  <p className="text-xs text-gray-500 mt-1">
                    当前库存: {selectedProduct.stock}，最多可减少 {selectedProduct.stock}
                  </p>
                )}
              </div>

              {/* 调整原因 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  调整原因（可选）
                </label>
                <input
                  type="text"
                  value={stockAdjustment.reason}
                  onChange={(e) => setStockAdjustment({...stockAdjustment, reason: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="如：盘点调整、损耗、退货等"
                />
              </div>

              {/* 预览调整结果 */}
              {selectedProduct && stockAdjustment.quantity && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">调整预览：</span>
                    {stockAdjustment.type === 'add' && 
                      `${selectedProduct.stock} + ${stockAdjustment.quantity} = ${selectedProduct.stock + parseInt(stockAdjustment.quantity || 0)}`
                    }
                    {stockAdjustment.type === 'subtract' && 
                      `${selectedProduct.stock} - ${stockAdjustment.quantity} = ${selectedProduct.stock - parseInt(stockAdjustment.quantity || 0)}`
                    }
                    {stockAdjustment.type === 'set' && 
                      `${selectedProduct.stock} → ${stockAdjustment.quantity}`
                    }
                  </p>
                </div>
              )}

              {/* 模态框底部按钮 */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeStockModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  disabled={isAdjustingStock}
                >
                  取消
                </button>
                <button
                  onClick={handleStockAdjustment}
                  disabled={isAdjustingStock || !stockAdjustment.quantity}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isAdjustingStock || !stockAdjustment.quantity
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : stockAdjustment.type === 'add'
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : stockAdjustment.type === 'subtract'
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isAdjustingStock ? '调整中...' : '确认调整'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toaster position="top-center" richColors />
    </div>
  );
}