/**
 * 게임 관련 Server Action들을 모아둔 파일입니다.
 * 
 * 전투 결과 저장, 재화/아이템 획득 처리, 몬스터 처치 등의 기능을 담당합니다.
 */

'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * 획득한 재화/아이템 데이터 타입 정의
 */
export interface LootData {
  gold?: number; // 획득한 골드
  exp?: number; // 획득한 경험치
  items?: { // 획득한 아이템 목록
    itemId: string; // 아이템 ID
    quantity?: number; // 수량 (기본값: 1)
    options?: any; // 아이템 옵션 데이터
  }[];
}

/**
 * 재화/아이템 획득 처리 함수
 * 
 * 몬스터 처치 등으로 획득한 재화와 아이템을 저장합니다.
 * 사용자 데이터베이스에 골드, 경험치, 아이템 등을 업데이트합니다.
 * 
 * @param lootData 획득한 재화/아이템 데이터
 * @returns 처리 결과 (성공 여부 및 메시지)
 */
export async function recordLoot(lootData: LootData): Promise<{ 
  success: boolean; 
  message?: string; 
  newItems?: { itemId: string; itemName: string; rarity: string }[] 
}> {
  // Supabase 클라이언트 생성
  const supabase = createClient();

  // 사용자 인증 확인
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // 인증 실패 시 에러 반환
  if (authError || !user) {
    console.error('인증 오류:', authError);
    return { success: false, message: '사용자 인증 실패' };
  }

  const userId = user.id;
  let newItems = [];

  try {
    // 1. 재화(골드, 경험치) 업데이트 처리
    if (lootData.gold || lootData.exp) {
      // DB 함수 호출로 원자적 업데이트 수행
      const { error: rpcError } = await supabase.rpc('update_user_resources', {
        p_user_id: userId,
        p_gold_delta: lootData.gold || 0,
        p_exp_delta: lootData.exp || 0
      });

      // 재화 업데이트 실패 시 에러 발생
      if (rpcError) throw rpcError;
    }

    // 2. 아이템 획득 처리
    if (lootData.items && lootData.items.length > 0) {
      // 아이템 정보 조회를 위한 아이템 ID 목록 추출
      const itemIds = lootData.items.map(item => item.itemId);
      
      // 아이템 정보 조회
      const { data: itemsData, error: itemsError } = await supabase
        .from('game_items')
        .select('id, name, rarity')
        .in('id', itemIds);
      
      if (itemsError) throw itemsError;
      
      // 아이템 정보와 획득 데이터 매핑
      const itemsToInsert = lootData.items.map(item => {
        const itemInfo = itemsData?.find(i => i.id === item.itemId);
        
        // 새 아이템 정보 저장 (알림 표시용)
        if (itemInfo) {
          newItems.push({
            itemId: item.itemId,
            itemName: itemInfo.name,
            rarity: itemInfo.rarity
          });
        }
        
        return {
          user_id: userId,
          item_id: item.itemId,
          quantity: item.quantity || 1,
          options: item.options || null,
          acquired_at: new Date().toISOString()
        };
      });

      // 인벤토리에 아이템 추가
      const { error: insertError } = await supabase
        .from('user_inventory')
        .insert(itemsToInsert);

      if (insertError) throw insertError;
    }

    // 관련 페이지 캐시 무효화
    revalidatePath('/dashboard');
    revalidatePath('/inventory');

    return { 
      success: true, 
      newItems: newItems.length > 0 ? newItems : undefined 
    };

  } catch (error: any) {
    console.error('재화/아이템 획득 처리 오류:', error.message);
    return { 
      success: false, 
      message: '획득 정보 저장 실패: ' + error.message 
    };
  }
} 