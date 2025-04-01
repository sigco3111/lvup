---

## **기능명세서: 6. 재화/아이템 자동 획득**

**개발 우선순위:** Phase 2 (핵심 게임 루프 구현)

### **프론트엔드 기능명세서**

1.  **화면 레이아웃 및 디자인 명세**:
    *   **메인 게임 화면 - 재화/경험치 표시 (`app/dashboard/GameStatusHeader.tsx`)**:
        *   화면 상단 영역에 현재 보유 골드, 경험치 바(및 퍼센트) 등 주요 재화/상태를 표시.
        *   재화/경험치 획득 시 해당 값이 시각적으로 증가하는 애니메이션 효과 적용 고려 (예: 숫자 카운트업).
        *   **ShadCN 컴포넌트 활용:** `Progress` 컴포넌트를 경험치 바 표시에 사용 가능.
        *   **파일 위치:** `app/dashboard/GameStatusHeader.tsx` (또는 `components/layout/Header.tsx` 내 포함 가능)
    *   **메인 게임 화면 - 획득 로그 표시 (`app/dashboard/BattleLog.tsx`)**:
        *   화면의 특정 영역(예: 중앙 하단 또는 측면)에 자동 전투를 통해 획득한 재화(골드, 경험치) 및 아이템 이름을 텍스트 로그 형태로 실시간 표시.
        *   새로운 로그는 위 또는 아래에 추가되며, 로그 영역은 스크롤 가능해야 함.
        *   획득 아이템 등급에 따라 텍스트 색상 구분 적용 고려.
        *   **ShadCN 컴포넌트 활용:** `ScrollArea` 컴포넌트를 사용하여 스크롤 기능 구현. 로그 라인 스타일링에 TailwindCSS 사용.
        *   **파일 위치:** `app/dashboard/BattleLog.tsx`
    *   **인벤토리 알림 (`components/layout/NavBar.tsx` 또는 해당 메뉴 버튼)**:
        *   새로운 장비 아이템 획득 시, 하단 네비게이션 바의 '인벤토리' 메뉴 아이콘 위에 작은 점이나 숫자(뱃지) 형태의 알림 표시.
        *   **ShadCN 컴포넌트 활용:** `Badge` 컴포넌트(변형) 또는 간단한 CSS로 구현 가능.
        *   **파일 위치:** `components/layout/NavBar.tsx` (또는 해당 네비게이션 컴포넌트)

2.  **사용자 흐름 및 상호작용**:
    *   자동 전투 시스템(기능 2)에 의해 재화/아이템 획득 이벤트 발생 시, 해당 정보가 실시간으로 UI에 반영됨.
    *   `GameStatusHeader.tsx`: 골드 숫자 증가, 경험치 바 채워짐.
    *   `BattleLog.tsx`: 획득 내역(예: "+100 골드", "+50 경험치", "획득: [아이템 이름]") 로그 추가 및 스크롤 이동.
    *   `NavBar.tsx`: 새 장비 획득 시 인벤토리 메뉴에 알림 표시.
    *   획득 로그는 일정 개수 이상 쌓이면 오래된 로그부터 사라지도록 구현 (메모리 관리).

3.  **API 연동**:
    *   **데이터 소스:** 자동 전투 로직(클라이언트 측 또는 서버 측)에서 획득 이벤트 발생 시 데이터 전달받음.
    *   **초기 구현:** 프론트엔드에서 임시 타이머나 버튼 클릭 등으로 획득 이벤트를 시뮬레이션하여 UI 업데이트 로직 구현 및 테스트.
    *   **백엔드 연동:**
        *   **방법 1 (주기적 동기화):** 클라이언트 자동 전투 로직이 누적된 획득량을 주기적으로 백엔드(Server Action 또는 Route Handler)에 전송하여 저장. UI는 클라이언트 로직 기준으로 즉시 업데이트.
        *   **방법 2 (실시간 구독):** 클라이언트가 Supabase Realtime Subscription을 통해 `user_game_data` 및 `user_inventory` 테이블 변경 감지. 백엔드에서 데이터 업데이트 시 프론트엔드 UI 자동 반영. (이 경우, 클라이언트 자체 계산 로직은 최소화됨)
        *   **방법 3 (이벤트 기반 Server Action):** 클라이언트 전투 로직에서 몬스터 처치 등 주요 이벤트 발생 시마다 Server Action(`recordLoot`)을 호출하여 백엔드 데이터 업데이트. UI는 즉시 업데이트 후 서버 응답으로 최종 값 보정 가능.
    *   *Front-end first 방식이므로, 우선 클라이언트 측에서 획득 시뮬레이션 및 UI 업데이트를 구현하고, 이후 백엔드 기능 구현 시 선택된 연동 방식에 맞춰 연결.*

4.  **테스트 항목**:
    *   골드 획득 시 상단 골드 표시 및 전투 로그에 정확한 값이 반영되는지 확인.
    *   경험치 획득 시 상단 경험치 바 및 전투 로그에 정확한 값이 반영되는지 확인.
    *   아이템 획득 시 전투 로그에 아이템 이름이 표시되고 인벤토리 알림이 나타나는지 확인.
    *   획득 로그가 지정된 방향으로 쌓이고 스크롤이 정상 작동하는지 확인.
    *   UI 업데이트 시 성능 저하가 없는지 확인 (특히 로그가 많아질 경우).

---

### **백엔드 기능명세서**

1.  **API 정의**:
    *   **재화/아이템 획득 처리 (Server Action 권장)**:
        *   **목적:** 클라이언트에서 발생한 재화/아이템 획득 결과를 받아 사용자 데이터베이스에 반영.
        *   **Server Action 함수 명세 (`actions/game.ts`)**:
            ```typescript
            // actions/game.ts (또는 유사 파일)
            'use server' // Server Action임을 명시

            import { createClient } from '@/utils/supabase/server' // 서버용 Supabase 클라이언트
            import { revalidatePath } from 'next/cache'

            // 타입 정의 (types/index.ts 등)
            interface LootData {
              gold?: number;
              exp?: number;
              items?: { itemId: string; quantity?: number; options?: any }[]; // 아이템 ID, 수량, 옵션 등 포함
            }

            export async function recordLoot(lootData: LootData): Promise<{ success: boolean; message?: string }> {
              const supabase = createClient();

              const { data: { user }, error: authError } = await supabase.auth.getUser();

              if (authError || !user) {
                console.error('Authentication error:', authError);
                return { success: false, message: '사용자 인증 실패' };
              }

              const userId = user.id;
              let updateError = null;

              try {
                // 1. 재화 업데이트 (DB 함수 사용 권장 - 동시성 문제 방지)
                if (lootData.gold || lootData.exp) {
                  // 예시: 'update_user_resources' DB 함수 호출
                  const { error: rpcError } = await supabase.rpc('update_user_resources', {
                    p_user_id: userId,
                    p_gold_delta: lootData.gold || 0,
                    p_exp_delta: lootData.exp || 0
                  });
                  if (rpcError) throw rpcError; // 에러 발생 시 throw
                }

                // 2. 아이템 추가
                if (lootData.items && lootData.items.length > 0) {
                  const itemsToInsert = lootData.items.map(item => ({
                    user_id: userId,
                    item_id: item.itemId,
                    quantity: item.quantity || 1,
                    options: item.options || null,
                    // is_equipped, enhancement_level 등 기본값은 DB 스키마 default 활용
                  }));

                  const { error: insertError } = await supabase
                    .from('user_inventory')
                    .insert(itemsToInsert);

                  if (insertError) throw insertError; // 에러 발생 시 throw
                }

                // 데이터 변경 후 관련 페이지 캐시 무효화 (필요시)
                revalidatePath('/dashboard'); // 메인 대시보드
                revalidatePath('/inventory'); // 인벤토리 페이지

                return { success: true };

              } catch (error: any) {
                console.error('Error recording loot:', error.message);
                return { success: false, message: '획득 정보 저장 실패: ' + error.message };
              }
            }
            ```
        *   **DB 함수 예시 (`update_user_resources`)**: Supabase SQL Editor에서 생성 필요. 원자적 연산을 보장하여 여러 요청이 동시에 들어와도 재화가 정확히 증가하도록 함.
            ```sql
            -- Supabase SQL Editor 에서 실행
            CREATE OR REPLACE FUNCTION update_user_resources(p_user_id uuid, p_gold_delta bigint, p_exp_delta bigint)
            RETURNS void
            LANGUAGE plpgsql
            SECURITY DEFINER -- 함수를 생성한 유저(보통 postgres)의 권한으로 실행
            AS $$
            BEGIN
              UPDATE public.user_game_data
              SET
                gold = gold + p_gold_delta,
                experience = experience + p_exp_delta,
                updated_at = now()
              WHERE user_id = p_user_id;
            END;
            $$;
            -- 함수 실행 권한 부여
            GRANT EXECUTE ON FUNCTION update_user_resources(uuid, bigint, bigint) TO authenticated;
            ```

2.  **데이터베이스 설계 및 연동**:
    *   **`user_game_data` 테이블**:
        *   `user_id` (PK, FK to profiles.id), `level`, `experience`, `gold`, `updated_at` 등 컬럼. (스키마는 이전 응답 참고)
        *   RLS 설정 필수.
    *   **`user_inventory` 테이블**:
        *   `id` (PK), `user_id` (FK to profiles.id), `item_id`, `quantity`, `enhancement_level`, `options` (JSONB), `is_equipped`, `acquired_at` 등 컬럼. (스키마는 이전 응답 참고)
        *   RLS 설정 필수.
    *   **연동 로직**: Server Action(`recordLoot`) 내에서 Supabase 클라이언트 (`supabase-js`) 를 사용하여 `rpc` 호출(재화) 및 `insert` (아이템) 수행.

3.  **테스트 항목**:
    *   `recordLoot` Server Action 호출 시, `user_game_data` 테이블의 골드와 경험치가 정확히 증가하는지 확인 (DB 직접 확인).
    *   `recordLoot` Server Action 호출 시, `user_inventory` 테이블에 요청된 아이템 정보(ID, 수량, 옵션 등)가 정확히 삽입되는지 확인.
    *   동시에 여러 획득 요청(Server Action 동시 호출 시뮬레이션)이 발생해도 재화 값이 정확하게 누적되는지 확인 (DB 함수 원자성 테스트).
    *   인증되지 않은 사용자 또는 잘못된 `userId`로 호출 시 에러가 발생하고 데이터 변경이 없는지 확인.
    *   DB 제약 조건 위반 시(예: 존재하지 않는 `item_id`) 적절한 에러를 반환하는지 확인.
    *   DB 함수(`update_user_resources`)가 정상적으로 생성되고 호출 가능한지 확인.

---
