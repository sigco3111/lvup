/**
 * 보스 도전 버튼 컴포넌트
 * 
 * 현재 스테이지가 보스 스테이지이고, 도전 조건을 만족했을 때 활성화되는 버튼입니다.
 * 클릭 시 보스 전투 시작을 트리거합니다.
 */

'use client';

import { Button } from '@/components/ui/button';
import { useStage } from './StageContext';
import { useState, useEffect } from 'react';

interface BossChallengeButtonProps {
  onChallenge?: () => void; // 보스 도전 시작 콜백
  onRefreshStage?: () => void; // 스테이지 새로고침 콜백
  disabled?: boolean; // 버튼 비활성화 여부 (직접 제어 시)
  isBossStage?: boolean; // 보스 스테이지 여부 (직접 제어 시)
}

export default function BossChallengeButton({ 
  onChallenge,
  onRefreshStage,
  disabled: forcedDisabled,
  isBossStage: forcedIsBossStage 
}: BossChallengeButtonProps) {
  const { currentStage, stageProgress, setBossBattleState, completeStage } = useStage();
  const [isLoading, setIsLoading] = useState(false);
  const [clearStageTimer, setClearStageTimer] = useState<NodeJS.Timeout | null>(null);
  
  // 컴포넌트 언마운트 시 타이머 제거
  useEffect(() => {
    return () => {
      if (clearStageTimer) {
        clearTimeout(clearStageTimer);
      }
    };
  }, [clearStageTimer]);
  
  // 보스 도전 가능 여부 계산
  // 1. 현재 스테이지가 보스 스테이지여야 함
  // 2. 보스 전투 중이 아니어야 함
  // 3. 보스 도전 가능 상태여야 함(일반 몬스터 목표 처치 수 달성)
  const isCurrentStageBoss = forcedIsBossStage !== undefined 
    ? forcedIsBossStage 
    : currentStage?.isBossStage;
    
  const canChallengeBoss = 
    isCurrentStageBoss && 
    !stageProgress.isBossBattle && 
    stageProgress.isBossAvailable;
  
  // 최종 버튼 활성화 상태 계산 (외부 제어 + 내부 상태)
  const isButtonDisabled = forcedDisabled !== undefined 
    ? forcedDisabled 
    : !canChallengeBoss || isLoading;
  
  // 보스 도전 버튼 클릭 핸들러
  const handleChallengeBoss = async () => {
    if (!canChallengeBoss) return;
    
    setIsLoading(true);
    
    try {
      // 보스 전투 상태로 변경
      setBossBattleState(true);
      
      // 외부 콜백 호출 (BattleScene 등에서 보스 전투 시작 처리)
      if (onChallenge) {
        onChallenge();
      }
      
      // 보스 전투 후 10초 뒤 자동으로 스테이지 클리어 처리
      const timer = setTimeout(async () => {
        console.log('보스 클리어 타이머 실행');
        try {
          const result = await completeStage(true);
          
          if (result.success) {
            console.log('보스 클리어 성공:', result);
            // 성공 알림 표시 로직 추가
            if (onRefreshStage) {
              onRefreshStage();
            }
          } else {
            console.error('보스 클리어 실패:', result.message);
            // 실패 알림 표시 로직 추가
          }
        } catch (error) {
          console.error('보스 클리어 오류:', error);
        }
      }, 10000);
      
      setClearStageTimer(timer);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 보스 도전 불가능 이유 메시지
  const getBossChallengeMessage = () => {
    if (!currentStage) return '스테이지 정보 없음';
    if (!isCurrentStageBoss) return '일반 스테이지';
    if (stageProgress.isBossBattle) return '보스 전투 중';
    if (!stageProgress.isBossAvailable) {
      const remaining = currentStage.requiredMonsterCount - stageProgress.killedMonsterCount;
      return `보스 출현까지 ${remaining}마리`;
    }
    return '보스 도전 가능';
  };
  
  return (
    <div className="w-full">
      <Button
        className="w-full"
        variant={canChallengeBoss ? "destructive" : "outline"}
        disabled={isButtonDisabled}
        onClick={handleChallengeBoss}
      >
        {isLoading ? '준비 중...' : canChallengeBoss ? '보스 도전' : getBossChallengeMessage()}
      </Button>
    </div>
  );
} 