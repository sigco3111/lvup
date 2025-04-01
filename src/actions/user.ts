'use server';

import { createActionClient } from '@/utils/supabase/server';

/**
 * 사용자 프로필이 존재하는지 확인하고 없으면 생성하는 서버 액션
 * 로그인 후 호출하여 프로필 생성 여부를 확인
 */
export async function ensureUserProfile() {
  try {
    const supabase = createActionClient();
    
    // 현재 로그인된 사용자 정보 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return { success: false, error: '인증된 사용자를 찾을 수 없습니다.' };
    }
    
    // 프로필 존재 여부 확인
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();
    
    if (profileError) {
      console.error('Profile check error:', profileError);
      return { success: false, error: '프로필 확인 중 오류가 발생했습니다.' };
    }
    
    // 프로필이 존재하지 않으면 생성
    if (!profile) {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          nickname: user.email?.split('@')[0] || `user_${user.id.substring(0, 8)}`,
        });
      
      if (insertError) {
        console.error('Profile creation error:', insertError);
        return { success: false, error: '프로필 생성 중 오류가 발생했습니다.' };
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Ensure profile error:', error);
    return { success: false, error: '프로필 처리 중 예상치 못한 오류가 발생했습니다.' };
  }
} 