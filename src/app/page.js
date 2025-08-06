import Link from 'next/link';

/**
 * 主页组件
 * 提供应用功能导航的首页
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      {/* 头部标题 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-center text-gray-800">
            扫码应用
          </h1>
          <p className="text-center text-gray-600 mt-2">
            专业的条形码扫描工具
          </p>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* 条形码扫描卡片 */}
          <Link href="/scanner" className="group">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 border border-gray-200 group-hover:border-blue-300">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg mb-4 mx-auto group-hover:bg-blue-200 transition-colors">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12h-4.01M12 12v4m6-4h.01M12 8h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 text-center mb-2">
                条形码扫描
              </h3>
              <p className="text-gray-600 text-center text-sm">
                使用摄像头扫描各种类型的条形码
              </p>
              <div className="mt-4 text-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  点击开始扫描
                </span>
              </div>
            </div>
          </Link>

          {/* 功能介绍卡片 */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-lg mb-4 mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 text-center mb-2">
              支持多种格式
            </h3>
            <p className="text-gray-600 text-center text-sm">
              支持 EAN、UPC、Code128、Code39 等多种条形码格式
            </p>
          </div>

          {/* 使用说明卡片 */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-lg mb-4 mx-auto">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 text-center mb-2">
              使用说明
            </h3>
            <p className="text-gray-600 text-center text-sm">
              允许摄像头权限，将条形码对准扫描框即可自动识别
            </p>
          </div>
        </div>

        {/* 快速开始按钮 */}
        <div className="text-center mt-12">
          <Link href="/scanner">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12h-4.01M12 12v4m6-4h.01M12 8h.01" />
                </svg>
                开始扫描条形码
              </span>
            </button>
          </Link>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center text-gray-500 text-sm">
            <p>基于 Next.js 和 ZXing 构建的条形码扫描应用</p>
            <p className="mt-1">支持各种类型的条形码识别</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
