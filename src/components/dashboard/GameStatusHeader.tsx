/**
 * 게임 상태 헤더 컴포넌트
 * 
 * 대시보드 상단에 표시되는 캐릭터 레벨, 경험치, 골드 등 
 * 주요 재화와 상태를 표시하는 헤더입니다.
 */

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useEffect, useState } from 'react';
import { Coins } from 'lucide-react';

interface GameStatusHeaderProps {
  level: number;
  currentExp: number;
  nextLevelExp: number;
  characterName?: string;
  jobName: string;
  gold: number; // 골드 값 추가
  onGoldChange?: (newGold: number) => void; // 골드 변경 콜백 추가
}

export function GameStatusHeader({ 
  level, 
  currentExp, 
  nextLevelExp,
  characterName,
  jobName,
  gold,
  onGoldChange
}: GameStatusHeaderProps) {
  // 경험치 진행률 계산 (0-100%)
  const expPercentage = Math.min(Math.floor((currentExp / nextLevelExp) * 100), 100);
  
  // 표시할 골드 상태 (애니메이션 효과용)
  const [displayGold, setDisplayGold] = useState(gold);
  
  // 이전 골드 값 (변화 감지용)
  const [prevGold, setPrevGold] = useState(gold);
  
  // 골드 애니메이션 상태
  const [isGoldAnimating, setIsGoldAnimating] = useState(false);
  
  // 골드 값 변경 시 애니메이션 효과 적용
  useEffect(() => {
    if (gold !== prevGold) {
      // 골드 증가 시 애니메이션 활성화
      setIsGoldAnimating(true);
      
      // 이전 값에서 새 값으로 애니메이션 처리
      const diff = gold - prevGold;
      const steps = 20; // 애니메이션 단계 수
      const stepSize = diff / steps;
      let currentStep = 0;
      
      const interval = setInterval(() => {
        if (currentStep < steps) {
          currentStep++;
          setDisplayGold(prevValue => Math.round(prevValue + stepSize));
        } else {
          // 애니메이션 종료 시 정확한 최종 값 설정
          setDisplayGold(gold);
          setIsGoldAnimating(false);
          clearInterval(interval);
        }
      }, 25); // 총 애니메이션 시간: 약 0.5초
      
      setPrevGold(gold);
      
      return () => clearInterval(interval);
    }
  }, [gold, prevGold]);
  
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-white rounded-lg shadow-sm mb-6">
      <div className="flex items-center gap-3 mb-2 md:mb-0">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
          {/* 캐릭터 아이콘 또는 이미지 */}
          <span className="text-lg">🧙</span>
        </div>
        
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">
              {characterName || jobName}
            </h2>
            <Badge className="text-xs" variant="info">
              Lv. {level}
            </Badge>
          </div>
          <p className="text-xs text-gray-500">{jobName}</p>
        </div>
      </div>
      
      {/* 골드(재화) 표시 영역 */}
      <div className="flex items-center gap-2 mb-2 md:mb-0">
        <Coins className="h-4 w-4 text-yellow-500" />
        <span className={`font-semibold ${isGoldAnimating ? 'text-green-600' : ''}`} data-testid="gold-display">
          {displayGold.toLocaleString()}
        </span>
      </div>
      
      <div className="w-full md:w-1/3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>EXP</span>
          <span>{currentExp.toLocaleString()} / {nextLevelExp.toLocaleString()}</span>
        </div>
        <Progress value={expPercentage} className="h-2" />
      </div>
    </div>
  );
}