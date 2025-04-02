import Link from "next/link"
import { createClient } from '@/utils/supabase/server';
import LogoutButton from '@/components/auth/LogoutButton';
import { Button } from "@/components/ui/button";

/**
 * 페이지 상단 헤더 컴포넌트
 * 로고와 기본 네비게이션 링크를 표시
 */
export default async function Header() {
  // 서버 컴포넌트에서 사용자 확인 (getUser 사용)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="font-bold text-2xl">
            LVUP
          </Link>
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
            베타
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            href="/" 
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            홈
          </Link>
          <Link 
            href="/features" 
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            특징
          </Link>
          <Link 
            href="/about" 
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            소개
          </Link>
          
          {user ? (
            <>
              <Link 
                href="/dashboard" 
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                대시보드
              </Link>
              <LogoutButton />
            </>
          ) : (
            <Button asChild size="sm" variant="outline">
              <Link 
                href="/login"
              >
                로그인
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  )
} 