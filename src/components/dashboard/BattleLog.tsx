/**
 * 전투 로그 컴포넌트
 * 
 * 전투를 통해 획득한 재화(골드, 경험치) 및 아이템을 실시간으로 표시하는 로그 컴포넌트입니다.
 * 스크롤 가능한 영역으로 구현되어 지속적인 로그 표시가 가능합니다.
 */

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

// 로그 아이템 타입 정의
export interface LogItem {
  id: string; // 고유 ID (타임스탬프 등)
  type: 'gold' | 'exp' | 'item' | 'battle'; // 로그 타입 (battle 추가)
  message: string; // 표시할 메시지
  value?: number; // 골드, 경험치 등의 값
  itemRarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'; // 아이템 등급
  timestamp: number | Date; // 로그 생성 시간 (Date 객체 지원 추가)
}

interface BattleLogProps {
  logs: LogItem[];
  maxLogCount?: number; // 최대 표시할 로그 수 (기본값: 50)
  height?: string; // 로그 영역 높이 (기본값: 300px)
  autoScroll?: boolean; // 자동 스크롤 활성화 여부 (기본값: true)
}

export function BattleLog({ 
  logs, 
  maxLogCount = 50, 
  height = '300px',
  autoScroll = true 
}: BattleLogProps) {
  // 스크롤 영역 참조
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // 새 로그 항목이 추가될 때 스크롤 영역을 최하단으로 이동
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      const scrollContainer = scrollRef.current;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [logs, autoScroll]);
  
  // 등급에 따른 텍스트 색상 클래스 반환
  const getRarityColorClass = (rarity?: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-500';
      case 'uncommon': return 'text-green-600';
      case 'rare': return 'text-blue-600';
      case 'epic': return 'text-purple-600';
      case 'legendary': return 'text-orange-500';
      case 'mythic': return 'text-red-600';
      default: return 'text-gray-700';
    }
  };
  
  // 로그 타입에 따른 아이콘 반환
  const getLogIcon = (type: string) => {
    switch (type) {
      case 'gold': return '💰';
      case 'exp': return '✨';
      case 'item': return '🎁';
      case 'battle': return '⚔️';
      default: return '📝';
    }
  };
  
  // 최신 로그를 위로 표시하기 위해 배열 복사 및 정렬
  const displayLogs = [...logs]
    .sort((a, b) => {
      // timestamp가 Date 객체인 경우 처리
      const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : a.timestamp;
      const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : b.timestamp;
      return timeB - timeA; // 최신 순으로 정렬
    })
    .slice(0, maxLogCount); // 최대 표시 수 제한
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="text-sm font-medium mb-2">전투 로그</h3>
      
      <ScrollArea className={`h-[${height}]`} ref={scrollRef}>
        <div className="space-y-2 pb-2">
          {displayLogs.map((log) => (
            <div 
              key={log.id} 
              className="text-xs px-2 py-1.5 border-l-2 rounded bg-gray-50 flex items-start gap-2"
              style={{ borderLeftColor: log.type === 'item' ? getRarityColorClass(log.itemRarity).split('-')[1] : 'gray' }}
            >
              <span className="mt-0.5">{getLogIcon(log.type)}</span>
              <div>
                <span className={log.type === 'item' ? getRarityColorClass(log.itemRarity) : 'text-gray-800'}>
                  {log.message}
                </span>
                <div className="text-gray-400 text-[10px]">
                  {new Date(log.timestamp instanceof Date ? log.timestamp.getTime() : log.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          
          {displayLogs.length === 0 && (
            <div className="text-xs text-gray-400 italic text-center py-4">
              아직 전투 로그가 없습니다.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
} 