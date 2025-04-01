'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';

/**
 * 구글 로그인 버튼 컴포넌트
 * 클릭 시 구글 OAuth 인증 플로우를 시작
 */
export default function LoginButton() {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleLogin = async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();
      
      // 구글 로그인 실행
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
        },
      });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Button 
      onClick={handleLogin} 
      disabled={isLoading}
      size="lg"
      className="w-full max-w-sm"
    >
      {isLoading ? '로그인 중...' : '구글 계정으로 로그인'}
    </Button>
  );
} 