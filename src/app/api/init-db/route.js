import { NextResponse } from 'next/server';
import { initDatabase } from '@/lib/db';

/**
 * 初始化数据库表
 * POST /api/init-db
 */
export async function POST(request) {
  try {
    await initDatabase();
    
    return NextResponse.json({
      success: true,
      message: '数据库初始化成功'
    });
  } catch (error) {
    console.error('数据库初始化失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '数据库初始化失败',
        message: error.message 
      },
      { status: 500 }
    );
  }
}