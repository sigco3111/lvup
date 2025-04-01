import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Supabase 인증 미들웨어
 * 모든 요청에서 쿠키 기반 인증 세션을 새로고침하고 유지
 */
export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  try {
    // Supabase 미들웨어 클라이언트 생성
    // Next.js 15에서는 req/res 방식만 사용하도록 cookies 객체를 전달하지 않음
    const supabase = createMiddlewareClient({ req, res })
    
    // 세션 새로고침
    await supabase.auth.getSession()
  } catch (e) {
    console.error('Middleware error:', e)
  }
  
  return res
}

// 미들웨어 적용 경로 (모든 경로에 적용)
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
} 