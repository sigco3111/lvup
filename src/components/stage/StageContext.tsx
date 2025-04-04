/**
 * 스테이지 관련 상태를 관리하는 Context
 * 
 * 현재 스테이지 정보, 진행도, 스테이지 변경 등을 관리합니다.
 */

'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Stage, StageProgress, ClearStageData, ClearStageResult } from '@/lib/types/stage';
import { clearStage } from '@/actions/game';
import { createClient } from '@/utils/supabase/client';

// Context 기본값 타입 정의
interface StageContextType {
  // 상태
  currentStage: Stage | null;
  stageProgress: StageProgress;
  isLoading: boolean;
  
  // 액션
  fetchStageData: () => Promise<boolean>;
  incrementKilledMonsterCount: () => void;
  setBossBattleState: (isBossBattle: boolean) => void;
  completeStage: (isBossClear: boolean) => Promise<ClearStageResult>;
}

// 컨텍스트 기본값
const defaultContext: StageContextType = {
  currentStage: null,
  stageProgress: {
    currentStageId: 1,
    killedMonsterCount: 0,
    isBossAvailable: false,
    isBossBattle: false,
    clearedStages: []
  },
  isLoading: true,
  
  fetchStageData: async () => false,
  incrementKilledMonsterCount: () => {},
  setBossBattleState: () => {},
  completeStage: async () => ({ success: false, message: '컨텍스트가 초기화되지 않았습니다.' })
};

// Context 생성
const StageContext = createContext<StageContextType>(defaultContext);

// Context Hook
export const useStage = () => useContext(StageContext);

// Provider 컴포넌트
interface StageProviderProps {
  children: ReactNode;
  initialStage?: Stage | null;
  initialProgress?: Partial<StageProgress>;
}

export function StageProvider({ 
  children, 
  initialStage, 
  initialProgress 
}: StageProviderProps) {
  const supabase = createClient();
  
  // 상태 관리
  const [currentStage, setCurrentStage] = useState<Stage | null>(initialStage || null);
  const [stageProgress, setStageProgress] = useState<StageProgress>({
    currentStageId: initialProgress?.currentStageId || 1,
    killedMonsterCount: initialProgress?.killedMonsterCount || 0,
    isBossAvailable: initialProgress?.isBossAvailable || false,
    isBossBattle: initialProgress?.isBossBattle || false,
    clearedStages: initialProgress?.clearedStages || []
  });
  const [isLoading, setIsLoading] = useState(initialStage ? false : true);

  // 스테이지 데이터 로드 함수
  const fetchStageData = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('StageContext: 스테이지 데이터 로드 시작');
      
      // 사용자 확인
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('StageContext: 사용자 인증 정보 없음');
        throw new Error('사용자 인증 정보가 없습니다.');
      }

      // 현재 스테이지 정보 로드
      const { data: gameData } = await supabase
        .from('user_game_data')
        .select('current_stage_id')
        .eq('user_id', user.id)
        .maybeSingle();

      // 게임 데이터가 없거나 current_stage_id가 없는 경우 기본값 설정
      let currentStageId = gameData?.current_stage_id || 1;
      
      console.log('StageContext: 현재 스테이지 ID:', currentStageId);
      
      // 스테이지 정보 로드
      const { data: stageData, error: stageError } = await supabase
        .from('game_stages')
        .select('*')
        .eq('id', currentStageId)
        .single();

      if (stageError || !stageData) {
        console.error('StageContext: 스테이지 데이터 로드 실패:', stageError);
        throw new Error('스테이지 데이터를 불러올 수 없습니다.');
      }
      
      // 클리어한 스테이지 목록 로드
      const { data: clearedStages } = await supabase
        .from('user_cleared_stages')
        .select('stage_id')
        .eq('user_id', user.id);

      // 데이터 변환 및 상태 업데이트
      const mappedStage: Stage = {
        id: stageData.id,
        name: stageData.name,
        regionId: stageData.region_id,
        worldId: stageData.world_id,
        sequence: stageData.sequence,
        nextStageId: stageData.next_stage_id,
        isBossStage: stageData.is_boss_stage,
        bossMonster: stageData.boss_monster_id,
        normalMonsters: stageData.normal_monsters || [],
        requiredMonsterCount: stageData.required_monster_count || 10,
        backgroundUrl: stageData.background_url,
        requiredPower: stageData.required_power,
        description: stageData.description,
        goldReward: stageData.gold_reward,
        expReward: stageData.exp_reward,
        itemDropRate: stageData.item_drop_rate
      };

      // 스테이지가 변경되었는지 확인
      const isStageChanged = stageProgress.currentStageId !== currentStageId;
      
      // 스테이지 변경 시 몬스터 카운트 초기화, 그렇지 않으면 유지
      const newKilledMonsterCount = isStageChanged ? 0 : stageProgress.killedMonsterCount;
      
      const progress: StageProgress = {
        currentStageId: currentStageId,
        killedMonsterCount: newKilledMonsterCount,
        isBossAvailable: newKilledMonsterCount >= mappedStage.requiredMonsterCount,
        isBossBattle: isStageChanged ? false : stageProgress.isBossBattle,
        isCleared: clearedStages?.some(item => Number(item.stage_id) === currentStageId) || false,
        clearedStages: clearedStages?.map(item => Number(item.stage_id)) || [],
        requiredKillCount: mappedStage.requiredMonsterCount
      };

      console.log('StageContext: 스테이지 데이터 업데이트 완료:', { 
        스테이지: mappedStage.name, 
        진행상황: progress,
        스테이지변경: isStageChanged 
      });

      setCurrentStage(mappedStage);
      setStageProgress(prev => ({
        ...prev,
        ...progress
      }));

      return true; // 성공적으로 데이터를 로드했음을 나타냄
    } catch (error) {
      console.error('StageContext: 스테이지 데이터 로드 실패:', error);
      return false; // 데이터 로드 실패를 나타냄
    } finally {
      setIsLoading(false);
      console.log('StageContext: 스테이지 데이터 로드 완료');
    }
  }, [supabase, stageProgress.currentStageId, stageProgress.killedMonsterCount, stageProgress.isBossBattle]);

  // 컴포넌트 마운트 시 초기 데이터 로드
  useEffect(() => {
    if (!initialStage) {
      fetchStageData();
    }
  }, [fetchStageData, initialStage]);

  // 몬스터 처치 카운트 증가
  const incrementKilledMonsterCount = () => {
    if (!currentStage) return;
    
    // 진행도 업데이트
    const newCount = stageProgress.killedMonsterCount + 1;
    
    // 목표 도달 여부 확인
    const requiredKills = currentStage.requiredMonsterCount || 10;
    const isBossAvailable = newCount >= requiredKills;
    
    setStageProgress(prev => ({
      ...prev,
      killedMonsterCount: newCount,
      isBossAvailable: isBossAvailable
    }));
  };

  // 보스 전투 상태 설정
  const setBossBattleState = (isBossBattle: boolean) => {
    setStageProgress(prev => ({
      ...prev,
      isBossBattle
    }));
  };

  // 스테이지 완료 처리
  const completeStage = async (isBossClear: boolean): Promise<ClearStageResult> => {
    if (!currentStage) {
      return { success: false, message: '현재 스테이지 정보가 없습니다.' };
    }

    // 보스 클리어가 아닌데 목표 처치 수를 달성하지 못했다면 실패
    const requiredKills = currentStage.requiredMonsterCount || 10;
    if (!isBossClear && stageProgress.killedMonsterCount < requiredKills) {
      return { 
        success: false, 
        message: `목표 처치 수(${requiredKills})를 달성하지 못했습니다.` 
      };
    }

    try {
      // 서버에 스테이지 클리어 요청
      const stageData: ClearStageData = {
        stageId: currentStage.id,
        isBossClear
      };
      
      console.log('스테이지 클리어 요청:', stageData);
      
      const result = await clearStage(stageData);
      
      console.log('스테이지 클리어 응답:', result);
      
      if (result.success) {
        // 클리어 성공 시 상태 업데이트
        setStageProgress(prev => ({
          ...prev,
          currentStageId: result.nextStageId || prev.currentStageId,
          killedMonsterCount: 0,
          isBossAvailable: false,
          isBossBattle: false,
          isCleared: true,
          clearedStages: [...prev.clearedStages, currentStage.id]
        }));
        
        // 스테이지 데이터 다시 로드
        setTimeout(() => {
          fetchStageData();
        }, 1000);
      }
      
      return result;
    } catch (error) {
      console.error('스테이지 클리어 오류:', error);
      return { 
        success: false, 
        message: '스테이지 클리어 처리 중 오류가 발생했습니다.' 
      };
    }
  };

  // Context 값 구성
  const value = {
    currentStage,
    stageProgress,
    isLoading,
    fetchStageData,
    incrementKilledMonsterCount,
    setBossBattleState,
    completeStage
  };

  return (
    <StageContext.Provider value={value}>
      {children}
    </StageContext.Provider>
  );
} 