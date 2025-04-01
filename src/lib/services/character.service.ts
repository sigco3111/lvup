/**
 * 캐릭터 관련 서비스 함수
 * 
 * 캐릭터 정보 조회, 생성, 경험치 획득 등의 기능을 제공합니다.
 */

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { 
  UserCharacter, 
  GameJob, 
  GameLevelRequirement, 
  LevelUpResult, 
  CreateCharacterParams 
} from '@/lib/types/character';
import { redirect } from 'next/navigation';

/**
 * 현재 사용자의 캐릭터 정보를 조회
 * 
 * @returns 사용자 캐릭터 정보 또는 null (캐릭터가 없는 경우)
 */
export async function getCurrentCharacter(): Promise<UserCharacter | null> {
  const supabase = await createClient();
  
  // 현재 사용자 확인
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
    redirect('/login');
  }
  
  // 캐릭터 정보 조회
  const { data, error } = await supabase
    .from('user_characters')
    .select('*')
    .eq('user_id', user.id)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  // 데이터베이스의 스네이크 케이스를 캐멀 케이스로 변환
  return {
    id: data.id,
    userId: data.user_id,
    jobId: data.job_id,
    level: data.level,
    experience: data.experience,
    skillPoints: data.skill_points,
    
    // 기본 스탯
    strength: data.strength,
    dexterity: data.dexterity,
    intelligence: data.intelligence,
    vitality: data.vitality,
    
    // 계산된 스탯
    maxHp: data.max_hp,
    maxMp: data.max_mp,
    currentHp: data.current_hp,
    currentMp: data.current_mp,
    physicalAttack: data.physical_attack,
    magicalAttack: data.magical_attack,
    physicalDefense: data.physical_defense,
    magicalDefense: data.magical_defense,
    criticalRate: data.critical_rate,
    criticalDamage: data.critical_damage,
    
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

/**
 * 모든 기본 직업 정보 조회
 * 
 * @param tier 직업 티어 (기본값: 1 - 기본 직업)
 * @returns 직업 정보 배열
 */
export async function getJobs(tier: number = 1): Promise<GameJob[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('game_jobs')
    .select('*')
    .eq('tier', tier);
  
  if (error || !data) {
    return [];
  }
  
  // 데이터베이스의 스네이크 케이스를 캐멀 케이스로 변환
  return data.map(job => ({
    id: job.id,
    name: job.name,
    description: job.description || '',
    tier: job.tier,
    parentJobId: job.parent_job_id,
    requiredLevel: job.required_level,
    statsPerLevel: {
      strength: job.stats_per_level.strength,
      dexterity: job.stats_per_level.dexterity,
      intelligence: job.stats_per_level.intelligence,
      vitality: job.stats_per_level.vitality
    },
    baseStats: {
      strength: job.base_stats.strength,
      dexterity: job.base_stats.dexterity,
      intelligence: job.base_stats.intelligence,
      vitality: job.base_stats.vitality,
      maxHp: job.base_stats.hp,
      maxMp: job.base_stats.mp,
      physicalAttack: 0, // 계산 필요
      magicalAttack: 0,  // 계산 필요
      physicalDefense: 0, // 계산 필요
      magicalDefense: 0,  // 계산 필요
      criticalRate: 0.05,
      criticalDamage: 1.5
    }
  }));
}

/**
 * 특정 레벨의 요구 경험치 정보 조회
 * 
 * @param level 조회할 레벨
 * @returns 레벨 요구사항 정보
 */
export async function getLevelRequirement(level: number): Promise<GameLevelRequirement | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('game_level_requirements')
    .select('*')
    .eq('level', level)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return {
    level: data.level,
    requiredExp: data.required_exp,
    statIncrease: {
      strength: data.stat_increase.strength,
      dexterity: data.stat_increase.dexterity,
      intelligence: data.stat_increase.intelligence,
      vitality: data.stat_increase.vitality
    }
  };
}

/**
 * 새 캐릭터 생성
 * 
 * @param params 캐릭터 생성 파라미터
 * @returns 생성된 캐릭터 ID
 */
export async function createCharacter(params: CreateCharacterParams): Promise<string | null> {
  const supabase = await createClient();
  
  // 현재 사용자 확인
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect('/login');
  }
  
  // 기존 캐릭터 확인 (이미 있으면 생성 불가)
  const { data: existingChar } = await supabase
    .from('user_characters')
    .select('id')
    .eq('user_id', user.id)
    .single();
  
  if (existingChar) {
    throw new Error('이미 캐릭터가 존재합니다.');
  }
  
  // DB 함수를 통해 캐릭터 생성
  const { data, error } = await supabase
    .rpc('create_new_character', {
      p_user_id: user.id,
      p_job_id: params.jobId
    });
  
  if (error || !data) {
    console.error('캐릭터 생성 오류:', error);
    return null;
  }
  
  return data;
}

/**
 * 경험치 획득 처리
 * 
 * 경험치를 획득하고 레벨업 처리를 합니다.
 * 
 * @param expGain 획득할 경험치
 * @returns 레벨업 결과
 */
export async function gainExperience(expGain: number): Promise<LevelUpResult | null> {
  const supabase = await createClient();
  
  // 현재 사용자 확인
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect('/login');
  }
  
  // DB 함수를 통해 경험치 획득 및 레벨업 처리
  const { data, error } = await supabase
    .rpc('process_experience_gain', {
      p_user_id: user.id,
      p_exp_gain: expGain
    });
  
  if (error || !data) {
    console.error('경험치 획득 오류:', error);
    return null;
  }
  
  return {
    levelUp: data.level_up,
    levelsGained: data.levels_gained,
    currentLevel: data.current_level,
    currentExp: data.current_exp,
    stats: {
      strength: data.stats.strength,
      dexterity: data.stats.dexterity,
      intelligence: data.stats.intelligence,
      vitality: data.stats.vitality,
      maxHp: data.stats.max_hp,
      maxMp: data.stats.max_mp,
      physicalAttack: data.stats.physical_attack,
      magicalAttack: data.stats.magical_attack,
      physicalDefense: data.stats.physical_defense,
      magicalDefense: data.stats.magical_defense,
      criticalRate: 0.05, // 기본값
      criticalDamage: 1.5  // 기본값
    },
    nextLevelExp: data.next_level_exp,
    skillPoints: data.skill_points
  };
}