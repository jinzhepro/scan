import Link from 'next/link';
import QRScanner from '@/components/QRScanner';

/**
 * 条形码扫描页面组件
 * 提供全屏摄像头扫描功能界面
 */
export default function ScannerPage() {
  return (
    <div className="w-full h-screen overflow-hidden">
      {/* 返回首页按钮 - 仅在未扫描时显示 */}
      <div className="absolute top-4 left-4 z-40">
        <Link 
          href="/" 
          className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg hover:bg-white transition-colors"
        >
          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium text-gray-700">返回</span>
        </Link>
      </div>

      {/* 扫描器组件 - 全屏 */}
      <QRScanner />
    </div>
  );
}