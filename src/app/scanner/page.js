import Link from 'next/link';
import QRScanner from '@/components/QRScanner';

/**
 * 条形码扫描页面组件
 * 提供专门的条形码扫描功能界面
 */
export default function ScannerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      {/* 头部导航 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center text-blue-600 hover:text-blue-800 transition-colors">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回首页
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">
              条形码扫描器
            </h1>
            <div className="w-20"></div> {/* 占位符保持居中 */}
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* 扫描器组件 */}
        <QRScanner />
        
        {/* 使用提示 */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            使用说明
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-blue-600 text-sm font-semibold">1</span>
                </div>
                <p className="text-gray-600 text-sm">
                  点击&ldquo;开始扫描&rdquo;按钮启动摄像头
                </p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-blue-600 text-sm font-semibold">2</span>
                </div>
                <p className="text-gray-600 text-sm">
                  允许浏览器访问摄像头权限
                </p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-blue-600 text-sm font-semibold">3</span>
                </div>
                <p className="text-gray-600 text-sm">
                  将条形码对准扫描框，保持稳定
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-gray-600 text-sm">
                  支持 EAN-13、EAN-8、UPC-A、UPC-E 等格式
                </p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-gray-600 text-sm">
                  支持 Code 128、Code 39、Code 93 等格式
                </p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-gray-600 text-sm">
                  自动识别并显示条形码内容
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 技术说明 */}
        <div className="mt-6 bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h4 className="text-md font-semibold text-gray-700 mb-3">技术说明</h4>
          <div className="text-sm text-gray-600 space-y-2">
            <p>• 本应用使用 ZXing 库进行条形码识别，支持多种国际标准格式</p>
            <p>• 为了保护隐私，所有扫描处理都在本地进行，不会上传任何数据</p>
            <p>• 建议在光线充足的环境下使用，以获得最佳扫描效果</p>
            <p>• 支持移动设备和桌面浏览器，推荐使用 Chrome 或 Safari 浏览器</p>
          </div>
        </div>
      </main>
    </div>
  );
}