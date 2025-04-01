'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

/**
 * 로그아웃 버튼 컴포넌트
 * 클릭 시 Supabase 세션을 종료하고 홈 페이지로 이동
 */
export default function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();
      
      // 로그아웃 실행
      await supabase.auth.signOut();
      
      // 홈 페이지로 이동
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Button 
      onClick={handleLogout} 
      disabled={isLoading}
      variant="ghost"
      size="sm"
    >
      {isLoading ? '로그아웃 중...' : '로그아웃'}
    </Button>
  );
} 