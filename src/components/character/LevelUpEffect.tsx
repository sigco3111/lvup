/**
 * 레벨업 이펙트 컴포넌트
 * 
 * 레벨업 시 화면에 시각적 효과를 표시합니다.
 */

'use client';

import { useEffect, useState } from 'react';

interface LevelUpEffectProps {
  level: number;
  show: boolean;
  onComplete?: () => void;
}

export function LevelUpEffect({ level, show, onComplete }: LevelUpEffectProps) {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    if (show) {
      setVisible(true);
      
      // 효과 지속 시간 후 효과 숨기기
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 3000); // 3초 후 효과 종료
      
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);
  
  if (!visible) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="relative">
        {/* 가운데 레벨업 텍스트 */}
        <div className="animate-bounce text-center">
          <div className="text-5xl font-bold text-yellow-500 drop-shadow-[0_2px_8px_rgba(255,255,0,0.8)]">
            LEVEL UP!
          </div>
          <div className="text-3xl font-bold text-white mt-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            Lv. {level}
          </div>
        </div>
        
        {/* 파티클 효과 */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <div 
              key={i} 
              className="absolute rounded-full opacity-70"
              style={{
                width: `${Math.random() * 20 + 5}px`,
                height: `${Math.random() * 20 + 5}px`,
                backgroundColor: `hsl(${Math.random() * 60 + 40}, 100%, 60%)`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `particleAnimation${i % 3} ${Math.random() * 2 + 1}s linear infinite`,
              }}
            />
          ))}
        </div>
      </div>
      
      {/* 파티클 애니메이션 정의 */}
      <style jsx>{`
        @keyframes particleAnimation0 {
          0% {
            transform: translateY(0) rotate(0);
            opacity: 0.8;
          }
          100% {
            transform: translateY(-100px) rotate(360deg);
            opacity: 0;
          }
        }
        @keyframes particleAnimation1 {
          0% {
            transform: translateX(0) rotate(0);
            opacity: 0.8;
          }
          100% {
            transform: translateX(100px) rotate(360deg);
            opacity: 0;
          }
        }
        @keyframes particleAnimation2 {
          0% {
            transform: translateY(0) translateX(0) rotate(0);
            opacity: 0.8;
          }
          100% {
            transform: translateY(-80px) translateX(80px) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}