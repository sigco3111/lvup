/**
 * 스테이지 카드 컴포넌트
 * 
 * 현재 진행 중인 스테이지 정보를 보여주는 카드 형태의 컴포넌트입니다.
 * 스테이지 진행도, 보스 도전 버튼 등을 포함합니다.
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import BossChallengeButton from './BossChallengeButton';
import { useStage } from './StageContext';
import { cn } from '@/lib/utils';
import Image from 'next/image';

// 스테이지 카드 Props 정의
interface StageCardProps {
  className?: string;
  forceRefresh?: boolean;
  onBossChallenge?: () => void;
}

export default function StageCard({ className, forceRefresh = false, onBossChallenge }: StageCardProps) {
  // 컨텍스트에서 스테이지 정보 가져오기
  const { currentStage, stageProgress, fetchStageData, isLoading } = useStage();
  
  // 새로고침 키 상태
  const [refreshKey, setRefreshKey] = useState(0);
  
  // 새로고침 시간 추적용 ref
  const lastRefreshTime = useRef(Date.now());
  
  // 강제 새로고침 감지
  useEffect(() => {
    if (forceRefresh) {
      console.log('스테이지 카드: 강제 새로고침 요청 감지');
      handleRefresh();
    }
  }, [forceRefresh]);
  
  // 초기 마운트 시 및 새로고침 키 변경 시 데이터 로드
  useEffect(() => {
    fetchStageData();
    
    // 30초마다 자동 새로고침 설정
    const intervalId = setInterval(() => {
      // 마지막 새로고침 이후 30초가 지났는지 확인
      if (Date.now() - lastRefreshTime.current >= 30000) {
        console.log('스테이지 데이터 자동 새로고침');
        handleRefresh();
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [refreshKey, fetchStageData]);

  // 새로고침 핸들러
  const handleRefresh = () => {
    lastRefreshTime.current = Date.now();
    console.log('스테이지 데이터 새로고침 요청');
    fetchStageData();
    setRefreshKey(prev => prev + 1);
  };

  // 클리어 진행률 계산
  const calculateProgress = (): number => {
    if (!currentStage || !stageProgress) return 0;
    
    const maxMonsters = currentStage.requiredMonsterCount || 10;
    const killed = stageProgress.killedMonsterCount || 0;
    
    // 100% 이하로 제한
    return Math.min(Math.round((killed / maxMonsters) * 100), 100);
  };

  // 로딩 중 표시
  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle>스테이지 로딩 중...</CardTitle>
          <CardDescription>스테이지 정보를 불러오는 중입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={0} />
        </CardContent>
      </Card>
    );
  }

  // 스테이지가 없는 경우
  if (!currentStage) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle>스테이지 정보 없음</CardTitle>
          <CardDescription>스테이지 정보를 찾을 수 없습니다.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // 진행률
  const progress = calculateProgress();
  const isBossAvailable = stageProgress.isBossAvailable;
  
  return (
    <Card className={cn("w-full overflow-hidden", className)}>
      {/* 스테이지 배경 이미지 */}
      {currentStage.backgroundUrl && (
        <div className="relative h-32 w-full overflow-hidden">
          <Image
            src={currentStage.backgroundUrl}
            alt={currentStage.name}
            fill
            className="object-cover"
            quality={80}
            sizes="(max-width: 768px) 100vw, 768px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{currentStage.name}</CardTitle>
            <CardDescription>
              {currentStage.description || '이 스테이지에 대한 설명이 없습니다.'}
            </CardDescription>
          </div>
          
          {currentStage.isBossStage && (
            <Badge variant="destructive" className="ml-2">보스</Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* 몬스터 처치 진행률 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>클리어 진행도</span>
              <span>{stageProgress.killedMonsterCount} / {currentStage.requiredMonsterCount || 10} 처치</span>
            </div>
            <Progress value={progress} />
          </div>
          
          {/* 스테이지 정보 */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">권장 전투력:</span>
              <span className="ml-1 font-medium">{currentStage.requiredPower || '없음'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">경험치:</span>
              <span className="ml-1 font-medium">{currentStage.expReward || 0}</span>
            </div>
            <div>
              <span className="text-muted-foreground">골드:</span>
              <span className="ml-1 font-medium">{currentStage.goldReward || 0}</span>
            </div>
            <div>
              <span className="text-muted-foreground">아이템 드롭율:</span>
              <span className="ml-1 font-medium">{currentStage.itemDropRate || 0}%</span>
            </div>
          </div>
        </div>
      </CardContent>
      
      <Separator />
      
      <CardFooter className="pt-4 pb-4">
        <div className="w-full">
          <BossChallengeButton 
            disabled={!isBossAvailable} 
            isBossStage={currentStage.isBossStage}
            onRefreshStage={handleRefresh}
            onChallenge={onBossChallenge}
          />
          
          <button
            onClick={handleRefresh}
            className="w-full mt-2 text-xs text-center text-blue-500 hover:text-blue-700"
          >
            🔄 스테이지 정보 새로고침
          </button>
        </div>
      </CardFooter>
    </Card>
  );
}