'use client';

/**
 * 대시보드 페이지
 * 
 * 게임의 메인 화면으로, 캐릭터 상태, 자동 전투, 획득 로그 등의 정보를 표시합니다.
 * 클라이언트 컴포넌트로 구현되어 전투 로그와 골드 상태를 동적으로 관리합니다.
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// UI 컴포넌트
import { Card } from '@/components/ui/card';
import { GameStatusHeader } from '@/components/dashboard/GameStatusHeader';
import { NavBar } from '@/components/layout/NavBar';
import { GainExperienceButton } from '@/components/character/GainExperienceButton';
import { LogItem } from '@/components/dashboard/BattleLog';

// 서비스 및 유틸리티
import { createClient } from '@/utils/supabase/client';

// 동적으로 가져오는 컴포넌트
const BattleScene = dynamic(
  () => import('@/components/battle/BattleScene'),
  { loading: () => <p className="text-center py-4">전투 시스템 로딩 중...</p> }
);

const BattleLog = dynamic(
  () => import('@/components/dashboard/BattleLog').then(mod => ({ default: mod.BattleLog })),
  { loading: () => <p className="text-center py-4">전투 로그 로딩 중...</p> }
);

/**
 * 대시보드 페이지 컴포넌트
 * 
 * 캐릭터 정보, 전투 로그, 골드 등의 상태를 관리하고 표시합니다.
 */
export default function Dashboard() {
  const router = useRouter();
  const supabase = createClient();

  // 상태 관리
  const [character, setCharacter] = useState<any>(null);
  const [job, setJob] = useState<any>({ name: '알 수 없음' });
  const [gameData, setGameData] = useState<any>({ gold: 0 });
  const [nextLevelExp, setNextLevelExp] = useState(1000);
  const [isLoading, setIsLoading] = useState(true);
  const [newItemsCount, setNewItemsCount] = useState(0);
  
  // 전투 로그 상태
  const [battleLogs, setBattleLogs] = useState<LogItem[]>([]);
  
  // 데이터 로드
  useEffect(() => {
    async function loadDashboardData() {
      try {
        // 사용자 확인
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }
        
        // 캐릭터 정보 로드
        const { data: characterData, error: characterError } = await supabase
          .from('user_characters')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (characterError || !characterData) {
          router.push('/character');
          return;
        }
        
        // 직업 정보 로드
        const { data: jobsData } = await supabase
          .from('game_jobs')
          .select('*');
          
        const foundJob = jobsData?.find(j => j.id === characterData.job_id) || { name: '알 수 없음' };
        
        // 다음 레벨 경험치 요구량 로드
        const { data: levelReq } = await supabase
          .from('game_level_requirements')
          .select('*')
          .eq('level', characterData.level + 1)
          .single();
          
        // 게임 데이터(골드 등) 로드
        const { data: gameData } = await supabase
          .from('user_game_data')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        // 새 아이템 알림 개수 로드
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        
        const { count } = await supabase
          .from('user_inventory')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_new', true)
          .gte('acquired_at', oneDayAgo.toISOString());
        
        // 상태 업데이트
        setCharacter(characterData);
        setJob(foundJob);
        setNextLevelExp(levelReq?.required_exp || 1000);
        setGameData(gameData || { gold: 0 });
        setNewItemsCount(count || 0);
        setIsLoading(false);
      } catch (error) {
        console.error('대시보드 데이터 로드 실패:', error);
        setIsLoading(false);
      }
    }
    
    loadDashboardData();
  }, [router, supabase]);
  
  // 골드 변경 핸들러
  const handleGoldChange = useCallback((newGold: number) => {
    setGameData(prev => ({
      ...prev,
      gold: newGold
    }));
  }, []);
  
  // 로그 업데이트 핸들러
  const handleLogUpdate = useCallback((newLog: LogItem) => {
    setBattleLogs(prevLogs => {
      // 새 로그를 추가하고, 최대 50개까지만 유지
      const updatedLogs = [newLog, ...prevLogs];
      return updatedLogs.slice(0, 50);
    });
    
    // 아이템 획득 시 알림 카운트 증가
    if (newLog.type === 'item') {
      setNewItemsCount(prev => prev + 1);
    }
  }, []);
  
  // 로딩 중 화면
  if (isLoading || !character) {
    return (
      <div className="container mx-auto py-4 flex items-center justify-center h-screen">
        <p className="text-xl">데이터 로딩 중...</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-4 pb-20">
      {/* 캐릭터 상태 헤더 */}
      <GameStatusHeader
        level={character.level}
        currentExp={character.experience}
        nextLevelExp={nextLevelExp}
        jobName={job.name}
        gold={gameData.gold || 0}
        onGoldChange={handleGoldChange}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* 전투 정보 카드 */}
        <Card className="p-4 shadow-md">
          <h2 className="text-lg font-semibold mb-3">전투 정보</h2>
          <BattleScene 
            onGoldChange={handleGoldChange}
            onLogUpdate={handleLogUpdate}
          />
        </Card>
        
        {/* 능력치 요약 카드 */}
        <Card className="p-4 shadow-md">
          <h2 className="text-lg font-semibold mb-3">능력치 요약</h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center">
              <span className="mr-2">⚔️</span>
              <div>
                <p className="text-xs text-gray-500">물리 공격력</p>
                <p className="font-medium">{character.physical_attack}</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="mr-2">🔥</span>
              <div>
                <p className="text-xs text-gray-500">마법 공격력</p>
                <p className="font-medium">{character.magical_attack}</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="mr-2">🛡️</span>
              <div>
                <p className="text-xs text-gray-500">물리 방어력</p>
                <p className="font-medium">{character.physical_defense}</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="mr-2">✨</span>
              <div>
                <p className="text-xs text-gray-500">마법 방어력</p>
                <p className="font-medium">{character.magical_defense}</p>
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
          {character.skill_points > 0 && (
            <div className="mt-3 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-md text-sm">
              사용 가능한 스킬 포인트: {character.skill_points}
            </div>
          )}
          {/* 여기에 추후 스킬 시스템 연동 */}
        </Card>
      </div>
      
      {/* 전투 로그 카드 */}
      <Card className="p-0 shadow-md mb-8 overflow-hidden">
        <BattleLog logs={battleLogs} height="200px" />
      </Card>
      
      {/* 개발 테스트용 기능: 경험치 획득 버튼 */}
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">개발 테스트 영역</h2>
        <p className="text-sm text-gray-500 mb-3">
          이 영역은 개발 테스트용이며, 정식 버전에서는 제거될 예정입니다.
        </p>
        <GainExperienceButton currentLevel={character.level} />
      </div>
      
      {/* 네비게이션 바 */}
      <NavBar newItemsCount={newItemsCount} />
    </div>
  );
}