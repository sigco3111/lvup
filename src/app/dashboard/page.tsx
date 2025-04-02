'use client';

/**
 * 대시보드 페이지
 * 
 * 게임의 메인 화면으로, 캐릭터 상태, 자동 전투, 획득 로그 등의 정보를 표시합니다.
 * 클라이언트 컴포넌트로 구현되어 전투 로그와 골드 상태를 동적으로 관리합니다.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { createClient } from '@/utils/supabase/client';
import { ReloadIcon } from '@radix-ui/react-icons';
import { NotificationProvider } from '@/components/common/Notifications';
import { StageProvider } from '@/components/stage/StageContext';
import { Button } from '@/components/ui/button';
import { v4 as uuidv4 } from 'uuid';

// UI 컴포넌트
import { Card } from '@/components/ui/card';
import { GameStatusHeader } from '@/components/dashboard/GameStatusHeader';
import { NavBar } from '@/components/layout/NavBar';
import { GainExperienceButton } from '@/components/character/GainExperienceButton';
import { LogItem } from '@/components/dashboard/BattleLog';

// 스테이지 컴포넌트
import StageCard from '@/components/stage/StageCard';

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
 * 게임 데이터 타입 정의
 */
interface GameData {
  gold: number;
  experience?: number;
  current_stage_id?: number;
  // 필요한 다른 게임 데이터 필드 추가
  [key: string]: any;
}

/**
 * 대시보드 페이지 컴포넌트
 * 
 * 캐릭터 정보, 전투 로그, 골드 등의 상태를 관리하고 표시합니다.
 */
export default function Dashboard() {
  const router = useRouter();
  const supabase = createClient();
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const lastUpdateTimeRef = useRef<number>(Date.now());

  // 상태 관리
  const [character, setCharacter] = useState<any>(null);
  const [job, setJob] = useState<any>({ name: '알 수 없음' });
  const [gameData, setGameData] = useState<GameData>({ gold: 0 });
  const [nextLevelExp, setNextLevelExp] = useState(1000);
  const [isLoading, setIsLoading] = useState(true);
  const [newItemsCount, setNewItemsCount] = useState(0);
  const [isForceRefresh, setIsForceRefresh] = useState(false);
  
  // 전투 로그 상태
  const [battleLogs, setBattleLogs] = useState<LogItem[]>([]);
  
  // 직접 상태 업데이트를 위한 훅 추가
  const forceRender = useCallback(() => {
    console.log('UI 강제 갱신 요청');
    setRefreshKey(prev => prev + 1);
  }, []);

  // 로그 업데이트 핸들러
  const handleLogUpdate = useCallback((newLog: LogItem | { id: string; type: 'system'; message: string; timestamp: Date }) => {
    console.log('로그 추가:', newLog.message);
    
    setBattleLogs(prevLogs => {
      // 새 로그를 추가하고, 최대 50개까지만 유지
      const updatedLogs = [newLog as LogItem, ...prevLogs];
      return updatedLogs.slice(0, 50);
    });
    
    // 아이템 획득 시 알림 카운트 증가
    if (newLog.type === 'item') {
      setNewItemsCount(prev => prev + 1);
    }
  }, []);

  // 골드 값을 직접 업데이트하는 함수
  const updateGoldDirectly = useCallback((newGold: number) => {
    console.log(`골드 직접 업데이트: ${gameData.gold} → ${newGold}`);
    
    // 로컬 상태 즉시 업데이트
    setGameData(prev => {
      const updated = { 
        ...prev, 
        gold: newGold
      };
      return updated;
    });
    
    // 변경되었음을 표시
    forceRender();
  }, [gameData.gold, forceRender]);

  // 경험치 값을 직접 업데이트하는 함수
  const updateExpDirectly = useCallback((newExp: number) => {
    console.log(`경험치 직접 업데이트: ${character?.experience || 0} → ${newExp}`);
    
    // 로컬 상태 즉시 업데이트
    setCharacter(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        experience: newExp
      };
    });
    
    // 변경되었음을 표시
    forceRender();
  }, [character, forceRender]);

  // 테스트 골드 추가 버튼 직접 구현
  const addTestGold = useCallback(async () => {
    try {
      const goldToAdd = 100;
      const currentGold = gameData.gold || 0;
      const newGold = currentGold + goldToAdd;
      
      console.log(`[테스트 골드] 추가: ${currentGold} + ${goldToAdd} = ${newGold}`);
      
      // 1. 로컬 상태 즉시 업데이트 
      updateGoldDirectly(newGold);
      
      // 2. 로그 추가
      handleLogUpdate({
        id: uuidv4(),
        type: 'gold' as const,
        message: `테스트: ${goldToAdd} 골드가 추가되었습니다!`,
        timestamp: new Date()
      });
      
      // 3. 서버에 저장 (비동기로 백그라운드에서 처리)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('사용자 인증 정보 없음');
          return;
        }
        
        // 사용자 데이터 업데이트
        const { data, error } = await supabase
          .from('user_game_data')
          .update({ gold: newGold })
          .eq('user_id', user.id);
        
        if (error) {
          console.error('골드 업데이트 오류:', error);
        } else {
          console.log('골드 서버 업데이트 성공');
        }
      } catch (error) {
        console.error('서버 통신 오류:', error);
      }
    } catch (error) {
      console.error('골드 추가 처리 오류:', error);
    }
  }, [gameData.gold, handleLogUpdate, supabase, updateGoldDirectly]);

  // 골드 변경 핸들러를 단순화하고 직접 UI 업데이트에 집중
  const goldChangeHandler = useCallback((newGold: number) => {
    console.log(`골드 변경 감지: ${newGold}`);
    updateGoldDirectly(newGold);
  }, [updateGoldDirectly]);
  
  // 데이터 로드 함수
  const loadDashboardData = useCallback(async () => {
    try {
      console.log('대시보드 데이터 로드 시작...', { 강제갱신: isForceRefresh });
      lastUpdateTimeRef.current = Date.now();
      
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
      
      console.log('캐릭터 데이터 로드 완료:', characterData.level, characterData.experience);
      
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
      const { data: gameData, error: gameDataError } = await supabase
        .from('user_game_data')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (gameDataError) {
        console.error('게임 데이터 로드 오류:', gameDataError);
      } else {
        console.log('게임 데이터 로드 완료:', gameData);
        
        // 골드 값 변경 확인 및 로그
        if (isForceRefresh || gameData.gold !== 0) {
          console.log(`골드 업데이트: ${gameData.gold}`);
          
          // 로그 추가
          if (isForceRefresh) {
            handleLogUpdate({
              id: Date.now().toString(),
              type: 'system',
              message: `데이터 새로고침: 골드 ${gameData.gold}`,
              timestamp: new Date()
            });
          }
        }
      }
      
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
      
      // 강제 갱신 상태 초기화
      if (isForceRefresh) {
        setIsForceRefresh(false);
      }
    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, [router, supabase, isForceRefresh]);
  
  // 초기 데이터 로드 및 실시간 구독 설정
  useEffect(() => {
    loadDashboardData();
    
    // 실시간 구독 설정 - 단순화
    const userGameDataChannel = supabase
      .channel('user_game_data_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',  // 업데이트 이벤트만 구독
          schema: 'public',
          table: 'user_game_data'
        },
        (payload) => {
          console.log('실시간 업데이트 감지 (게임 데이터):', payload);
          
          // 새로운 데이터가 있는지 확인
          if (payload.new) {
            // 골드 변경 감지
            if (payload.new.gold !== undefined) {
              console.log(`골드 변경 감지: ${gameData.gold} → ${payload.new.gold}`);
              
              // 1. 즉시 UI에 반영
              setGameData(prev => {
                const updatedData = { ...prev, gold: payload.new.gold };
                console.log('업데이트된 게임 데이터:', updatedData);
                return updatedData;
              });
              
              // 2. 변경된 경우에만 로그 추가 (증가한 경우)
              const goldDiff = payload.new.gold - gameData.gold;
              if (goldDiff > 0) {
                handleLogUpdate({
                  id: uuidv4(),
                  type: 'gold' as const,
                  message: `${goldDiff} 골드를 획득했습니다!`,
                  timestamp: new Date()
                });
              }
            }
          }
        }
      )
      .subscribe();
      
    // 캐릭터 데이터 변경 구독 - 단순화
    const userCharacterChannel = supabase
      .channel('user_character_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_characters'
        },
        (payload) => {
          console.log('실시간 업데이트 감지 (캐릭터):', payload);
          
          // 새로운 데이터가 있는지 확인
          if (payload.new) {
            // 경험치 변경 감지
            if (payload.new.experience !== undefined && character) {
              console.log(`경험치 변경 감지: ${character.experience} → ${payload.new.experience}`);
              
              // 1. 즉시 UI에 반영
              setCharacter(prev => {
                if (!prev) return prev;
                return { ...prev, experience: payload.new.experience };
              });
              
              // 2. 변경된 경우에만 로그 추가 (증가한 경우)
              const expDiff = payload.new.experience - character.experience;
              if (expDiff > 0) {
                handleLogUpdate({
                  id: uuidv4(),
                  type: 'exp' as const,
                  message: `${expDiff} 경험치를 획득했습니다!`,
                  timestamp: new Date()
                });
              }
              
              // 레벨 변경 감지
              if (payload.new.level !== undefined && payload.new.level !== character.level) {
                console.log(`레벨 변경 감지: ${character.level} → ${payload.new.level}`);
                
                // 캐릭터 레벨 업데이트
                setCharacter(prev => {
                  if (!prev) return prev;
                  return { ...prev, level: payload.new.level };
                });
                
                // 레벨업 로그 추가
                if (payload.new.level > character.level) {
                  handleLogUpdate({
                    id: uuidv4(),
                    type: 'battle' as const,
                    message: `레벨 업! Lv.${character.level} → Lv.${payload.new.level}`,
                    timestamp: new Date()
                  });
                  
                  // 다음 레벨 경험치 요구량 업데이트
                  loadDashboardData();
                }
              }
            }
          }
        }
      )
      .subscribe();
    
    // 주기적 새로고침 간격 변경 (3초마다)
    refreshTimerRef.current = setInterval(() => {
      console.log('주기적 데이터 동기화 실행');
      loadDashboardData();
    }, 3000);
    
    return () => {
      // 구독 및 타이머 정리
      userGameDataChannel.unsubscribe();
      userCharacterChannel.unsubscribe();
      
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [loadDashboardData, supabase, character, gameData.gold]);
  
  // 강제 새로고침 감지 및 처리
  useEffect(() => {
    if (isForceRefresh) {
      console.log('강제 새로고침 트리거됨');
      loadDashboardData();
    }
  }, [isForceRefresh, loadDashboardData]);
  
  // 새로고침 키 변경 시 강제 새로고침
  useEffect(() => {
    if (refreshKey > 0) {
      console.log('새로고침 키 변경으로 인한 데이터 갱신');
      setIsForceRefresh(true);
    }
  }, [refreshKey]);
  
  // 수동 새로고침 함수
  const refreshDashboard = () => {
    console.log('대시보드 데이터 수동 새로고침');
    // 기존 stageProgress 값을 유지하기 위해 isForceRefresh를 true로 설정
    setIsForceRefresh(true);
    // 리프레시 키를 증가시켜 컴포넌트 리렌더링 유도
    setRefreshKey(prev => prev + 1);
  };
  
  // 로딩 중 화면
  if (isLoading || !character) {
    return (
      <div className="container mx-auto py-4 flex items-center justify-center h-screen">
        <div className="text-center">
          <ReloadIcon className="animate-spin h-8 w-8 mx-auto mb-4" />
          <p className="text-xl">데이터 로딩 중...</p>
        </div>
      </div>
    );
  }
  
  return (
    <StageProvider key={`stage-provider-${refreshKey}`}>
      <NotificationProvider>
        <div className="container mx-auto py-4 pb-20">
          {/* 캐릭터 상태 헤더 */}
          <div className="flex justify-between items-center mb-4">
            <GameStatusHeader
              level={character.level}
              currentExp={character.experience}
              nextLevelExp={nextLevelExp}
              jobName={job.name}
              gold={gameData.gold || 0}
              onGoldChange={goldChangeHandler}
            />
            <button 
              onClick={refreshDashboard}
              className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
              disabled={isForceRefresh}
            >
              {isForceRefresh ? (
                <>
                  <ReloadIcon className="w-3 h-3 mr-1 animate-spin" />
                  갱신 중...
                </>
              ) : (
                <>
                  <span className="mr-1">🔄</span>
                  새로고침
                </>
              )}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* 전투 정보 카드 */}
            <Card className="p-4 shadow-md">
              <h2 className="text-lg font-semibold mb-3">전투 정보</h2>
              <BattleScene 
                onGoldChange={goldChangeHandler}
                onLogUpdate={handleLogUpdate}
                key={`battle-${refreshKey}`}
              />
            </Card>
            
            {/* 스테이지 정보 카드 */}
            <StageCard
              onBossChallenge={() => {
                // 보스 전투 시작 시 필요한 로직
                handleLogUpdate({
                  id: Date.now().toString(),
                  type: 'battle',
                  message: '보스 전투가 시작되었습니다!',
                  timestamp: new Date()
                });
                
                // 데이터 새로고침 트리거
                setTimeout(() => {
                  setIsForceRefresh(true);
                }, 1000);
              }}
              key={`stage-${refreshKey}`}
              forceRefresh={isForceRefresh}
            />
            
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
                <a href="/character" className="text-sm text-blue-600 hover:underline">
                  캐릭터 상세 정보 보기 →
                </a>
              </div>
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
            <div className="flex flex-wrap gap-2">
              <GainExperienceButton 
                currentLevel={character.level} 
                onExperienceGained={() => {
                  // 경험치 획득 후 데이터 새로고침 트리거
                  setTimeout(() => {
                    setIsForceRefresh(true);
                  }, 1000);
                }}
              />
              
              {/* 골드 테스트 버튼 코드 교체 */}
              {process.env.NODE_ENV === 'development' && (
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={addTestGold}
                >
                  골드 +100 추가 (테스트)
                </Button>
              )}
            </div>
          </div>
          
          {/* 네비게이션 바 */}
          <NavBar newItemsCount={newItemsCount} />
        </div>
      </NotificationProvider>
    </StageProvider>
  );
}