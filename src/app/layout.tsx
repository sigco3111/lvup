import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LVUP - 딴짓하는 동안 레벨업',
  description: '플레이어의 적극적인 조작 개입을 최소화하면서도 RPG의 핵심 재미인 캐릭터 육성의 깊이를 제공하는 온라인 방치형 RPG 게임',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className} suppressHydrationWarning>
        <Header />
        <div className="min-h-screen pt-16 flex flex-col">
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  )
} 