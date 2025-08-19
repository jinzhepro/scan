"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast, Toaster } from "sonner";

/**
 * 订单管理页面
 */
export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);

  /**
   * 获取订单列表
   */
  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders?page=${page}&limit=${pagination.limit}`);
      const result = await response.json();

      if (result.success) {
        setOrders(result.orders);
        setPagination(result.pagination);
      } else {
        toast.error('获取订单列表失败');
      }
    } catch (error) {
      console.error('获取订单列表失败:', error);
      toast.error('获取订单列表失败');
    } finally {
      setLoading(false);
    }
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
    // 创建日期对象并加上8小时时区偏移
    const date = new Date(dateString);
    const offsetDate = new Date(date.getTime() + 8 * 60 * 60 * 1000);
    
    return offsetDate.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  /**
   * 处理分页
   */
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchOrders(newPage);
    }
  };

  // 组件挂载时获取订单列表
  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Toaster position="top-center" richColors />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">订单管理</h1>
          <p className="mt-2 text-gray-600">查看和管理所有订单信息</p>
        </div>

        {/* 导航链接 */}
        <div className="mb-6">
          <nav className="flex space-x-4">
            <Link
              href="/"
              className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              🏠 返回首页
            </Link>
            <Link
              href="/products"
              className="px-4 py-2 text-green-600 hover:text-green-800 font-medium border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
            >
              📦 商品管理
            </Link>
          </nav>
        </div>

        {/* 订单统计 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">📋</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-800">总订单数</p>
                <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-800">总销售额</p>
                <p className="text-2xl font-bold text-gray-900">
                  ¥{orders.reduce((sum, order) => sum + parseFloat(order.final_amount || 0), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-800">平均订单金额</p>
                <p className="text-2xl font-bold text-gray-900">
                  ¥{orders.length > 0 ? (orders.reduce((sum, order) => sum + parseFloat(order.final_amount || 0), 0) / orders.length).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 订单列表 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">订单列表</h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-800">加载中...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center">
              <span className="text-6xl mb-4 block">📋</span>
              <p className="text-gray-800">暂无订单数据</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        订单号
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        订单金额
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        优惠金额
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        实付金额
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        状态
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        创建时间
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-black">
                            {order.order_number}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            ¥{parseFloat(order.total_amount).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            ¥{parseFloat(order.discount_amount || 0).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-green-600">
                            ¥{parseFloat(order.final_amount).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            {order.status === 'completed' ? '已完成' : order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(order.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => fetchOrderDetail(order.id)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            查看详情
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* 分页 */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-800">
                      显示第 {((pagination.page - 1) * pagination.limit) + 1} 到 {Math.min(pagination.page * pagination.limit, pagination.total)} 条，
                      共 {pagination.total} 条记录
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        上一页
                      </button>
                      
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          const current = pagination.page;
                          return page === 1 || page === pagination.totalPages || (page >= current - 2 && page <= current + 2);
                        })
                        .map((page, index, array) => {
                          const showEllipsis = index > 0 && array[index - 1] !== page - 1;
                          return (
                            <div key={page} className="flex items-center">
                              {showEllipsis && <span className="px-2 text-gray-500">...</span>}
                              <button
                                onClick={() => handlePageChange(page)}
                                className={`px-3 py-1 text-sm border rounded-md ${
                                  page === pagination.page
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            </div>
                          );
                        })}
                      
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        下一页
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

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
                            单价
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            数量
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            小计
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedOrder.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.product_name}</td>
                            <td className="px-4 py-3 text-sm text-gray-800">{item.barcode}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">¥{parseFloat(item.price).toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">¥{parseFloat(item.subtotal).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}