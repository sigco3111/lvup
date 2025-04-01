/**
 * 대시보드 페이지
 * 
 * 게임의 메인 화면으로, 캐릭터 상태, 자동 전투 등의 정보를 표시합니다.
 */

import { redirect } from 'next/navigation';
import { getCurrentCharacter, getJobs, getLevelRequirement } from '@/lib/services/character.service';
import { GameStatusHeader } from '@/components/dashboard/GameStatusHeader';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { GainExperienceButton } from '@/components/character/GainExperienceButton';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  // 현재 캐릭터 정보 조회
  const character = await getCurrentCharacter();
  
  // 캐릭터가 없으면 캐릭터 생성 페이지로 리다이렉트
  if (!character) {
    redirect('/character');
  }
  
  // 캐릭터의 직업 정보 조회
  const jobs = await getJobs();
  const job = jobs.find(j => j.id === character.jobId) || { name: '알 수 없음' };
  
  // 다음 레벨 경험치 요구량 조회
  const nextLevelReq = await getLevelRequirement(character.level);
  const nextLevelExp = nextLevelReq?.requiredExp || 1000; // 기본값 설정
  
  return (
    <div className="container mx-auto py-4">
      {/* 캐릭터 상태 헤더 */}
      <GameStatusHeader
        level={character.level}
        currentExp={character.experience}
        nextLevelExp={nextLevelExp}
        jobName={job.name}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* 전투 정보 카드 */}
        <Card className="p-4 shadow-md">
          <h2 className="text-lg font-semibold mb-3">전투 정보</h2>
          <p className="text-sm text-gray-500">
            자동 전투 시스템은 개발 중입니다. 곧 이용하실 수 있습니다.
          </p>
          {/* 여기에 추후 자동 전투 시스템 연동 */}
        </Card>
        
        {/* 능력치 요약 카드 */}
        <Card className="p-4 shadow-md">
          <h2 className="text-lg font-semibold mb-3">능력치 요약</h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center">
              <span className="mr-2">⚔️</span>
              <div>
                <p className="text-xs text-gray-500">물리 공격력</p>
                <p className="font-medium">{character.physicalAttack}</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="mr-2">🔥</span>
              <div>
                <p className="text-xs text-gray-500">마법 공격력</p>
                <p className="font-medium">{character.magicalAttack}</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="mr-2">🛡️</span>
              <div>
                <p className="text-xs text-gray-500">물리 방어력</p>
                <p className="font-medium">{character.physicalDefense}</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="mr-2">✨</span>
              <div>
                <p className="text-xs text-gray-500">마법 방어력</p>
                <p className="font-medium">{character.magicalDefense}</p>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <Link href="/character" className="text-sm text-blue-600 hover:underline">
              캐릭터 상세 정보 보기 →
            </Link>
          </div>
        </Card>
        
        {/* 스킬 요약 카드 */}
        <Card className="p-4 shadow-md">
          <h2 className="text-lg font-semibold mb-3">스킬 정보</h2>
          <p className="text-sm text-gray-500">
            스킬 시스템은 개발 중입니다. 곧 이용하실 수 있습니다.
          </p>
          {character.skillPoints > 0 && (
            <div className="mt-3 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-md text-sm">
              사용 가능한 스킬 포인트: {character.skillPoints}
            </div>
          )}
          {/* 여기에 추후 스킬 시스템 연동 */}
        </Card>
      </div>
      
      {/* 개발 테스트용 기능: 경험치 획득 버튼 */}
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">개발 테스트 영역</h2>
        <p className="text-sm text-gray-500 mb-3">
          이 영역은 개발 테스트용이며, 정식 버전에서는 제거될 예정입니다.
        </p>
        <GainExperienceButton currentLevel={character.level} />
      </div>
    </div>
  );
}