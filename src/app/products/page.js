"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { toast, Toaster } from "sonner";
import StockAdjustmentModal from "../../components/StockAdjustmentModal";

/**
 * 商品管理页面
 * 显示所有商品信息和库存管理功能
 */
export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  
  // 添加搜索状态
  const [searchQuery, setSearchQuery] = useState("");
  
  // 添加销售统计状态
  const [salesStats, setSalesStats] = useState([]);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [selectedProductSales, setSelectedProductSales] = useState(null);
  const [salesRecords, setSalesRecords] = useState([]);
  const [isLoadingSales, setIsLoadingSales] = useState(false);
  
  // 添加订单详情状态
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // 使用 useMemo 来过滤商品列表
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return products;
    }
    
    return products.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

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
   * 获取商品销售统计数据
   */
  const fetchSalesStats = async () => {
    try {
      const response = await fetch("/api/products/sales-stats");
      const data = await response.json();

      if (data.success) {
        setSalesStats(data.data);
      } else {
        console.error("获取销售统计失败:", data.error);
      }
    } catch (error) {
      console.error("获取销售统计失败:", error);
    }
  };

  /**
   * 获取单个商品的详细销售记录
   */
  const fetchProductSalesRecords = async (productId) => {
    setIsLoadingSales(true);
    try {
      const response = await fetch(`/api/products/${productId}/sales-records`);
      const data = await response.json();

      if (data.success) {
        setSelectedProductSales(data.data);
        setSalesRecords(data.data.sales_records);
        setShowSalesModal(true);
      } else {
        toast.error("获取销售记录失败：" + (data.error || "未知错误"));
      }
    } catch (error) {
      console.error("获取销售记录失败:", error);
      toast.error("获取销售记录失败：网络错误");
    } finally {
      setIsLoadingSales(false);
    }
  };

  /**
   * 关闭销售记录模态框
   */
  const closeSalesModal = () => {
    setShowSalesModal(false);
    setSelectedProductSales(null);
    setSalesRecords([]);
  };

  /**
   * 获取订单详情
   */
  const fetchOrderDetail = async (orderId) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      const result = await response.json();

      if (result.success) {
        setSelectedOrder(result.order);
        setShowOrderDetail(true);
      } else {
        toast.error('获取订单详情失败');
      }
    } catch (error) {
      console.error('获取订单详情失败:', error);
      toast.error('获取订单详情失败');
    }
  };

  /**
   * 格式化日期
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    // 增加8小时的时区偏移
    // date.setHours(date.getHours() + 8);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };







  /**
   * 显示库存调整模态框
   * @param {Object} product - 商品信息
   */
  const showStockAdjustment = (product) => {
    setSelectedProduct(product);
    setShowStockModal(true);
  };

  /**
   * 关闭库存调整模态框
   */
  const closeStockModal = () => {
    setShowStockModal(false);
    setSelectedProduct(null);
  };

  /**
   * 库存调整成功回调
   */
  const handleStockAdjustmentSuccess = () => {
    // 刷新商品列表
    fetchProducts();
  };



  /**
   * 页面初始化
   */
  useEffect(() => {
    const initPage = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchProducts(),
        fetchSalesStats()
      ]);
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
          <p className="text-gray-600">查看所有商品信息和库存状态</p>
        </div>

        {/* 搜索框 */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  搜索商品
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="search"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="输入商品名称进行搜索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              {searchQuery && (
                <div className="flex items-end">
                  <button
                    onClick={() => setSearchQuery("")}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    清除搜索
                  </button>
                </div>
              )}
            </div>
            {searchQuery && (
              <div className="mt-2 text-sm text-gray-600">
                找到 {filteredProducts.length} 个匹配的商品
              </div>
            )}
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">📦</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {searchQuery ? "搜索结果" : "商品总数"}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredProducts.length}
                </p>
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
                  {filteredProducts.filter((p) => p.stock > 0).length}
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
                  {filteredProducts.filter((p) => p.stock === 0).length}
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

          {filteredProducts.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">
                {searchQuery ? "没有找到匹配的商品" : "暂无商品数据"}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  清除搜索条件
                </button>
              )}
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
                      总库存
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      可用库存
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      销售数量
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => {
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
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              product.stock <= 10
                                ? "bg-red-100 text-red-800"
                                : product.stock <= 50
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              (product.available_stock || 0) <= 5
                                ? "bg-red-100 text-red-800"
                                : (product.available_stock || 0) <= 20
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {product.available_stock || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(() => {
                            const salesStat = salesStats.find(stat => stat.id === product.id);
                            const totalSold = salesStat ? parseInt(salesStat.total_sold) : 0;
                            return (
                              <div className="flex items-center space-x-2">
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    totalSold === 0
                                      ? "bg-gray-100 text-gray-800"
                                      : totalSold <= 10
                                      ? "bg-blue-100 text-blue-800"
                                      : totalSold <= 50
                                      ? "bg-purple-100 text-purple-800"
                                      : "bg-orange-100 text-orange-800"
                                  }`}
                                >
                                  {totalSold}
                                </span>
                                {totalSold > 0 && (
                                  <button
                                    onClick={() => fetchProductSalesRecords(product.id)}
                                    className="text-blue-600 hover:text-blue-800 text-xs"
                                    disabled={isLoadingSales}
                                  >
                                    查看记录
                                  </button>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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

        {/* 导航链接 */}
        <div className="text-center mt-8">
          <div className="flex justify-center gap-6">
            <Link
              href="/"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              ← 返回首页
            </Link>
            <Link
              href="/orders"
              className="inline-flex items-center text-green-600 hover:text-green-800 font-medium"
            >
              📋 订单管理
            </Link>
          </div>
        </div>
      </div>



      {/* 库存调整模态框 */}
      <StockAdjustmentModal
        isOpen={showStockModal}
        product={selectedProduct}
        onClose={closeStockModal}
        onSuccess={handleStockAdjustmentSuccess}
      />

      {/* 销售记录详情模态框 */}
      {showSalesModal && selectedProductSales && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* 模态框标题 */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  销售记录 - {selectedProductSales.product.name}
                </h3>
                <button
                  onClick={closeSalesModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">关闭</span>
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* 商品基本信息 */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">商品名称</p>
                    <p className="font-medium text-gray-900">{selectedProductSales.product.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">条形码</p>
                    <p className="font-mono text-sm text-gray-900">{selectedProductSales.product.barcode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">当前价格</p>
                    <p className="font-medium text-gray-900">¥{selectedProductSales.product.price}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">总销售数量</p>
                    <p className="font-medium text-blue-600">{selectedProductSales.statistics.total_sold}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-gray-600">总销售额</p>
                    <p className="font-medium text-green-600">¥{selectedProductSales.statistics.total_revenue.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">订单数量</p>
                    <p className="font-medium text-gray-900">{selectedProductSales.statistics.order_count}</p>
                  </div>
                </div>
              </div>

              {/* 销售记录列表 */}
              <div className="mb-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">详细销售记录</h4>
                {salesRecords.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">暂无销售记录</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            订单号
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            销售时间
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            数量
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            单价
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            小计
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            订单总额
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {salesRecords.map((record, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <button
                                onClick={() => fetchOrderDetail(record.order_id)}
                                className="text-sm font-mono text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                              >
                                {record.order_number}
                              </button>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900">{formatDate(record.created_at)}</span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-gray-900">{record.quantity}</span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900">¥{parseFloat(record.price).toFixed(2)}</span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-green-600">¥{parseFloat(record.subtotal).toFixed(2)}</span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900">¥{parseFloat(record.final_amount).toFixed(2)}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 模态框底部按钮 */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={closeSalesModal}
                  className="px-6 py-3 text-base font-medium bg-gray-200 text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-300 hover:border-gray-400 transition-all duration-200 shadow-sm"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 订单详情弹窗 */}
      {showOrderDetail && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  订单详情 - {selectedOrder.order_number}
                </h3>
                <button
                  onClick={() => setShowOrderDetail(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
              
              {/* 订单基本信息 */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-3">订单信息</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-800">订单号：</span>
                    <span className="font-medium text-black">{selectedOrder.order_number}</span>
                  </div>
                  <div>
                    <span className="text-gray-800">状态：</span>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {selectedOrder.status === 'completed' ? '已完成' : selectedOrder.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-800">创建时间：</span>
                    <span className="font-medium text-black">{formatDate(selectedOrder.created_at)}</span>
                  </div>
                  <div>
                    <span className="text-gray-800">订单金额：</span>
                    <span className="font-medium text-black">¥{parseFloat(selectedOrder.total_amount).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-800">优惠金额：</span>
                    <span className="font-medium text-red-600">-¥{parseFloat(selectedOrder.discount_amount || 0).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-800">实付金额：</span>
                    <span className="font-medium text-green-600">¥{parseFloat(selectedOrder.final_amount).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              {/* 商品明细 */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">商品明细</h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            商品名称
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            条形码
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            数量
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            单价
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            小计
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedOrder.items.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-gray-900">{item.product_name}</span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="text-sm font-mono text-gray-600">{item.barcode}</span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900">{item.quantity}</span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900">¥{parseFloat(item.price).toFixed(2)}</span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-green-600">¥{parseFloat(item.subtotal).toFixed(2)}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* 模态框底部按钮 */}
              <div className="flex justify-end pt-4 border-t border-gray-200 mt-6">
                <button
                  onClick={() => setShowOrderDetail(false)}
                  className="px-6 py-3 text-base font-medium bg-gray-200 text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-300 hover:border-gray-400 transition-all duration-200 shadow-sm"
                >
                  关闭
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
