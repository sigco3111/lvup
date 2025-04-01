import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/utils/supabase/server'

/**
 * 랜딩 페이지 컴포넌트
 * 게임의 주요 특징과 장점을 소개하는 메인 페이지
 */
export default async function Home() {
  // 서버 컴포넌트에서 세션 확인
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  return (
    <div>
      {/* 히어로 섹션 */}
      <section className="py-20 md:py-28">
        <div className="container flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            딴짓하는 동안 <span className="text-primary">레벨업</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mb-10">
            플레이어의 적극적인 조작 개입을 최소화하면서도 RPG의 핵심 재미인 캐릭터 육성의 깊이를 제공하는 온라인 방치형 RPG 게임
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg">
              <Link href={session ? "/dashboard" : "/login"}>
                {session ? "게임 계속하기" : "지금 바로 시작하기"}
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/features">
                게임 특징 살펴보기
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 주요 특징 섹션 */}
      <section className="py-16 bg-muted/50">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">핵심 특징</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>최소한의 조작, 최대한의 성장</CardTitle>
                <CardDescription>자동 전투 및 자원 획득으로 피로도 감소</CardDescription>
              </CardHeader>
              <CardContent>
                <p>자동 전투 및 자원 획득으로 피로도를 감소시키고, 전략적 결정(장비, 스킬, 직업, 유물)에 집중하여 재미를 제공합니다.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>깊이 있는 성장 시스템</CardTitle>
                <CardDescription>다양한 장비와 다단계 전직 시스템</CardDescription>
              </CardHeader>
              <CardContent>
                <p>다양한 장비(등급/옵션/세트), 다단계 전직, 영구 패시브 유물 시스템으로 장기적 성장 목표를 부여합니다.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>접근성 높은 RPG 경험</CardTitle>
                <CardDescription>익숙한 판타지 세계관과 직관적 인터페이스</CardDescription>
              </CardHeader>
              <CardContent>
                <p>익숙한 판타지 세계관, 직관적 인터페이스, 자동화 시스템으로 쉬운 적응 및 성장 재미를 제공합니다.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 타겟 유저 섹션 */}
      <section className="py-16">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">이런 분들께 추천합니다</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex flex-col items-center text-center p-6 bg-background rounded-lg border">
              <h3 className="text-xl font-semibold mb-3">라이트 RPG 유저</h3>
              <p className="text-muted-foreground">쉽고 간편한 자동 성장을 선호하는 플레이어</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-background rounded-lg border">
              <h3 className="text-xl font-semibold mb-3">전략/최적화 선호 유저</h3>
              <p className="text-muted-foreground">스펙 최적화 및 결과 확인을 선호하는 플레이어</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-background rounded-lg border">
              <h3 className="text-xl font-semibold mb-3">클래식 판타지 팬</h3>
              <p className="text-muted-foreground">익숙한 세계관 및 직업 기반 육성을 선호하는 플레이어</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-background rounded-lg border">
              <h3 className="text-xl font-semibold mb-3">멀티태스킹 유저</h3>
              <p className="text-muted-foreground">다른 작업 중 켜놓을 수 있는 온라인 서브 게임을 선호하는 플레이어</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-16 bg-primary/10">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-6">지금 바로 모험을 시작하세요</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            게임을 켜두는 것만으로도 지속적인 성장이 가능한 LVUP의 세계로 초대합니다.
          </p>
          <Button size="lg" asChild>
            <Link href={session ? "/dashboard" : "/login"}>
              {session ? "게임 계속하기" : "무료로 시작하기"}
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
} 