import { useState } from "react";
import { toast } from "sonner";

/**
 * 库存调整模态框组件
 * @param {Object} props - 组件属性
 * @param {boolean} props.isOpen - 是否显示模态框
 * @param {Object} props.product - 商品信息
 * @param {Function} props.onClose - 关闭模态框回调
 * @param {Function} props.onSuccess - 调整成功回调
 */
export default function StockAdjustmentModal({ isOpen, product, onClose, onSuccess }) {
  const [stockAdjustment, setStockAdjustment] = useState({
    type: "add",
    quantity: "",
    reason: "",
    adjustAvailableStock: false,
    onlyAvailableStock: true,
  });
  const [isAdjustingStock, setIsAdjustingStock] = useState(false);

  // 重置表单
  const resetForm = () => {
    setStockAdjustment({
      type: "add",
      quantity: "",
      reason: "",
      adjustAvailableStock: false,
      onlyAvailableStock: true,
    });
  };

  // 关闭模态框
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // 处理库存调整
  const handleStockAdjustment = async () => {
    if (!product || !stockAdjustment.quantity) {
      toast.error("请输入调整数量");
      return;
    }

    const quantity = parseInt(stockAdjustment.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error("请输入有效的数量");
      return;
    }

    // 如果是减少库存，检查是否会导致负库存
    if (
      stockAdjustment.type === "subtract" &&
      quantity > product.stock
    ) {
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
      const response = await fetch(
        `/api/products/${product.id}/stock`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: stockAdjustment.type,
            quantity: quantity,
            reason: stockAdjustment.reason || "手动调整",
            adjustAvailableStock: stockAdjustment.adjustAvailableStock,
            onlyAvailableStock: stockAdjustment.onlyAvailableStock,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("库存调整成功");
        handleClose();
        if (onSuccess) {
          onSuccess();
        }
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* 模态框标题 */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              调整库存 - {product?.name}
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* 当前库存信息 */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-base font-semibold text-gray-800 mb-2">
              当前库存信息
            </h4>
            <div className="text-base text-gray-700 space-y-1">
              <div className="flex justify-between">
                <span>总库存：</span>
                <span className="font-medium">{product?.stock || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>可用库存：</span>
                <span className="font-medium">
                  {product?.available_stock || 0}
                </span>
              </div>
            </div>
          </div>

          {/* 调整类型 */}
          <div className="mb-4">
            <label className="block text-base font-semibold text-gray-800 mb-3">
              调整类型
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="adjustmentType"
                  value="add"
                  checked={stockAdjustment.type === "add"}
                  onChange={(e) =>
                    setStockAdjustment({
                      ...stockAdjustment,
                      type: e.target.value,
                    })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-base text-gray-800">增加</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="adjustmentType"
                  value="subtract"
                  checked={stockAdjustment.type === "subtract"}
                  onChange={(e) =>
                    setStockAdjustment({
                      ...stockAdjustment,
                      type: e.target.value,
                    })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-base text-gray-800">减少</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="adjustmentType"
                  value="set"
                  checked={stockAdjustment.type === "set"}
                  onChange={(e) =>
                    setStockAdjustment({
                      ...stockAdjustment,
                      type: e.target.value,
                    })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-base text-gray-800">设置</span>
              </label>
            </div>
          </div>

          {/* 调整数量 */}
          <div className="mb-4">
            <label className="block text-base font-semibold text-gray-800 mb-2">
              调整数量
            </label>
            <input
              type="number"
              value={stockAdjustment.quantity}
              onChange={(e) =>
                setStockAdjustment({
                  ...stockAdjustment,
                  quantity: e.target.value,
                })
              }
              className="w-full px-4 py-3 text-base text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="请输入数量"
              min="1"
            />
          </div>

          {/* 调整原因 */}
          <div className="mb-6">
            <label className="block text-base font-semibold text-gray-800 mb-2">
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
              className="w-full px-4 py-3 text-base text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
              placeholder="如：盘点调整、损耗、退货等"
            />
          </div>

          {/* 库存调整选项 */}
          <div className="mb-6">
            <label className="block text-base font-semibold text-gray-800 mb-3">
              库存调整选项
            </label>
            <div className="space-y-3">
              <label className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  name="stockAdjustmentOption"
                  checked={stockAdjustment.onlyAvailableStock}
                  onChange={() =>
                    setStockAdjustment({
                      ...stockAdjustment,
                      adjustAvailableStock: false,
                      onlyAvailableStock: true,
                    })
                  }
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 mt-0.5"
                />
                <div className="ml-3">
                  <span className="text-base font-medium text-gray-800">
                    仅调整可用库存（推荐）
                  </span>
                  <p className="text-sm text-gray-600 mt-1">
                    只调整可用库存，总库存保持不变（适用于释放预留库存等场景）
                  </p>
                </div>
              </label>

              <label className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  name="stockAdjustmentOption"
                  checked={
                    stockAdjustment.adjustAvailableStock &&
                    !stockAdjustment.onlyAvailableStock
                  }
                  onChange={() =>
                    setStockAdjustment({
                      ...stockAdjustment,
                      adjustAvailableStock: true,
                      onlyAvailableStock: false,
                    })
                  }
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 mt-0.5"
                />
                <div className="ml-3">
                  <span className="text-base font-medium text-gray-800">
                    同时调整总库存和可用库存
                  </span>
                  <p className="text-sm text-gray-600 mt-1">
                    同时调整总库存和可用库存数量
                  </p>
                </div>
              </label>

              <label className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  name="stockAdjustmentOption"
                  checked={
                    !stockAdjustment.adjustAvailableStock &&
                    !stockAdjustment.onlyAvailableStock
                  }
                  onChange={() =>
                    setStockAdjustment({
                      ...stockAdjustment,
                      adjustAvailableStock: false,
                      onlyAvailableStock: false,
                    })
                  }
                  className="h-5 w-5 text-black focus:ring-blue-500 border-gray-300 mt-0.5"
                />
                <div className="ml-3">
                  <span className="text-base font-medium text-gray-800">
                    仅调整总库存
                  </span>
                  <p className="text-sm text-gray-600 mt-1">
                    只调整总库存，可用库存保持不变
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* 预览调整结果 */}
          {product && stockAdjustment.quantity && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-base font-semibold text-gray-800 mb-3">
                调整预览
              </h4>
              <div className="text-base text-gray-700 space-y-3">
                {/* 仅调整可用库存的情况 */}
                {stockAdjustment.onlyAvailableStock ? (
                  <>
                    {/* 总库存保持不变 */}
                    <div className="flex justify-between items-center py-2">
                      <span className="font-medium">总库存：</span>
                      <span className="text-gray-600">
                        {product.stock} → {product.stock}
                      </span>
                    </div>
                    {/* 可用库存变化 */}
                    <div className="flex justify-between items-center py-2 border-t border-blue-200 pt-3">
                      <span className="font-medium">可用库存：</span>
                      <span
                        className={`${
                          (() => {
                            const quantity = parseInt(stockAdjustment.quantity);
                            const currentAvailable =
                              product.available_stock || 0;
                            let newAvailableStock;

                            switch (stockAdjustment.type) {
                              case "add":
                                newAvailableStock = currentAvailable + quantity;
                                break;
                              case "subtract":
                                newAvailableStock = currentAvailable - quantity;
                                break;
                              case "set":
                                newAvailableStock = quantity;
                                break;
                              default:
                                newAvailableStock = currentAvailable;
                            }

                            return newAvailableStock < 0 || newAvailableStock > product.stock
                              ? "text-red-700"
                              : "text-green-700";
                          })()
                        }`}
                      >
                        {product.available_stock || 0} →{" "}
                        {(() => {
                          const quantity = parseInt(stockAdjustment.quantity);
                          const currentAvailable = product.available_stock || 0;
                          let newAvailableStock;

                          switch (stockAdjustment.type) {
                            case "add":
                              newAvailableStock = currentAvailable + quantity;
                              break;
                            case "subtract":
                              newAvailableStock = currentAvailable - quantity;
                              break;
                            case "set":
                              newAvailableStock = quantity;
                              break;
                            default:
                              newAvailableStock = currentAvailable;
                          }

                          if (newAvailableStock > product.stock) {
                            return `${product.stock} (自动调整)`;
                          }

                          return newAvailableStock;
                        })()}
                      </span>
                    </div>
                    {(() => {
                      const quantity = parseInt(stockAdjustment.quantity);
                      const currentAvailable = product.available_stock || 0;
                      let newAvailableStock;

                      switch (stockAdjustment.type) {
                        case "add":
                          newAvailableStock = currentAvailable + quantity;
                          break;
                        case "subtract":
                          newAvailableStock = currentAvailable - quantity;
                          break;
                        case "set":
                          newAvailableStock = quantity;
                          break;
                        default:
                          newAvailableStock = currentAvailable;
                      }

                      if (newAvailableStock > product.stock) {
                        return (
                          <p className="text-sm text-amber-700 bg-amber-50 p-2 rounded mt-2">
                            ⚠️ 可用库存不能超过总库存，将自动调整为{" "}
                            {product.stock}
                          </p>
                        );
                      }

                      if (newAvailableStock < 0) {
                        return (
                          <p className="text-sm text-red-700 bg-red-50 p-2 rounded mt-2">
                            ❌ 可用库存不能为负数
                          </p>
                        );
                      }

                      return null;
                    })()}
                  </>
                ) : (
                  <>
                    {/* 总库存变化 */}
                    <div className="flex justify-between items-center py-2">
                      <span className="font-medium">总库存：</span>
                      <span
                        className={`${
                          (() => {
                            const quantity = parseInt(stockAdjustment.quantity);
                            let newStock;
                            switch (stockAdjustment.type) {
                              case "add":
                                newStock = product.stock + quantity;
                                break;
                              case "subtract":
                                newStock = product.stock - quantity;
                                break;
                              case "set":
                                newStock = quantity;
                                break;
                              default:
                                newStock = product.stock;
                            }
                            return newStock < 0 ? "text-red-700" : "text-green-700";
                          })()
                        }`}
                      >
                        {product.stock} →{" "}
                        {(() => {
                          const quantity = parseInt(stockAdjustment.quantity);
                          switch (stockAdjustment.type) {
                            case "add":
                              return product.stock + quantity;
                            case "subtract":
                              return product.stock - quantity;
                            case "set":
                              return quantity;
                            default:
                              return product.stock;
                          }
                        })()}
                      </span>
                    </div>

                    {/* 可用库存变化 */}
                    {stockAdjustment.adjustAvailableStock && (
                      <div className="border-t border-blue-200 pt-3">
                        <div className="flex justify-between items-center py-1">
                          <span className="font-medium">可用库存：</span>
                          <span
                            className={`${
                              (() => {
                                const quantity = parseInt(
                                  stockAdjustment.quantity
                                );
                                const currentAvailable =
                                  product.available_stock || 0;
                                let newAvailableStock;

                                switch (stockAdjustment.type) {
                                  case "add":
                                    newAvailableStock =
                                      currentAvailable + quantity;
                                    break;
                                  case "subtract":
                                    newAvailableStock =
                                      currentAvailable - quantity;
                                    break;
                                  case "set":
                                    newAvailableStock = Math.min(
                                      quantity,
                                      currentAvailable
                                    );
                                    break;
                                  default:
                                    newAvailableStock = currentAvailable;
                                }

                                return newAvailableStock < 0
                                  ? "text-red-700"
                                  : "text-green-700";
                              })()
                            }`}
                          >
                            {product.available_stock || 0} →{" "}
                            {(() => {
                              const quantity = parseInt(
                                stockAdjustment.quantity
                              );
                              const currentAvailable =
                                product.available_stock || 0;
                              let newAvailableStock;

                              switch (stockAdjustment.type) {
                                case "add":
                                  newAvailableStock =
                                    currentAvailable + quantity;
                                  break;
                                case "subtract":
                                  newAvailableStock =
                                    currentAvailable - quantity;
                                  break;
                                case "set":
                                  newAvailableStock = Math.min(
                                    quantity,
                                    currentAvailable
                                  );
                                  break;
                                default:
                                  newAvailableStock = currentAvailable;
                              }

                              // 计算新的总库存
                              let newTotalStock;
                              switch (stockAdjustment.type) {
                                case "add":
                                  newTotalStock = product.stock + quantity;
                                  break;
                                case "subtract":
                                  newTotalStock = product.stock - quantity;
                                  break;
                                case "set":
                                  newTotalStock = quantity;
                                  break;
                                default:
                                  newTotalStock = product.stock;
                              }

                              // 确保可用库存不超过总库存
                              if (newAvailableStock > newTotalStock) {
                                newAvailableStock = newTotalStock;
                              }

                              return newAvailableStock;
                            })()}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-3 text-base font-medium text-gray-700 bg-gray-200 border border-gray-300 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleStockAdjustment}
              disabled={isAdjustingStock || !stockAdjustment.quantity}
              className="flex-1 px-4 py-3 text-base font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isAdjustingStock ? "调整中..." : "确认调整"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}