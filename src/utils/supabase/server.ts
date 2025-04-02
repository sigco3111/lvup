import { createServerComponentClient, createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from './database.types';
import { createClient as createServiceClient } from '@supabase/supabase-js';

/**
 * 서버 컴포넌트에서 사용할 Supabase 클라이언트 인스턴스
 * 쿠키에서 세션 정보를 읽어와 인증된 사용자 정보에 접근
 * 
 * Next.js 15 비동기 cookies() 함수 지원 - 수정된 방식
 */
export async function createClient() {
  // Next.js 15에서 수정된 방식
  return createServerComponentClient<Database>({
    cookies
  });
}

/**
 * 서버 액션에서 사용할 Supabase 클라이언트 인스턴스
 * 폼 제출 등의 서버 액션에서 인증된 사용자 정보에 접근
 * 
 * Next.js 15 비동기 cookies() 함수 지원 - 수정된 방식
 */
export async function createActionClient() {
  // Next.js 15에서 수정된 방식
  return createServerActionClient<Database>({ 
    cookies
  });
}

/**
 * 관리자 권한의 Supabase 서비스 클라이언트 인스턴스
 * 주의: 서버 측 코드에서만 사용해야 함
 */
export function createAdminClient() {
  return createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}