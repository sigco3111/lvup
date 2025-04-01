import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { ensureUserProfile } from '@/actions/user';

/**
 * 메인 게임 대시보드 페이지
 * 자동 전투 및 게임 상태를 보여주는 화면
 */
export default async function DashboardPage() {
  // 서버 컴포넌트에서 세션 확인
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  // 로그인되지 않은 사용자는 로그인 페이지로 리디렉션
  if (!session) {
    redirect('/login');
  }
  
  // 프로필 생성 확인 (필요시 생성)
  await ensureUserProfile();
  
  // 사용자 정보 가져오기
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">게임 대시보드</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 캐릭터 정보 카드 */}
        <div className="md:col-span-1 p-6 bg-background rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">캐릭터 정보</h2>
          <div className="space-y-2">
            <p>플레이어: {profile?.nickname || '게이머'}</p>
            <p>레벨: 1</p>
            <p>직업: 초보자</p>
            <p>경험치: 0/100</p>
            <p>골드: 0</p>
          </div>
        </div>
        
        {/* 전투 화면 */}
        <div className="md:col-span-2 p-6 bg-background rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">전투 화면</h2>
          <div className="h-60 bg-muted/30 rounded flex items-center justify-center">
            <p className="text-center text-muted-foreground">전투가 자동으로 진행됩니다...</p>
          </div>
          
          {/* 전투 로그 */}
          <div className="mt-4 p-3 bg-muted/20 rounded-lg h-32 overflow-y-auto">
            <p className="text-sm text-muted-foreground">전투 로그가 이곳에 표시됩니다.</p>
          </div>
        </div>
      </div>
      
      {/* 네비게이션 */}
      <div className="mt-6 flex flex-wrap gap-3">
        <button className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded">
          인벤토리
        </button>
        <button className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded">
          스킬
        </button>
        <button className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded">
          직업
        </button>
        <button className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded">
          스탯
        </button>
        <button className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded">
          모험 지역
        </button>
      </div>
    </div>
  );
} 