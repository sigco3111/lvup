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
    
    // 실시간 구독 설정
    const userGameDataChannel = supabase
      .channel('user_game_data_changes')
      .on(
        'postgres_changes',
        {
          event: '*',  // INSERT, UPDATE, DELETE 이벤트 모두 감지
          schema: 'public',
          table: 'user_game_data'
        },
        (payload) => {
          console.log('사용자 게임 데이터 변경 감지:', payload);
          
          // 이벤트가 발생한 시간 확인 (너무 오래된 이벤트는 무시)
          const now = Date.now();
          if (now - lastUpdateTimeRef.current < 100) {
            console.log('이미 처리된 이벤트로 판단, 무시');
            return;
          }
          
          // 골드 값이 변경되었을 때 즉시 업데이트
          if (payload.eventType === 'UPDATE' && payload.new) {
            // 먼저 gameData 상태 업데이트 
            setGameData(prevData => {
              const newData = { ...prevData };
              
              // 골드 값이 변경된 경우
              if (payload.new.gold !== undefined && prevData.gold !== payload.new.gold) {
                console.log(`골드 값 변경 감지: ${prevData.gold} -> ${payload.new.gold}`);
                newData.gold = payload.new.gold;
                
                // 골드 변경 로그 추가
                const goldDiff = payload.new.gold - prevData.gold;
                if (goldDiff > 0) {
                  handleLogUpdate({
                    id: Date.now().toString(),
                    type: 'gold',
                    message: `${goldDiff} 골드를 획득했습니다!`,
                    timestamp: new Date()
                  });
                }
              }
              
              // 스테이지 ID가 변경된 경우
              if (payload.new.current_stage_id !== undefined && 
                  prevData.current_stage_id !== payload.new.current_stage_id) {
                console.log(`스테이지 변경 감지: ${prevData.current_stage_id} -> ${payload.new.current_stage_id}`);
                newData.current_stage_id = payload.new.current_stage_id;
                
                // 스테이지 변경 로그 추가
                handleLogUpdate({
                  id: Date.now().toString(),
                  type: 'battle',
                  message: `스테이지가 변경되었습니다!`,
                  timestamp: new Date()
                });
                
                // 스테이지 변경 시 강제 새로고침 트리거
                setTimeout(() => {
                  setIsForceRefresh(true);
                }, 300);
              }
              
              return newData;
            });
          } else {
            // 다른 타입의 이벤트는 전체 데이터 다시 로드
            loadDashboardData();
          }
        }
      )
      .subscribe();
      
    // 캐릭터 데이터 변경 구독
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
          console.log('캐릭터 데이터 변경 감지:', payload);
          
          // 이벤트가 발생한 시간 확인 (너무 오래된 이벤트는 무시)
          const now = Date.now();
          if (now - lastUpdateTimeRef.current < 100) {
            console.log('이미 처리된 이벤트로 판단, 무시');
            return;
          }
          
          // 경험치 값이 변경되었을 때 즉시 업데이트
          if (payload.new && payload.new.experience !== undefined) {
            setCharacter((prev: any) => {
              if (!prev) return prev;
              
              const newCharacter = { ...prev };
              
              // 경험치가 변경된 경우
              if (prev.experience !== payload.new.experience) {
                console.log(`경험치 변경 감지: ${prev.experience} -> ${payload.new.experience}`);
                newCharacter.experience = payload.new.experience;
                
                // 경험치 변경 로그 추가
                const expDiff = payload.new.experience - prev.experience;
                if (expDiff > 0) {
                  handleLogUpdate({
                    id: Date.now().toString(),
                    type: 'exp',
                    message: `${expDiff} 경험치를 획득했습니다!`,
                    timestamp: new Date()
                  });
                }
              }
              
              // 레벨이 변경된 경우
              if (payload.new.level !== undefined && prev.level !== payload.new.level) {
                console.log(`레벨 변경 감지: ${prev.level} -> ${payload.new.level}`);
                newCharacter.level = payload.new.level;
                
                // 레벨 업 로그 추가
                if (payload.new.level > prev.level) {
                  handleLogUpdate({
                    id: Date.now().toString(),
                    type: 'battle',
                    message: `레벨 업! Lv.${prev.level} → Lv.${payload.new.level}`,
                    timestamp: new Date()
                  });
                }
                
                // 레벨 변경 시 다음 레벨 경험치 요구량도 업데이트 필요
                setTimeout(() => {
                  loadDashboardData();
                }, 1000);
              }
              
              return newCharacter;
            });
          } else {
            // 다른 필드가 변경된 경우 전체 데이터 다시 로드
            loadDashboardData();
          }
        }
      )
      .subscribe();
      
    // 스테이지 클리어 구독
    const stageClearChannel = supabase
      .channel('stage_clear_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_cleared_stages'
        },
        (payload) => {
          console.log('스테이지 클리어 감지:', payload);
          
          // 스테이지 클리어 로그 추가
          handleLogUpdate({
            id: Date.now().toString(),
            type: 'battle',
            message: `스테이지를 클리어했습니다!`,
            timestamp: new Date()
          });
          
          // 스테이지 클리어 시 강제 새로고침 트리거
          setTimeout(() => {
            setIsForceRefresh(true);
          }, 1000);
        }
      )
      .subscribe();
    
    // 주기적 새로고침 (5초마다)
    refreshTimerRef.current = setInterval(() => {
      console.log('주기적 데이터 동기화');
      loadDashboardData();
    }, 5000);
    
    return () => {
      // 구독 및 타이머 정리
      userGameDataChannel.unsubscribe();
      userCharacterChannel.unsubscribe();
      stageClearChannel.unsubscribe();
      
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [loadDashboardData, supabase]);
  
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
  
  // 골드 변경 처리 핸들러
  const goldChangeHandler = useCallback((newGold: number) => {
    console.log('골드 변경 감지:', newGold);
    
    // 즉시 UI 업데이트
    setGameData(prev => ({
      ...prev,
      gold: newGold
    }));
    
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
              
              {/* 골드 테스트 버튼 - 개발용 */}
              {process.env.NODE_ENV === 'development' && (
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={async () => {
                    try {
                      // 현재 골드 값 가져오기
                      const currentGold = gameData.gold || 0;
                      const goldToAdd = 100;
                      const newGold = currentGold + goldToAdd;
                      
                      // 1. 즉시 UI 업데이트
                      setGameData(prev => ({
                        ...prev,
                        gold: newGold
                      }));
                      
                      // 2. 로그 업데이트
                      handleLogUpdate({
                        id: uuidv4(),
                        type: 'gold',
                        message: `테스트: ${goldToAdd} 골드가 추가되었습니다!`,
                        timestamp: new Date()
                      });
                      
                      // 3. 서버에 저장 (백그라운드에서 비동기로 처리)
                      (async () => {
                        try {
                          const { data: { user } } = await supabase.auth.getUser();
                          if (!user) return;
                          
                          const { data, error } = await supabase
                            .from('user_game_data')
                            .update({ gold: newGold })
                            .eq('user_id', user.id);
                          
                          if (error) {
                            console.error('골드 업데이트 오류:', error);
                            return;
                          }
                          
                          console.log('골드 업데이트 성공:', newGold);
                        } catch (err) {
                          console.error('골드 업데이트 중 예외 발생:', err);
                        }
                      })();
                    } catch (error) {
                      console.error('골드 추가 오류:', error);
                    }
                  }}
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