/**
 * 경험치 획득 버튼 컴포넌트
 * 
 * 클라이언트 측에서 경험치를 획득하고 레벨업 효과를 표시합니다.
 */

'use client';

import { useState } from 'react';
import { gainExperienceAction } from '@/actions/character';
import { useNotification } from '@/components/common/Notifications';
import { LevelUpEffect } from '@/components/character/LevelUpEffect';
import { LevelUpResult } from '@/lib/types/character';
import { useRouter } from 'next/navigation';

interface GainExperienceButtonProps {
  currentLevel: number;
}

export function GainExperienceButton({ currentLevel }: GainExperienceButtonProps) {
  const [expAmount, setExpAmount] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(currentLevel);
  const { addNotification } = useNotification();
  const router = useRouter();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (expAmount <= 0) {
      addNotification('유효한 경험치 값을 입력해주세요.', 'warning');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await gainExperienceAction(expAmount);
      
      if (result.success && result.result) {
        const levelUpResult = result.result as LevelUpResult;
        
        // 레벨업 발생 시 효과 표시
        if (levelUpResult.levelUp) {
          setNewLevel(levelUpResult.currentLevel);
          setShowLevelUp(true);
          
          // 레벨업 알림
          addNotification(
            `레벨 업! ${levelUpResult.levelsGained > 1 ? `${levelUpResult.levelsGained}레벨 상승` : ''} (Lv.${levelUpResult.currentLevel})`, 
            'success'
          );
        } else {
          // 일반 경험치 획득 알림
          addNotification(`${expAmount} 경험치를 획득했습니다.`, 'info');
        }
        
        // 페이지 새로고침 (상태 업데이트)
        router.refresh();
      } else {
        addNotification(result.message, 'error');
      }
    } catch (error) {
      console.error('경험치 획득 오류:', error);
      addNotification('경험치 획득 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <input
          type="number"
          min="1"
          max="10000"
          value={expAmount}
          onChange={(e) => setExpAmount(parseInt(e.target.value))}
          className="border rounded px-3 py-2 w-24"
        />
        <button
          type="submit"
          disabled={isLoading}
          className={`px-4 py-2 rounded text-white ${
            isLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? '처리 중...' : '경험치 획득'}
        </button>
      </form>
      
      {/* 레벨업 효과 */}
      <LevelUpEffect 
        level={newLevel} 
        show={showLevelUp} 
        onComplete={() => setShowLevelUp(false)} 
      />
    </>
  );
}