/**
 * 게임 데이터 서비스
 * 
 * 게임 진행, 재화, 전투 등과 관련된 기본 데이터를 처리하는 서비스 함수들입니다.
 */

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * 사용자 게임 데이터 인터페이스
 */
export interface UserGameData {
  userId: string;
  gold: number;
  currentStageId?: string;
  currentRegionId?: string;
  currentWorldId?: string;
  unlockedStages?: string[];
  lastPlayedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 현재 사용자의 게임 데이터를 조회합니다.
 * 골드, 현재 스테이지 등의 게임 진행 정보를 반환합니다.
 * 
 * @returns {Promise<UserGameData | null>} 사용자 게임 데이터 또는 null
 */
export async function getUserGameData(): Promise<UserGameData | null> {
  const supabase = createClient();
  
  // 현재 로그인한 사용자 정보 확인
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('사용자 인증 실패:', authError);
    return null;
  }
  
  // 사용자 게임 데이터 조회
  const { data, error } = await supabase
    .from('user_game_data')
    .select('*')
    .eq('user_id', user.id)
    .single();
  
  if (error) {
    console.error('게임 데이터 조회 실패:', error);
    return null;
  }
  
  // 데이터 포맷 변환
  return {
    userId: data.user_id,
    gold: data.gold || 0,
    currentStageId: data.current_stage_id,
    currentRegionId: data.current_region_id,
    currentWorldId: data.current_world_id,
    unlockedStages: data.unlocked_stages,
    lastPlayedAt: data.last_played_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

/**
 * 새로운 아이템 알림 개수를 조회합니다.
 * 사용자가 확인하지 않은 새로 획득한 아이템의 개수를 반환합니다.
 * 
 * @returns {Promise<number>} 새 아이템 개수
 */
export async function getNewItemsCount(): Promise<number> {
  const supabase = createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('사용자 인증 실패:', authError);
    return 0;
  }
  
  // 최근 24시간 내 획득하고 확인하지 않은 아이템 수 조회
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  
  const { count, error } = await supabase
    .from('user_inventory')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_new', true) // 새 아이템 표시 여부
    .gte('acquired_at', oneDayAgo.toISOString());
  
  if (error) {
    console.error('새 아이템 개수 조회 실패:', error);
    return 0;
  }
  
  return count || 0;
}

/**
 * 새 아이템 알림을 모두 확인 처리합니다.
 * 사용자가 인벤토리 페이지에 접속하면 호출됩니다.
 */
export async function clearNewItemsNotification(): Promise<boolean> {
  const supabase = createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('사용자 인증 실패:', authError);
    return false;
  }
  
  const { error } = await supabase
    .from('user_inventory')
    .update({ is_new: false })
    .eq('user_id', user.id)
    .eq('is_new', true);
  
  if (error) {
    console.error('알림 초기화 실패:', error);
    return false;
  }
  
  // 인벤토리 페이지 캐시 갱신
  revalidatePath('/inventory');
  
  return true;
} 