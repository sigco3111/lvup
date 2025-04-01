/**
 * 캐릭터 시스템 관련 타입 정의
 */

// 기본 직업 정보 타입
export interface GameJob {
  id: number;
  name: string;
  description: string;
  tier: number; // 1: 기본, 2: 1차 전직, 3: 2차 전직, 4: 3차 전직
  parentJobId: number | null;
  requiredLevel: number;
  statsPerLevel: CharacterBaseStats;
  baseStats: CharacterStats;
}

// 캐릭터 기본 스탯 타입
export interface CharacterBaseStats {
  strength: number;    // 힘
  dexterity: number;   // 민첩
  intelligence: number; // 지능
  vitality: number;    // 체력
}

// 캐릭터 전체 스탯 타입 (기본 + 계산된 스탯)
export interface CharacterStats extends CharacterBaseStats {
  maxHp: number;
  maxMp: number;
  physicalAttack: number;
  magicalAttack: number;
  physicalDefense: number;
  magicalDefense: number;
  criticalRate: number;
  criticalDamage: number;
}

// 사용자 캐릭터 정보 타입
export interface UserCharacter {
  id: string;
  userId: string;
  jobId: number;
  level: number;
  experience: number;
  skillPoints: number;
  
  // 기본 스탯
  strength: number;
  dexterity: number;
  intelligence: number;
  vitality: number;
  
  // 계산된 스탯
  maxHp: number;
  maxMp: number;
  currentHp: number;
  currentMp: number;
  physicalAttack: number;
  magicalAttack: number;
  physicalDefense: number;
  magicalDefense: number;
  criticalRate: number;
  criticalDamage: number;
  
  createdAt: string;
  updatedAt: string;
}

// 레벨 요구 경험치 정보 타입
export interface GameLevelRequirement {
  level: number;
  requiredExp: number;
  statIncrease: CharacterBaseStats;
}

// 레벨업 결과 타입
export interface LevelUpResult {
  levelUp: boolean;
  levelsGained: number;
  currentLevel: number;
  currentExp: number;
  stats: CharacterStats;
  nextLevelExp: number;
  skillPoints: number;
}

// 캐릭터 생성 시 필요한 정보
export interface CreateCharacterParams {
  jobId: number;
}