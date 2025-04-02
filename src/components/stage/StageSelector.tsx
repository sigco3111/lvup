/**
 * 스테이지 선택기 컴포넌트
 * 
 * 사용자가 현재 진행 중인 스테이지 확인 및 보스 도전 기능을 제공합니다.
 */

import React, { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useStage } from '@/components/stage/StageContext';

/**
 * 스테이지 선택기 컴포넌트
 * 
 * 현재 진행 중인 스테이지의 정보와 진행 상황을 표시합니다.
 */
export default function StageSelector() {
  const { 
    currentStage, 
    stageProgress, 
    fetchStageData, 
    setBossBattleState,
    isLoading
  } = useStage();
  
  // 컴포넌트 마운트 시 스테이지 데이터 로드
  useEffect(() => {
    fetchStageData();
  }, [fetchStageData]);
  
  // 진행률 계산
  const calculateProgress = () => {
    if (!stageProgress || !currentStage) return 0;
    const { killedMonsterCount, requiredKillCount } = stageProgress;
    return Math.min(Math.floor((killedMonsterCount / requiredKillCount) * 100), 100);
  };
  
  // 로딩 중 표시
  if (isLoading) {
    return (
      <Card className="p-4 shadow-md">
        <div className="h-32 flex items-center justify-center">
          <p className="text-gray-500">스테이지 정보를 불러오는 중...</p>
        </div>
      </Card>
    );
  }
  
  // 스테이지 정보가 없는 경우
  if (!currentStage) {
    return (
      <Card className="p-4 shadow-md">
        <div className="h-32 flex items-center justify-center">
          <p className="text-gray-500">스테이지 정보가 없습니다.</p>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="p-4 shadow-md">
      <h2 className="text-lg font-semibold mb-3">현재 스테이지</h2>
      
      {/* 스테이지 정보 */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h3 className="font-medium text-md">{currentStage.name}</h3>
            <p className="text-sm text-gray-500">{currentStage.description}</p>
          </div>
          <div className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {currentStage.isBossStage ? '보스 스테이지' : '일반 스테이지'}
          </div>
        </div>
        
        {/* 스테이지 진행 상황 */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>진행도</span>
            <span>
              {stageProgress.killedMonsterCount} / {stageProgress.requiredKillCount} 처치
            </span>
          </div>
          <Progress 
            value={calculateProgress()} 
            className="h-2 bg-gray-200" 
          />
        </div>
        
        {/* 보스 도전 버튼 */}
        {currentStage.isBossStage && stageProgress.isBossAvailable && !stageProgress.isBossBattle && (
          <Button 
            onClick={() => setBossBattleState(true)}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            보스 도전하기
          </Button>
        )}
        
        {/* 보스 전투 중인 경우 */}
        {stageProgress.isBossBattle && (
          <div className="bg-red-100 border border-red-300 text-red-600 p-2 rounded text-center">
            보스 전투가 진행 중입니다!
          </div>
        )}
        
        {/* 보스 처치 완료된 경우 */}
        {currentStage.isBossStage && stageProgress.isCleared && (
          <div className="bg-green-100 border border-green-300 text-green-600 p-2 rounded text-center">
            이 스테이지의 보스를 처치했습니다!
          </div>
        )}
      </div>
      
      {/* 스테이지 보상 정보 */}
      <div className="border-t pt-3">
        <h4 className="font-medium text-sm mb-2">보상</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-yellow-500 mr-1">💰</span> 
            <span>{currentStage.goldReward || '5-15'} 골드</span>
          </div>
          <div>
            <span className="text-blue-500 mr-1">✨</span>
            <span>{currentStage.expReward || '10-30'} 경험치</span>
          </div>
          {currentStage.itemDropRate && (
            <div className="col-span-2">
              <span className="text-purple-500 mr-1">🎁</span>
              <span>아이템 드롭 확률: {currentStage.itemDropRate}%</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
} 