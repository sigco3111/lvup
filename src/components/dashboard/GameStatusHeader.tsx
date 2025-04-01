/**
 * 게임 상태 헤더 컴포넌트
 * 
 * 대시보드 상단에 표시되는 캐릭터 레벨 및 경험치 상태 헤더입니다.
 */

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface GameStatusHeaderProps {
  level: number;
  currentExp: number;
  nextLevelExp: number;
  characterName?: string;
  jobName: string;
}

export function GameStatusHeader({ 
  level, 
  currentExp, 
  nextLevelExp,
  characterName,
  jobName
}: GameStatusHeaderProps) {
  // 경험치 진행률 계산 (0-100%)
  const expPercentage = Math.min(Math.floor((currentExp / nextLevelExp) * 100), 100);
  
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