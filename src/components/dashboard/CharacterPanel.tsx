/**
 * 캐릭터 패널 컴포넌트
 * 
 * 캐릭터의 기본 정보와 능력치를 카드 형태로 표시합니다.
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

interface CharacterPanelProps {
  character: any;
}

/**
 * 캐릭터 패널 컴포넌트
 * 
 * 캐릭터의 이름, 레벨, 직업, 공격력, 방어력 등의 정보를 표시합니다.
 */
export default function CharacterPanel({ character }: CharacterPanelProps) {
  if (!character) {
    return <Card className="p-4 shadow-md">캐릭터 정보를 불러오는 중...</Card>;
  }
  
  return (
    <Card className="p-4 shadow-md">
      <h2 className="text-lg font-semibold mb-3">캐릭터 정보</h2>
      
      {/* 캐릭터 기본 정보 */}
      <div className="mb-4">
        <div className="flex items-center mb-2">
          <span className="text-blue-500 mr-2">👤</span>
          <div>
            <p className="text-sm text-gray-500">이름</p>
            <p className="font-medium">{character.name}</p>
          </div>
        </div>
        
        <div className="flex items-center mb-2">
          <span className="text-purple-500 mr-2">🏆</span>
          <div>
            <p className="text-sm text-gray-500">레벨</p>
            <p className="font-medium">{character.level}</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <span className="text-green-500 mr-2">🎭</span>
          <div>
            <p className="text-sm text-gray-500">직업</p>
            <p className="font-medium">{character.job_name || '모험가'}</p>
          </div>
        </div>
      </div>
      
      {/* 캐릭터 능력치 */}
      <h3 className="text-md font-medium mb-2">능력치</h3>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center">
          <span className="mr-2">⚔️</span>
          <div>
            <p className="text-xs text-gray-500">물리 공격력</p>
            <p className="font-medium">{character.physical_attack}</p>
          </div>
        </div>
        <div className="flex items-center">
          <span className="mr-2">🔥</span>
          <div>
            <p className="text-xs text-gray-500">마법 공격력</p>
            <p className="font-medium">{character.magical_attack}</p>
          </div>
        </div>
        <div className="flex items-center">
          <span className="mr-2">🛡️</span>
          <div>
            <p className="text-xs text-gray-500">물리 방어력</p>
            <p className="font-medium">{character.physical_defense}</p>
          </div>
        </div>
        <div className="flex items-center">
          <span className="mr-2">✨</span>
          <div>
            <p className="text-xs text-gray-500">마법 방어력</p>
            <p className="font-medium">{character.magical_defense}</p>
          </div>
        </div>
      </div>
      
      {/* 캐릭터 상세 페이지 링크 */}
      <div className="mt-3">
        <Link href="/character" className="text-sm text-blue-600 hover:underline">
          캐릭터 상세 정보 보기 →
        </Link>
      </div>
    </Card>
  );
} 