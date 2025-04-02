import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from './database.types';

/**
 * 클라이언트 컴포넌트에서 사용할 Supabase 클라이언트 인스턴스
 * 브라우저에서 실행되는 컴포넌트에서 인증 관련 작업 처리
 * 
 * 주의: Next.js 15 호환성을 위해 업데이트됨
 */
export const createClient = () => 
  createClientComponentClient<Database>({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  }); 