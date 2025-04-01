/**
 * 경험치 획득 API 라우트
 * 
 * POST 요청을 통해 캐릭터가 경험치를 획득하는 기능을 제공합니다.
 */

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// 경험치 획득 API 핸들러
export async function POST(
  request: NextRequest
): Promise<NextResponse> {
  try {
    // 요청 본문에서 경험치 값 추출
    const { expGain } = await request.json();

    // 입력값 검증
    if (typeof expGain !== 'number' || expGain <= 0) {
      return NextResponse.json(
        { error: '유효하지 않은 경험치 값입니다.' },
        { status: 400 }
      );
    }

    // Supabase 클라이언트 초기화
    const supabase = await createClient();

    // 현재 로그인한 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    // 경험치 처리 함수 호출
    const { data, error } = await supabase.rpc(
      'process_experience_gain',
      {
        p_user_id: user.id,
        p_exp_gain: expGain
      }
    );

    // 오류 처리
    if (error) {
      console.error('경험치 획득 오류:', error);
      return NextResponse.json(
        { error: '경험치 획득 처리 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 성공 응답
    return NextResponse.json({
      success: true,
      message: data.level_up 
        ? `레벨 업! ${data.levels_gained > 1 ? `${data.levels_gained}레벨 상승` : ''} (Lv.${data.current_level})` 
        : '경험치를 획득했습니다.',
      result: {
        levelUp: data.level_up,
        levelsGained: data.levels_gained,
        currentLevel: data.current_level,
        currentExp: data.current_exp,
        stats: data.stats,
        nextLevelExp: data.next_level_exp,
        skillPoints: data.skill_points
      }
    });
  } catch (error) {
    // 예상치 못한 오류 처리
    console.error('경험치 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}