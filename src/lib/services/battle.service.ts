import { createClient } from '@/utils/supabase/server';

/**
 * 현재 스테이지의 몬스터 정보를 가져옵니다.
 */
export async function getStageMonsters(stageId: number) {
  const supabase = await createClient();

  const { data: monsters, error } = await supabase
    .from('game_monsters')
    .select('*')
    .eq('stage_id', stageId)
    .order('is_boss', { ascending: true });

  if (error) {
    console.error('몬스터 정보 조회 실패:', error);
    return [];
  }

  return monsters;
}

/**
 * 현재 스테이지 정보를 가져옵니다.
 */
export async function getCurrentStage(characterLevel: number) {
  const supabase = await createClient();

  const { data: stages, error } = await supabase
    .from('game_stages')
    .select('*')
    .lte('level_requirement', characterLevel)
    .order('stage_order', { ascending: true });

  if (error) {
    console.error('스테이지 정보 조회 실패:', error);
    return null;
  }

  // 캐릭터 레벨에 맞는 가장 높은 스테이지 반환
  return stages[stages.length - 1] || null;
}

/**
 * 몬스터 처치 후 경험치와 골드를 획득합니다.
 */
export async function gainRewards(characterId: string, expAmount: number, goldAmount: number) {
  const supabase = await createClient();

  const { error } = await supabase.rpc('gain_experience', {
    p_character_id: characterId,
    p_exp_amount: expAmount,
    p_gold_amount: goldAmount,
  });

  if (error) {
    console.error('보상 획득 실패:', error);
    return false;
  }

  return true;
} 