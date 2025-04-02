/**
 * 현재 스테이지 정보를 표시하는 컴포넌트
 * 
 * 월드, 지역, 스테이지 번호 및 진행도를 표시합니다.
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useStage } from './StageContext';

export default function StageInfo() {
  const { currentStage, stageProgress, isLoading } = useStage();

  // 로딩 중이거나 스테이지 정보가 없는 경우 로딩 표시
  if (isLoading || !currentStage) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">스테이지 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-16 flex items-center justify-center">
            <p className="text-gray-500">스테이지 정보 로딩 중...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 보스 스테이지 여부
  const isBossStage = currentStage.isBossStage;
  
  // 진행도 계산 (백분율)
  const progressPercentage = isBossStage
    ? 100 // 보스 스테이지는 진행도 100%로 표시
    : Math.min(
        Math.round((stageProgress.killedMonsterCount / currentStage.requiredMonsterCount) * 100),
        100
      );

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>현재 스테이지</span>
          {isBossStage && (
            <Badge variant="destructive" className="ml-2">
              보스
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 스테이지 위치 정보 */}
          <div className="text-lg font-medium">
            {`${currentStage.worldId} - ${currentStage.regionId} - 스테이지 ${currentStage.id}`}
          </div>
          
          {/* 스테이지 진행도 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>진행도</span>
              {!isBossStage && (
                <span>
                  {stageProgress.killedMonsterCount} / {currentStage.requiredMonsterCount}
                </span>
              )}
              {isBossStage && <span>보스 처치</span>}
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
          
          {/* 권장 전투력 표시 (존재하는 경우) */}
          {currentStage.requiredPower && (
            <div className="text-sm text-gray-500">
              권장 전투력: {currentStage.requiredPower}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 