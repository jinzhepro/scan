import QRScanner from '@/components/QRScanner';

/**
 * 主页组件
 * 提供二维码扫描功能的主界面
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      {/* 头部标题 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-center text-gray-800">
            二维码扫描应用
          </h1>
          <p className="text-center text-gray-600 mt-2">
            使用摄像头扫描二维码和条形码
          </p>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <QRScanner />
      </main>

      {/* 页脚 */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center text-gray-500 text-sm">
            <p>基于 Next.js 和 jsQR 构建的二维码扫描应用</p>
            <p className="mt-1">支持各种类型的二维码和条形码识别</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
