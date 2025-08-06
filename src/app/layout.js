import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from 'sonner';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * 应用元数据配置
 */
export const metadata = {
  title: "二维码扫描应用",
  description: "使用摄像头扫描二维码和条形码的 Web 应用",
  keywords: ["二维码", "扫描", "摄像头", "jsQR", "Next.js"],
  viewport: "width=device-width, initial-scale=1",
};

/**
 * 根布局组件
 * 提供应用的基础 HTML 结构
 */
export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster 
          position="top-center"
          richColors
          closeButton
          duration={4000}
        />
      </body>
    </html>
  );
}
