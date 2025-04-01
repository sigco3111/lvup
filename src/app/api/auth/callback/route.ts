import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/utils/supabase/database.types';

/**
 * OAuth 인증 콜백 처리 API 라우트
 * 구글 로그인 후 리디렉션되어 세션을 설정하고 대시보드로 이동
 */
export async function GET(request: NextRequest) {
  // URL에서 인증 코드 추출
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  // 인증 코드가 없으면 홈으로 리디렉션
  if (!code) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  try {
    // 쿠키-기반 Supabase 클라이언트 생성
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // 인증 코드로 세션 교환
    await supabase.auth.exchangeCodeForSession(code);
    
    // 대시보드로 리디렉션
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Auth callback error:', error);
    
    // 에러 발생 시 로그인 페이지로 리디렉션
    return NextResponse.redirect(new URL('/login?error=auth_callback_failed', request.url));
  }
} 