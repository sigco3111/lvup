import Link from "next/link"

/**
 * 페이지 하단 푸터 컴포넌트
 * 기본 링크와 저작권 정보를 표시
 */
export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold">제품</h3>
            <nav className="flex flex-col gap-2">
              <Link 
                href="/features" 
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                특징
              </Link>
              <Link 
                href="/roadmap" 
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                로드맵
              </Link>
            </nav>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold">회사</h3>
            <nav className="flex flex-col gap-2">
              <Link 
                href="/about" 
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                소개
              </Link>
              <Link 
                href="/contact" 
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                문의하기
              </Link>
            </nav>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold">리소스</h3>
            <nav className="flex flex-col gap-2">
              <Link 
                href="/faq" 
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                자주 묻는 질문
              </Link>
              <Link 
                href="/privacy" 
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                개인정보 처리방침
              </Link>
            </nav>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold">게임 시작하기</h3>
            <p className="text-sm text-muted-foreground">딴짓하는 동안 레벨업!</p>
            <Link 
              href="/dashboard" 
              className="text-sm text-primary hover:underline"
            >
              지금 바로 게임 시작하기
            </Link>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} LVUP. All rights reserved.
        </div>
      </div>
    </footer>
  )
} 