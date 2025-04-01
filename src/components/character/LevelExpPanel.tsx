/**
 * 레벨 및 경험치 패널 컴포넌트
 * 
 * 캐릭터의 현재 레벨, 경험치, 다음 레벨까지의 진행도를 표시합니다.
 */

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';

interface LevelExpPanelProps {
  level: number;
  currentExp: number;
  nextLevelExp: number;
}

export function LevelExpPanel({ level, currentExp, nextLevelExp }: LevelExpPanelProps) {
  // 경험치 진행률 계산 (0-100%)
  const expPercentage = Math.min(Math.floor((currentExp / nextLevelExp) * 100), 100);
  
  return (
    <Card className="p-4 shadow-md">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">레벨</span>
          <Badge className="text-sm px-3 py-1" variant="info">
            Lv. {level}
          </Badge>
        </div>
        <span className="text-xs text-gray-500">
          {currentExp.toLocaleString()} / {nextLevelExp.toLocaleString()} EXP
        </span>
      </div>
      
      <div className="w-full">
        <Progress 
          value={expPercentage} 
          className="h-2 bg-gray-200"
          // 경험치 바 색상 커스텀
          style={{
            '--tw-bg-opacity': 1,
            backgroundColor: 'rgba(209, 213, 219, var(--tw-bg-opacity))'
          } as React.CSSProperties}
        />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500">경험치</span>
          <span className="text-xs text-gray-500">{expPercentage}%</span>
        </div>
      </div>
    </Card>
  );
}