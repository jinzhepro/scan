"use client";

import { useEffect } from "react";

/**
 * VConsole 调试组件
 * 在移动端显示控制台，方便调试
 */
export default function VConsole() {
  useEffect(() => {
    // 只在客户端且非生产环境下加载 vConsole
    if (true) {
      import("vconsole")
        .then((VConsole) => {
          // 检查是否已经初始化过 vConsole
          if (!window.vConsole) {
            window.vConsole = new VConsole.default({
              theme: "light",
              defaultPlugins: ["system", "network", "element", "storage"],
              maxLogNumber: 1000,
              onReady: function () {
                console.log("📱 vConsole 已启动，可在移动端查看调试信息");
                console.log("🔧 调试提示：");
                console.log("  - 点击右下角绿色按钮打开调试面板");
                console.log("  - Console 标签查看日志");
                console.log("  - Network 标签查看网络请求");
                console.log("  - System 标签查看设备信息");
              },
              onShow: function () {
                console.log("👀 vConsole 面板已打开");
              },
              onHide: function () {
                console.log("👋 vConsole 面板已关闭");
              },
            });

            // 添加一些有用的调试信息
            console.log("🌐 当前环境信息:");
            console.log("  - User Agent:", navigator.userAgent);
            console.log(
              "  - 屏幕尺寸:",
              window.screen.width + "x" + window.screen.height
            );
            console.log(
              "  - 视口尺寸:",
              window.innerWidth + "x" + window.innerHeight
            );
            console.log("  - 设备像素比:", window.devicePixelRatio);
            console.log(
              "  - 是否支持摄像头:",
              !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
            );
            console.log("  - 是否安全上下文:", window.isSecureContext);
          }
        })
        .catch((error) => {
          console.error("vConsole 加载失败:", error);
        });
    }

    // 清理函数
    return () => {
      if (typeof window !== "undefined" && window.vConsole) {
        // 注意：通常不需要销毁 vConsole，因为它在整个应用生命周期中都有用
        // window.vConsole.destroy();
        // window.vConsole = null;
      }
    };
  }, []);

  return null; // 这个组件不渲染任何 UI
}
