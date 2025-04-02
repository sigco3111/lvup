/**
 * 게임 관련 Server Action들을 모아둔 파일입니다.
 * 
 * 전투 결과 저장, 재화/아이템 획득 처리, 몬스터 처치 등의 기능을 담당합니다.
 */

'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

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
  newItems?: { itemId: string; itemName: string; rarity: string }[];
  updatedGold?: number;  // 추가: 업데이트된 골드 값 반환
  updatedExp?: number;   // 추가: 업데이트된 경험치 값 반환
}> {
  // Supabase 클라이언트 생성
  const supabase = await createClient();

  // 사용자 인증 확인 (getUser 사용)
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // 인증 실패 시 에러 반환
  if (authError || !user) {
    console.error('인증 오류:', authError);
    return { success: false, message: '사용자 인증 실패' };
  }

  const userId = user.id;
  let newItems: { itemId: string; itemName: string; rarity: string }[] = [];
  let updatedGold: number | undefined = undefined;
  let updatedExp: number | undefined = undefined;

  try {
    // 1. 재화(골드, 경험치) 업데이트 처리
    if (lootData.gold || lootData.exp) {
      console.log('재화 업데이트 시작:', { gold: lootData.gold, exp: lootData.exp });
      
      // DB 함수 호출로 원자적 업데이트 수행
      const { error: rpcError } = await supabase.rpc('update_user_resources', {
        p_user_id: userId,
        p_gold_delta: lootData.gold || 0,
        p_exp_delta: lootData.exp || 0
      });

      // 재화 업데이트 실패 시 에러 발생
      if (rpcError) {
        console.error('재화 업데이트 오류:', rpcError);
        throw rpcError;
      }
      
      // 업데이트된 사용자 리소스 정보 조회 (추가)
      const { data: updatedGameData, error: gameDataError } = await supabase
        .from('user_game_data')
        .select('gold')
        .eq('user_id', userId)
        .single();
        
      if (gameDataError) {
        console.error('게임 데이터 조회 오류:', gameDataError);
      } else if (updatedGameData) {
        updatedGold = updatedGameData.gold;
        console.log('업데이트된 골드:', updatedGold);
      }
      
      // 업데이트된 캐릭터 정보 조회 (추가)
      const { data: updatedCharacter, error: characterError } = await supabase
        .from('user_characters')
        .select('experience')
        .eq('user_id', userId)
        .single();
        
      if (characterError) {
        console.error('캐릭터 데이터 조회 오류:', characterError);
      } else if (updatedCharacter) {
        updatedExp = updatedCharacter.experience;
        console.log('업데이트된 경험치:', updatedExp);
      }
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

    // 관련 페이지 캐시 무효화 및 브로드캐스트 채널 추가
    revalidatePath('/dashboard');
    revalidatePath('/inventory');
    
    // 게임 데이터 변경 브로드캐스트 추가
    try {
      const broadcastClient = await createClient();
      await broadcastClient.from('game_data_updates').insert({
        user_id: userId,
        update_type: 'resources',
        updated_at: new Date().toISOString()
      });
      console.log('게임 데이터 변경 브로드캐스트 성공');
    } catch (broadcastError) {
      console.error('게임 데이터 변경 브로드캐스트 실패:', broadcastError);
      // 브로드캐스트 실패는 전체 프로세스를 실패시키지 않음
    }

    return { 
      success: true, 
      newItems: newItems.length > 0 ? newItems : undefined,
      updatedGold,
      updatedExp
    };

  } catch (error: any) {
    console.error('재화/아이템 획득 처리 오류:', error.message);
    return { 
      success: false, 
      message: '획득 정보 저장 실패: ' + error.message 
    };
  }
}

/**
 * 스테이지 클리어 데이터 타입 정의
 */
export interface ClearStageData {
  stageId: number;      // 클리어한 스테이지 ID (숫자로 변경)
  isBossClear: boolean; // 보스 클리어 여부
}

/**
 * 스테이지 클리어 처리 함수
 * 
 * 클리어한 스테이지 정보를 검증하고 사용자 데이터를 업데이트합니다.
 * 보스 클리어 시 다음 지역 해금 처리도 수행합니다.
 * 
 * @param data 클리어한 스테이지 데이터
 * @returns 처리 결과 (성공 여부 및 다음 스테이지 정보)
 */
export async function clearStage(data: ClearStageData): Promise<{ 
  success: boolean; 
  message?: string; 
  nextStageId?: number; // 숫자로 변경
  unlockedRegionId?: string;
  stageDetails?: any; // 스테이지 상세 정보 추가
}> {
  // Supabase 클라이언트 생성
  const supabase = await createClient();
  
  // 사용자 인증 확인 (getUser 사용)
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('인증 오류:', authError);
    return { success: false, message: '사용자 인증 실패' };
  }

  const userId = user.id;
  console.log(`스테이지 클리어 처리 시작 - 사용자: ${userId}, 스테이지: ${data.stageId}, 보스: ${data.isBossClear}`);

  try {
    // 1. 클리어한 스테이지 정보 유효성 검증
    const { data: stageData, error: stageError } = await supabase
      .from('game_stages')
      .select('id, next_stage_id, region_id, is_boss_stage, name, world_id, level_requirement')
      .eq('id', data.stageId)
      .single();

    if (stageError) {
      console.error('스테이지 정보 조회 오류:', stageError);
      throw new Error('존재하지 않는 스테이지입니다.');
    }
    
    if (!stageData) {
      console.error('스테이지 데이터 없음:', data.stageId);
      throw new Error('존재하지 않는 스테이지입니다.');
    }
    
    console.log('조회된 스테이지 정보:', {
      id: stageData.id,
      name: stageData.name,
      next_stage_id: stageData.next_stage_id, 
      is_boss_stage: stageData.is_boss_stage
    });

    if (stageData.is_boss_stage !== data.isBossClear) {
      console.error('보스 정보 불일치', { 
        expected: stageData.is_boss_stage, 
        received: data.isBossClear 
      });
      throw new Error('보스 클리어 정보가 일치하지 않습니다.');
    }

    // 2. 사용자 게임 데이터 업데이트
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // 클리어한 스테이지 기록 (user_cleared_stages 테이블)
    const { error: insertClearError } = await supabase
      .from('user_cleared_stages')
      .insert({ 
        user_id: userId, 
        stage_id: data.stageId,
        cleared_at: new Date().toISOString()
      });
    
    // 중복 처리는 경고로만 기록 (이미 클리어한 스테이지를 다시 클리어한 경우)
    if (insertClearError) {
      console.warn('이미 클리어한 스테이지:', insertClearError.message);
    }

    // 현재 스테이지 업데이트 (다음 스테이지로)
    if (stageData.next_stage_id) {
      updateData.current_stage_id = stageData.next_stage_id;
      console.log(`다음 스테이지로 업데이트: ${stageData.next_stage_id}`);
    } else {
      console.log('다음 스테이지 ID가 없음');
      // 다음 스테이지가 없는 경우 처리 (마지막 스테이지 클리어)
      // 여기서는 현재 스테이지를 그대로 유지
    }

    // 현재 사용자 게임 데이터 상태 확인
    const { data: currentGameData, error: gameDataError } = await supabase
      .from('user_game_data')
      .select('user_id, current_stage_id, gold')
      .eq('user_id', userId)
      .single();
    
    if (gameDataError) {
      console.error('사용자 게임 데이터 조회 오류:', gameDataError);
      
      // 사용자 게임 데이터가 없는 경우 새로 생성
      if (gameDataError.code === 'PGRST116') { // 데이터 없음 오류 코드
        console.log('사용자 게임 데이터 없음, 새로 생성합니다.');
        const { error: insertError } = await supabase
          .from('user_game_data')
          .insert({
            user_id: userId,
            current_stage_id: updateData.current_stage_id || data.stageId,
            gold: 0
          });
          
        if (insertError) {
          console.error('사용자 게임 데이터 생성 오류:', insertError);
          throw new Error('사용자 게임 데이터 생성 실패');
        }
      } else {
        throw new Error('사용자 게임 데이터 조회 실패');
      }
    } else {
      console.log('현재 사용자 게임 데이터:', currentGameData);
      
      // 사용자 게임 데이터 업데이트
      const { error: updateError } = await supabase
        .from('user_game_data')
        .update(updateData)
        .eq('user_id', userId);

      if (updateError) {
        console.error('사용자 게임 데이터 업데이트 오류:', updateError);
        throw updateError;
      }
      
      console.log('사용자 게임 데이터 업데이트 성공:', updateData);
    }

    // 다음 스테이지 정보 조회 (추가)
    let nextStageDetails = null;
    if (updateData.current_stage_id) {
      const { data: nextStage, error: nextStageError } = await supabase
        .from('game_stages')
        .select('id, name, region_id, world_id, level_requirement')
        .eq('id', updateData.current_stage_id)
        .single();
        
      if (nextStageError) {
        console.error('다음 스테이지 정보 조회 오류:', nextStageError);
      } else {
        nextStageDetails = nextStage;
        console.log('다음 스테이지 정보:', nextStageDetails);
      }
    }

    // 3. 모험 지역 해금 처리 (보스 클리어 시)
    let unlockedRegionId: string | undefined = undefined;
    
    if (data.isBossClear) {
      console.log('보스 스테이지 클리어 - 지역 해금 진행');
      
      // 보스 스테이지와 연관된 다음 지역 정보 조회
      const { data: regionData, error: regionError } = await supabase
        .from('game_regions')
        .select('id, name')
        .eq('unlock_condition_stage_id', data.stageId)
        .maybeSingle();
      
      if (regionError) {
        console.error('지역 정보 조회 오류:', regionError);
      }
      
      if (!regionError && regionData) {
        console.log('해금 가능한 지역 발견:', regionData);
        
        // 지역 해금 처리
        unlockedRegionId = regionData.id;
        
        // 해금된 지역 기록
        try {
          await supabase
            .from('user_unlocked_adventure_zones')
            .insert({
              user_id: userId,
              adventure_zone_id: unlockedRegionId,
              unlocked_at: new Date().toISOString()
            });
            
          console.log(`지역 해금 성공: ${unlockedRegionId}`);
        } catch (err) {
          // 중복 레코드 오류는 무시 (이미 해금된 지역)
          console.log('해금된 지역 기록 중 오류 (무시됨):', err);
        }
      } else {
        console.log('해금할 다음 지역이 없음');
      }
    }
    
    // 게임 데이터 변경 브로드캐스트 추가
    try {
      const broadcastClient = await createClient();
      await broadcastClient.from('game_data_updates').insert({
        user_id: userId,
        update_type: 'stage_clear',
        updated_at: new Date().toISOString()
      });
      console.log('스테이지 클리어 브로드캐스트 성공');
    } catch (broadcastError) {
      console.error('스테이지 클리어 브로드캐스트 실패:', broadcastError);
      // 브로드캐스트 실패는 전체 프로세스를 실패시키지 않음
    }

    // 관련 페이지 캐시 무효화
    revalidatePath('/dashboard');
    revalidatePath('/world-map');

    console.log('스테이지 클리어 처리 완료', { 
      nextStageId: updateData.current_stage_id, 
      unlockedRegionId 
    });

    return { 
      success: true, 
      nextStageId: updateData.current_stage_id, 
      unlockedRegionId,
      stageDetails: nextStageDetails 
    };

  } catch (error: any) {
    console.error('스테이지 클리어 처리 오류:', error.message);
    return { 
      success: false, 
      message: '스테이지 클리어 처리 실패: ' + error.message 
    };
  }
} 