/**
 * 캐릭터 관련 서버 액션
 * 
 * 캐릭터 생성, 경험치 획득 등의 기능을 제공합니다.
 */

'use server';

import { createActionClient, createAdminClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { CreateCharacterParams, LevelUpResult } from '@/lib/types/character';
import { redirect } from 'next/navigation';

/**
 * 캐릭터 생성 액션
 * 
 * @param data 캐릭터 생성 데이터
 * @returns 결과 및 메시지
 */
export async function createCharacterAction(data: CreateCharacterParams): Promise<{
  success: boolean;
  message: string;
  characterId?: string;
}> {
  try {
    const supabase = await createActionClient();
    // RLS 우회를 위한 관리자 클라이언트
    const adminClient = createAdminClient();
  
    // 현재 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return {
        success: false,
        message: '로그인이 필요합니다.'
      };
    }
    
    // 기존 캐릭터 확인 (이미 있으면 생성 불가)
    const { data: existingChar } = await supabase
      .from('user_characters')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (existingChar) {
      return {
        success: false,
        message: '이미 캐릭터가 존재합니다.'
      };
    }
    
    // 유효한 직업 확인
    const { data: jobData, error: jobError } = await supabase
      .from('game_jobs')
      .select('id')
      .eq('id', data.jobId)
      .single();
    
    if (jobError || !jobData) {
      return {
        success: false,
        message: '유효하지 않은 직업입니다.'
      };
    }
    
    // DB 함수를 통해 캐릭터 생성 (관리자 클라이언트 사용)
    const { data: characterId, error } = await adminClient
      .rpc('create_new_character', {
        p_user_id: user.id,
        p_job_id: data.jobId
      });
    
    if (error || !characterId) {
      console.error('캐릭터 생성 오류:', error);
      return {
        success: false,
        message: '캐릭터 생성에 실패했습니다.'
      };
    }
    
    return {
      success: true,
      message: '캐릭터가 성공적으로 생성되었습니다.',
      characterId
    };
  } catch (error) {
    console.error('캐릭터 생성 중 오류 발생:', error);
    return {
      success: false,
      message: '캐릭터 생성 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 경험치 획득 액션
 * 
 * @param expGain 획득할 경험치
 * @returns 레벨업 결과 및 메시지
 */
export async function gainExperienceAction(expGain: number): Promise<{
  success: boolean;
  message: string;
  result?: LevelUpResult;
}> {
  try {
    if (expGain <= 0) {
      return {
        success: false,
        message: '유효하지 않은 경험치 값입니다.'
      };
    }
  
    const supabase = await createActionClient();
    
    // 현재 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return {
        success: false,
        message: '로그인이 필요합니다.'
      };
    }
    
    // DB 함수를 통해 경험치 획득 및 레벨업 처리
    const { data, error } = await supabase
      .rpc('process_experience_gain', {
        p_user_id: user.id,
        p_exp_gain: expGain
      });
    
    if (error || !data) {
      console.error('경험치 획득 오류:', error);
      return {
        success: false,
        message: '경험치 획득에 실패했습니다.'
      };
    }
    
    // 결과 변환
    const result: LevelUpResult = {
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
    
    return {
      success: true,
      message: data.level_up 
        ? `레벨 업! ${data.levels_gained > 1 ? `${data.levels_gained}레벨 상승` : ''} (Lv.${data.current_level})` 
        : '경험치를 획득했습니다.',
      result
    };
  } catch (error) {
    console.error('경험치 획득 중 오류 발생:', error);
    return {
      success: false,
      message: '경험치 획득 중 오류가 발생했습니다.'
    };
  }
}