import Link from 'next/link'
import { Button } from '@/components/ui/button'

/**
 * 게임의 주요 특징을 상세히 설명하는 페이지
 */
export default function FeaturesPage() {
  return (
    <div className="container py-16">
      <h1 className="text-4xl font-bold mb-8 text-center">LVUP의 주요 특징</h1>
      <p className="text-xl text-muted-foreground text-center max-w-3xl mx-auto mb-16">
        딴짓하는 동안 레벨업은 플레이어의 적극적인 조작 개입을 최소화하면서도 RPG의 핵심 재미인 캐릭터 육성의 깊이를 제공합니다.
      </p>

      {/* 특징 섹션 1 */}
      <div className="mb-20">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl font-bold mb-4">자동 전투 시스템</h2>
            <p className="mb-4 text-muted-foreground">
              캐릭터가 자동으로 몬스터를 공격하고, 스킬을 사용하며, 보상을 획득합니다. 
              게임이 실행 중인 동안 지속적으로 성장하며, 복잡한 조작이 필요 없습니다.
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span>캐릭터 자동 타겟팅 및 공격</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span>스킬 자동 사용</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span>자동 재화, 경험치, 아이템 획득</span>
              </li>
            </ul>
          </div>
          <div className="bg-muted/30 rounded-lg h-64 flex items-center justify-center">
            <p className="text-muted-foreground">[자동 전투 이미지]</p>
          </div>
        </div>
      </div>

      {/* 특징 섹션 2 */}
      <div className="mb-20">
        <div className="grid md:grid-cols-2 gap-10 items-center md:flex-row-reverse">
          <div className="md:order-2">
            <h2 className="text-2xl font-bold mb-4">깊이 있는 장비 시스템</h2>
            <p className="mb-4 text-muted-foreground">
              다양한 등급의 장비를 수집하고 강화하여 캐릭터를 성장시킬 수 있습니다. 
              일반부터 전설, 신화까지 다양한 등급의 장비와 세트 효과를 경험해보세요.
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span>다양한 등급의 장비 (일반, 고급, 희귀, 영웅, 전설, 신화)</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span>장비 강화 시스템</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span>세트 효과 및 고유 옵션</span>
              </li>
            </ul>
          </div>
          <div className="bg-muted/30 rounded-lg h-64 flex items-center justify-center md:order-1">
            <p className="text-muted-foreground">[장비 시스템 이미지]</p>
          </div>
        </div>
      </div>

      {/* 특징 섹션 3 */}
      <div className="mb-20">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl font-bold mb-4">다단계 직업 시스템</h2>
            <p className="mb-4 text-muted-foreground">
              8개의 기본 직업에서 시작해 다양한 전직 경로를 통해 캐릭터를 발전시킬 수 있습니다.
              각 직업마다 고유한 스킬과 패시브 능력을 제공합니다.
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span>8개 기본 직업 (전사, 마법사, 도적 등)</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span>50레벨, 200레벨, 500레벨에서의 전직 기회</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span>직업별 고유 스킬 및 패시브</span>
              </li>
            </ul>
          </div>
          <div className="bg-muted/30 rounded-lg h-64 flex items-center justify-center">
            <p className="text-muted-foreground">[직업 시스템 이미지]</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center mt-16">
        <h2 className="text-3xl font-bold mb-6">지금 바로 게임을 시작해보세요</h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          딴짓하는 동안 레벨업의 다양한 기능들을 직접 체험해보세요. 무료로 시작할 수 있습니다.
        </p>
        <Button size="lg" asChild>
          <Link href="/dashboard">
            게임 시작하기
          </Link>
        </Button>
      </div>
    </div>
  )
} 