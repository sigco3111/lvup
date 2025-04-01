/**
 * 캐릭터 정보 페이지
 * 
 * 사용자 캐릭터의 상세 정보(레벨, 경험치, 스탯 등)를 표시합니다.
 */

import { redirect } from 'next/navigation';
import { getCurrentCharacter, getJobs, getLevelRequirement } from '@/lib/services/character.service';
import { LevelExpPanel } from '@/components/character/LevelExpPanel';
import { BaseStatsPanel } from '@/components/character/BaseStatsPanel';
import { CreateCharacterForm } from '@/components/character/CreateCharacterForm';
import { Card } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function CharacterPage() {
  // 현재 캐릭터 정보 조회
  const character = await getCurrentCharacter();
  
  // 캐릭터가 없는 경우 캐릭터 생성 폼 표시
  if (!character) {
    // 직업 정보 조회 (기본 직업: tier = 1)
    const jobs = await getJobs(1);
    
    return (
      <div className="container mx-auto py-8">
        <CreateCharacterForm jobs={jobs} />
      </div>
    );
  }
  
  // 캐릭터의 직업 정보 조회
  const jobs = await getJobs();
  const job = jobs.find(j => j.id === character.jobId) || {
    id: 0,
    name: '알 수 없음',
    description: '',
    tier: 1,
    parentJobId: null,
    requiredLevel: 1,
    statsPerLevel: { strength: 0, dexterity: 0, intelligence: 0, vitality: 0 },
    baseStats: {
      strength: 0, dexterity: 0, intelligence: 0, vitality: 0,
      maxHp: 0, maxMp: 0, physicalAttack: 0, magicalAttack: 0,
      physicalDefense: 0, magicalDefense: 0, criticalRate: 0, criticalDamage: 0
    }
  };
  
  // 다음 레벨 경험치 요구량 조회
  const nextLevelReq = await getLevelRequirement(character.level);
  const nextLevelExp = nextLevelReq?.requiredExp || 1000; // 기본값 설정
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8 flex items-center">
        <span className="mr-2">캐릭터 정보</span>
        <span className="text-sm text-gray-500">({job.name})</span>
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* 왼쪽 사이드바 - 캐릭터 정보 */}
        <div className="md:col-span-1">
          <Card className="p-4 shadow-md mb-4">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                {/* 직업별 캐릭터 아이콘 */}
                <span className="text-4xl">
                  {job.name === '전사' ? '⚔️' : 
                   job.name === '마법사' ? '🧙' : 
                   job.name === '궁수' ? '🏹' : 
                   job.name === '도적' ? '🗡️' : '👤'}
                </span>
              </div>
              <h2 className="text-xl font-bold">{job.name}</h2>
              <p className="text-sm text-gray-500 mb-4">{job.description}</p>
              
              {/* 스킬 포인트 표시 */}
              {character.skillPoints > 0 && (
                <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                  스킬 포인트: {character.skillPoints}
                </div>
              )}
            </div>
          </Card>
          
          {/* 레벨 및 경험치 정보 */}
          <LevelExpPanel 
            level={character.level}
            currentExp={character.experience}
            nextLevelExp={nextLevelExp}
          />
        </div>
        
        {/* 오른쪽 메인 콘텐츠 - 스탯 정보 */}
        <div className="md:col-span-3">
          <BaseStatsPanel 
            baseStats={{
              strength: character.strength,
              dexterity: character.dexterity,
              intelligence: character.intelligence,
              vitality: character.vitality
            }}
            derivedStats={{
              maxHp: character.maxHp,
              maxMp: character.maxMp,
              physicalAttack: character.physicalAttack,
              magicalAttack: character.magicalAttack,
              physicalDefense: character.physicalDefense,
              magicalDefense: character.magicalDefense,
              criticalRate: character.criticalRate,
              criticalDamage: character.criticalDamage
            }}
          />
        </div>
      </div>
    </div>
  );
}