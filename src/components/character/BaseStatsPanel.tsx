/**
 * 기본 스탯 패널 컴포넌트
 * 
 * 캐릭터의 기본 스탯(힘, 민첩, 지능, 체력)과 이로부터 계산된 2차 스탯을 표시합니다.
 */

import { Card } from '@/components/ui/card';
import { CharacterBaseStats, CharacterStats } from '@/lib/types/character';

interface BaseStatsPanelProps {
  baseStats: CharacterBaseStats;
  derivedStats: {
    maxHp: number;
    maxMp: number;
    physicalAttack: number;
    magicalAttack: number;
    physicalDefense: number;
    magicalDefense: number;
    criticalRate: number;
    criticalDamage: number;
  };
}

// 스탯 아이콘 매핑
const statIcons = {
  strength: '💪',
  dexterity: '🏃',
  intelligence: '🧠',
  vitality: '❤️',
  maxHp: '♥️',
  maxMp: '🔮',
  physicalAttack: '⚔️',
  magicalAttack: '🔥',
  physicalDefense: '🛡️',
  magicalDefense: '✨',
  criticalRate: '🎯',
  criticalDamage: '💥',
};

// 스탯 한글 이름 매핑
const statNames = {
  strength: '힘',
  dexterity: '민첩',
  intelligence: '지능',
  vitality: '체력',
  maxHp: '최대 HP',
  maxMp: '최대 MP',
  physicalAttack: '물리 공격력',
  magicalAttack: '마법 공격력',
  physicalDefense: '물리 방어력',
  magicalDefense: '마법 방어력',
  criticalRate: '치명타 확률',
  criticalDamage: '치명타 데미지',
};

// 스탯 설명 매핑 (툴팁용)
const statDescriptions = {
  strength: '물리 공격력과 물리 방어력에 영향을 줍니다.',
  dexterity: '회피율과 물리 공격력에 영향을 줍니다.',
  intelligence: '마법 공격력과 마법 방어력, MP에 영향을 줍니다.',
  vitality: 'HP와 물리/마법 방어력에 영향을 줍니다.',
  maxHp: '캐릭터가 받을 수 있는 최대 피해량입니다.',
  maxMp: '스킬 사용에 필요한 마나의 최대치입니다.',
  physicalAttack: '물리 공격 시 기본 데미지입니다.',
  magicalAttack: '마법 공격 시 기본 데미지입니다.',
  physicalDefense: '물리 공격으로부터 받는 피해를 감소시킵니다.',
  magicalDefense: '마법 공격으로부터 받는 피해를 감소시킵니다.',
  criticalRate: '치명타가 발생할 확률입니다.',
  criticalDamage: '치명타 발생 시 추가 데미지 배율입니다.',
};

export function BaseStatsPanel({ baseStats, derivedStats }: BaseStatsPanelProps) {
  // 기본 스탯과 계산된 스탯 구분하여 표시
  return (
    <div className="grid grid-cols-1 gap-4">
      <Card className="p-4 shadow-md">
        <h3 className="text-lg font-semibold mb-4">기본 스탯</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(baseStats).map(([key, value]) => (
            <div 
              key={key} 
              className="flex items-center p-2 bg-gray-50 rounded-md"
              title={statDescriptions[key as keyof typeof statDescriptions]}
            >
              <span className="mr-2 text-lg">
                {statIcons[key as keyof typeof statIcons]}
              </span>
              <div>
                <p className="text-xs text-gray-500">
                  {statNames[key as keyof typeof statNames]}
                </p>
                <p className="font-medium">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
      
      <Card className="p-4 shadow-md">
        <h3 className="text-lg font-semibold mb-4">전투 스탯</h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(derivedStats).map(([key, value]) => {
            // 치명타 확률은 퍼센트로 표시
            const displayValue = key === 'criticalRate' 
              ? `${(value * 100).toFixed(1)}%` 
              : key === 'criticalDamage' 
                ? `x${value.toFixed(1)}` 
                : value.toLocaleString();
            
            return (
              <div 
                key={key} 
                className="flex items-center p-2 bg-gray-50 rounded-md"
                title={statDescriptions[key as keyof typeof statDescriptions]}
              >
                <span className="mr-2 text-lg">
                  {statIcons[key as keyof typeof statIcons]}
                </span>
                <div>
                  <p className="text-xs text-gray-500">
                    {statNames[key as keyof typeof statNames]}
                  </p>
                  <p className="font-medium">{displayValue}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}