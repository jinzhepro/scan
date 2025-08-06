"use client";

import { useEffect } from "react";

/**
 * vConsole调试组件
 * 仅在开发环境中启用，用于移动端调试
 */
export default function VConsole() {
  useEffect(() => {
    // 只在开发环境中启用vConsole
    if (true) {
      // 动态导入vConsole以避免在生产环境中打包
      import("vconsole")
        .then((VConsole) => {
          // 检查是否已经初始化过vConsole
          if (!window.vConsole) {
            window.vConsole = new VConsole.default({
              theme: "light", // 主题：light 或 dark
              defaultPlugins: ["system", "network", "element", "storage"], // 启用的插件
              maxLogNumber: 1000, // 最大日志数量
            });
            console.log("vConsole initialized for development");
          }
        })
        .catch((error) => {
          console.error("Failed to load vConsole:", error);
        });
    }

    // 清理函数
    return () => {
      if (window.vConsole && process.env.NODE_ENV === "development") {
        // 在组件卸载时不销毁vConsole，因为它是全局调试工具
        // window.vConsole.destroy();
      }
    };
  }, []);

  // 这个组件不渲染任何UI
  return null;
}
