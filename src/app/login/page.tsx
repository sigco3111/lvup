import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import LoginButton from '@/components/auth/LoginButton';

export const metadata: Metadata = {
  title: '로그인 - LVUP',
  description: '구글 계정으로 로그인하여 LVUP을 시작하세요.',
};

/**
 * 로그인 페이지 컴포넌트
 * 이미 로그인된 사용자는 대시보드로 리디렉션
 */
export default async function LoginPage() {
  // 서버 컴포넌트에서 세션 확인
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  // 이미 로그인된 사용자는 대시보드로 리디렉션
  if (session) {
    redirect('/dashboard');
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">LVUP</h1>
          <p className="mt-3 text-xl text-muted-foreground">
            딴짓하는 동안 레벨업
          </p>
        </div>
        
        <div className="mt-10">
          <div className="space-y-6">
            <LoginButton />
            <p className="text-center text-sm text-muted-foreground mt-4">
              구글 계정으로 로그인하여 게임을 시작하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 