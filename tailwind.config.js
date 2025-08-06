/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 微信主题色
        wechat: {
          primary: '#07C160',
          secondary: '#06AD56',
          light: '#E8F5E8',
          dark: '#059748',
        },
        // 系统色彩
        background: {
          primary: '#FFFFFF',
          secondary: '#F7F7F7',
          tertiary: '#EDEDED',
        },
        text: {
          primary: '#191919',
          secondary: '#666666',
          tertiary: '#999999',
          inverse: '#FFFFFF',
        },
        border: {
          light: '#E5E5E5',
          medium: '#D1D1D1',
          dark: '#CCCCCC',
        },
        status: {
          success: '#07C160',
          warning: '#FA9D3B',
          error: '#FA5151',
          info: '#10AEFF',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'PingFang SC', 'Helvetica Neue', 'STHeiTi', 'Microsoft YaHei', 'Tahoma', 'Simsun', 'sans-serif'],
      },
      fontSize: {
        'xs': '12px',
        'sm': '14px',
        'base': '16px',
        'lg': '18px',
        'xl': '20px',
        '2xl': '24px',
        '3xl': '30px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'button': '0 2px 4px rgba(7, 193, 96, 0.2)',
        'scanner': '0 0 0 2px rgba(7, 193, 96, 0.3)',
      },
      animation: {
        'scan': 'scan 2s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
    },
  },
  plugins: [],
}