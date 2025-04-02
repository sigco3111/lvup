/**
 * 게임 상태바 컴포넌트
 * 
 * 플레이어의 레벨, 경험치, 골드 정보를 표시하고 새로고침 기능을 제공합니다.
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ReloadIcon } from '@radix-ui/react-icons';

interface StatusBarProps {
  gold: number;
  exp: number;
  level: number;
  maxExp: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

/**
 * 상태바 컴포넌트
 * 
 * 캐릭터의 레벨, 경험치, 골드 정보를 상단에 표시합니다.
 */
export function StatusBar({ 
  gold, 
  exp, 
  level, 
  maxExp, 
  onRefresh, 
  isRefreshing = false 
}: StatusBarProps) {
  // 경험치 퍼센트 계산
  const expPercent = Math.min(Math.round((exp / maxExp) * 100), 100);
  
  return (
    <Card className="p-4 shadow-md">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
        {/* 레벨과 경험치 정보 */}
        <div className="flex-1 mb-3 md:mb-0 mr-4 w-full md:w-auto">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">
              레벨 {level}
            </span>
            <span className="text-sm text-gray-500">
              {exp} / {maxExp} EXP
            </span>
          </div>
          <Progress 
            value={expPercent} 
            className="h-2 w-full bg-gray-200"
          />
        </div>
        
        {/* 골드 정보 */}
        <div className="flex items-center mr-4 mb-3 md:mb-0">
          <span className="text-yellow-500 mr-1">💰</span>
          <span className="font-medium">{gold.toLocaleString()}</span>
        </div>
        
        {/* 새로고침 버튼 */}
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="ml-auto"
          >
            {isRefreshing ? (
              <>
                <ReloadIcon className="h-4 w-4 mr-1 animate-spin" />
                갱신 중...
              </>
            ) : (
              <>
                <ReloadIcon className="h-4 w-4 mr-1" />
                새로고침
              </>
            )}
          </Button>
        )}
      </div>
    </Card>
  );
} 