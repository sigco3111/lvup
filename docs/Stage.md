---

## **기능명세서: 4. 메인 스테이지 시스템**

**개발 우선순위:** Phase 2 (핵심 게임 루프 구현)

### **프론트엔드 기능명세서**

1.  **화면 레이아웃 및 디자인 명세**:
    *   **메인 게임 화면 - 스테이지 정보 표시 (`app/dashboard/StageInfo.tsx`)**:
        *   현재 위치한 스테이지의 정보를 명확하게 표시 (예: "월드 1 - 고블린 숲 - 스테이지 1-3").
        *   현재 스테이지의 진행도(일반 몬스터 처치 수 / 목표 처치 수) 또는 보스 스테이지임을 나타내는 정보 표시.
        *   **(선택적)** 현재 스테이지 배경 이미지가 전투 장면에 반영되어야 함 (`app/dashboard/BattleScene.tsx` 연계).
        *   **ShadCN 컴포넌트 활용:** 정보 표시에 `Card`, `Badge`, `Tooltip` 등 활용 가능. 진행도 표시에 `Progress` 컴포넌트 활용 가능.
        *   **파일 위치:** `app/dashboard/StageInfo.tsx` (또는 `app/dashboard/page.tsx` 내 통합).
    *   **메인 게임 화면 - 보스 도전 버튼 (`app/dashboard/BossChallengeButton.tsx`)**:
        *   현재 스테이지가 보스 스테이지이고, 도전 조건(예: 이전 스테이지 클리어)을 만족했을 때 활성화되는 "보스 도전" 버튼.
        *   보스 도전 중이거나, 아직 도전 조건 미달 시 비활성화 또는 다른 상태(예: "보스 출현까지 X마리") 표시.
        *   클릭 시 보스 전투 시작 로직 호출.
        *   *PRD 상 '자동 진행'이 강조되므로, 보스 자동 도전 옵션 또는 특정 조건 만족 시 자동 도전 로직도 고려 가능. 이 경우 버튼은 보조적이거나 없을 수 있음.*
        *   **ShadCN 컴포넌트 활용:** `Button` 컴포넌트 사용. 상태에 따른 비활성화(`disabled`) 처리.
        *   **파일 위치:** `app/dashboard/BossChallengeButton.tsx` (또는 `app/dashboard/page.tsx` 내 통합).
    *   **(선택적) 월드/지역 맵 UI (`app/world-map/page.tsx` 또는 `Dialog` 컴포넌트)**:
        *   전체 월드와 지역 구성을 시각적으로 보여주는 화면.
        *   클리어한 지역과 현재 진행 중인 지역, 잠긴 지역을 구분하여 표시.
        *   지역 클릭 시 해당 지역의 첫 스테이지로 이동하거나, 추가 정보 표시.
        *   **ShadCN 컴포넌트 활용:** `Dialog` (팝업 형태), `Card` (지역 정보), `Button` (이동) 등 활용.
        *   **파일 위치:** 별도 페이지 `app/world-map/page.tsx` 또는 메인 화면에서 접근 가능한 `components/features/WorldMapDialog.tsx`.

2.  **사용자 흐름 및 상호작용**:
    *   **일반 스테이지 자동 진행:**
        *   자동 전투(기능 2)로 현재 스테이지의 일반 몬스터 처치.
        *   처치 시마다 스테이지 진행도(처치 수) 업데이트 및 UI 반영.
        *   목표 처치 수 달성 시, 자동으로 다음 스테이지 정보 로드 및 상태 업데이트 (스테이지 정보 표시, 배경 변경, 등장 몬스터 변경 등).
        *   다음 스테이지 전투 자동 시작.
    *   **보스 스테이지 진입:**
        *   일반 스테이지 목표 처치 수 달성 후 다음 스테이지가 보스 스테이지인 경우, 보스 스테이지 상태로 전환.
        *   보스 도전 버튼 활성화 (수동 도전 시) 또는 자동 도전 로직 시작.
    *   **보스 도전 및 클리어:**
        *   ("보스 도전" 버튼 클릭 또는 자동 시작) 보스 몬스터 등장 및 전투 시작 (기능 2 연계).
        *   보스 몬스터 처치 성공 시:
            *   클리어 연출 (간단한 효과음, 시각 효과).
            *   보상 획득 처리 (기능 3 연계 - 유물 획득 등 특수 보상 포함 가능).
            *   다음 지역/스테이지 해금 정보 업데이트.
            *   자동으로 다음 스테이지(다음 지역의 첫 스테이지)로 이동 및 전투 시작.
        *   보스 몬스터 처치 실패 시:
            *   (정책에 따라) 현재 보스 스테이지에서 재도전 가능하도록 대기 상태 전환 또는 이전 스테이지로 복귀 후 재도전 조건(예: 전투력) 충족 유도.
    *   **데이터 동기화:** 스테이지 클리어, 특히 보스 스테이지 클리어 시 서버에 진행 상황 저장 요청 (Server Action 호출).

3.  **API 연동**:
    *   **스테이지 정보 로드:** 게임 시작 시 또는 스테이지 이동 시 필요한 스테이지 데이터(현재/다음 스테이지 정보, 몬스터 목록, 배경 등)를 로드. (기능 2의 게임 상태 로드 API 활용 또는 별도 요청)
    *   **진행 상태 저장:** 스테이지 클리어, 특히 보스 클리어 시 `saveBattleProgress` (기능 2) 또는 별도의 Server Action(`clearStage`)을 호출하여 서버에 `current_stage_id` 및 `cleared_stages` 업데이트 요청.
    *   **클라이언트 상태 관리:** 현재 스테이지 ID, 진행도(몬스터 처치 수), 보스 등장/클리어 상태 등을 클라이언트 상태 관리 라이브러리(Zustand, Valtio, Context API 등) 또는 `useState`로 관리.

4.  **테스트 항목**:
    *   현재 스테이지 정보(월드, 지역, 스테이지 번호, 진행도)가 정확히 표시되는지 확인.
    *   일반 몬스터 처치 시 진행도가 정상적으로 증가하고 UI에 반영되는지 확인.
    *   목표 처치 수 달성 시 자동으로 다음 스테이지로 이동(상태 변경)하고 정보가 업데이트되는지 확인.
    *   보스 스테이지 진입 시 보스 도전 버튼 상태(활성/비활성) 또는 자동 도전 로직이 정상 작동하는지 확인.
    *   보스 전투 시작 및 종료(성공/실패) 처리가 정상적으로 이루어지는지 확인.
    *   보스 클리어 시 다음 지역/스테이지로 정상 이동하는지 확인.
    *   스테이지 변경 시 배경 이미지 등 시각적 요소가 변경되는지 확인.
    *   (구현 시) 월드/지역 맵 UI가 정상적으로 표시되고 지역 이동이 가능한지 확인.
    *   스테이지 클리어 정보가 서버에 정상적으로 저장 요청되는지 확인.

---

### **백엔드 기능명세서**

1.  **API 정의**:
    *   **스테이지 데이터 제공 API (게임 상태 로드 API에 통합 또는 별도)**:
        *   **목적:** 클라이언트에 특정 스테이지 또는 전체/해금된 스테이지 목록 데이터 제공.
        *   **엔드포인트/방식:** 기능 2의 게임 상태 로드 API (`app/dashboard/page.tsx` Server Component 또는 `app/api/game-state/route.ts`) 내에 포함하여 로드 시 함께 전달하거나, 별도 API (`app/api/stages/route.ts` GET) 구성.
        *   **처리 로직:** `game_stages`, `game_regions`, `game_worlds` 테이블에서 필요한 정보 조회. 사용자의 `cleared_stages` 정보를 기반으로 해금 여부 판단 가능.
        *   **반환 데이터 예시:** `{ id: '1-3', name: '어둠의 숲 3', regionId: 'forest', worldId: 'beginners', nextStageId: '1-4', isBossStage: false, monsters: ['goblin_warrior', 'goblin_archer'], requiredMonsterCount: 10, backgroundUrl: '...', ... }`
        *   **파일 위치:** (Server Component 방식) `app/dashboard/page.tsx`, (Route Handler 방식) `app/api/game-state/route.ts` 또는 `app/api/stages/route.ts`.
    *   **스테이지 클리어 처리 API (Server Action 권장)**:
        *   **목적:** 클라이언트에서 보고된 스테이지 클리어(특히 보스 클리어) 정보를 검증하고 사용자 데이터 업데이트.
        *   **Server Action 함수 명세 (`actions/game.ts`)**:
            ```typescript
            // actions/game.ts
            'use server'

            import { createClient } from '@/utils/supabase/server'
            import { revalidatePath } from 'next/cache'

            interface ClearStageData {
              stageId: string; // 클리어한 스테이지 ID
              isBossClear: boolean; // 보스 클리어 여부
              // 필요시 추가 데이터: 클리어 시간 등 검증용 데이터
            }

            // 기능 2의 saveBattleProgress 와 통합 또는 별도 함수로 구현
            export async function clearStage(data: ClearStageData): Promise<{ success: boolean; message?: string; nextStageId?: string, unlockedRegionId?: string }> {
              const supabase = createClient();
              const { data: { user } } = await supabase.auth.getUser();

              if (!user) return { success: false, message: '사용자 인증 실패' };

              const userId = user.id;

              try {
                // 1. 클리어한 스테이지 정보 유효성 검증 (선택적이지만 권장)
                //    - 사용자가 실제로 해당 스테이지에 있었는지 (user_game_data.current_stage_id 비교)
                //    - 클리어 조건(예: 요구 전투력) 만족 여부 등
                const { data: stageData, error: stageError } = await supabase
                  .from('game_stages')
                  .select('id, next_stage_id, region_id, is_boss_stage')
                  .eq('id', data.stageId)
                  .single();

                if (stageError || !stageData) throw new Error('존재하지 않는 스테이지입니다.');
                if (stageData.is_boss_stage !== data.isBossClear) throw new Error('보스 클리어 정보가 일치하지 않습니다.');

                // TODO: 추가적인 클리어 조건 검증 로직 (예: 전투력)

                // 2. 사용자 게임 데이터 업데이트
                const updateData: any = {
                    // current_stage_id 는 클라이언트에서 다음 스테이지로 바로 이동시키거나, 여기서 반환된 nextStageId 로 이동
                    updated_at: new Date().toISOString(),
                };

                // 방법 1: 클리어한 스테이지 목록을 배열로 관리 (JSONB)
                // updateData.cleared_stages = sql`cleared_stages || ${data.stageId}::text`; // 기존 배열에 추가 (DB 함수나 직접 SQL 사용 필요)

                // 방법 2: 별도의 user_cleared_stages 테이블 사용
                const { error: insertClearError } = await supabase
                  .from('user_cleared_stages')
                  .insert({ user_id: userId, stage_id: data.stageId });
                // 중복 삽입 방지 로직 필요 (ON CONFLICT DO NOTHING 등)
                if (insertClearError) console.warn('이미 클리어한 스테이지:', insertClearError.message); // 에러 대신 경고 처리 가능


                // 현재 스테이지 업데이트 (다음 스테이지로)
                if (stageData.next_stage_id) {
                    updateData.current_stage_id = stageData.next_stage_id;
                } else {
                    // 마지막 스테이지 클리어 처리 (예: 다음 지역 첫 스테이지로 이동)
                    // TODO: 다음 지역 정보 조회 및 해당 지역 첫 스테이지 ID 설정 로직
                }


                const { error: updateError } = await supabase
                  .from('user_game_data')
                  .update(updateData)
                  .eq('user_id', userId);

                if (updateError) throw updateError;

                // 3. 모험 지역 해금 처리 (보스 클리어 시)
                let unlockedRegionId: string | undefined = undefined;
                if (data.isBossClear) {
                  // TODO: 클리어한 보스 스테이지와 연관된 모험 지역 해금 로직 (user_unlocked_adventure_zones 테이블 업데이트 등)
                }

                revalidatePath('/dashboard'); // 관련 페이지 캐시 무효화
                revalidatePath('/world-map');

                return { success: true, nextStageId: updateData.current_stage_id, unlockedRegionId };

              } catch (error: any) {
                console.error('Error clearing stage:', error.message);
                return { success: false, message: '스테이지 클리어 처리 실패: ' + error.message };
              }
            }
            ```
        *   **파일 위치:** `actions/game.ts`

2.  **데이터베이스 설계 및 연동**:
    *   **`game_stages` 테이블**: `id` (PK), `name`, `region_id` (FK), `world_id` (FK), `sequence` (지역 내 순서), `next_stage_id` (FK, nullable), `is_boss_stage` (boolean), `boss_monster_id` (FK, nullable), `normal_monsters` (JSONB 또는 별도 테이블), `required_monster_count` (integer), `background_url`, `required_power` (integer, nullable) 등.
    *   **`game_regions` 테이블**: `id` (PK), `name`, `world_id` (FK), `unlock_condition_stage_id` (FK, nullable), `related_adventure_zone_id` (FK, nullable).
    *   **`game_worlds` 테이블**: `id` (PK), `name`.
    *   **`user_game_data` 테이블**: `current_stage_id` (FK to game_stages.id), `updated_at`.
    *   **`user_cleared_stages` 테이블 (선택적)**: `user_id` (FK), `stage_id` (FK), `cleared_at` (timestamp). 복합 기본키 `(user_id, stage_id)`. (JSONB 대신 사용 시)
    *   **`user_unlocked_adventure_zones` 테이블 (선택적)**: `user_id` (FK), `adventure_zone_id` (FK), `unlocked_at`. 복합 기본키.
    *   *(위 테이블들은 Supabase 대시보드 또는 SQL 마이그레이션 스크립트로 생성 및 관리)*
    *   **연동 로직:** Server Action 내에서 Supabase 클라이언트를 사용하여 `game_stages` 조회, `user_game_data` 및 `user_cleared_stages` (또는 `user_game_data.cleared_stages` JSONB 필드) 업데이트, `user_unlocked_adventure_zones` 업데이트.

3.  **테스트 항목**:
    *   스테이지 데이터 API가 정확한 스테이지 정보(다음 스테이지 ID, 보스 여부 등)를 반환하는지 확인.
    *   `clearStage` Action 호출 시, `user_game_data`의 `current_stage_id`가 다음 스테이지로 정상 업데이트되는지 확인.
    *   `clearStage` Action 호출 시, 클리어한 스테이지 정보가 `user_cleared_stages` 테이블 또는 `user_game_data.cleared_stages` 필드에 기록되는지 확인.
    *   보스 스테이지 클리어 시, 연관된 모험 지역이 해금 처리되는지 확인 (`user_unlocked_adventure_zones` 테이블 확인).
    *   잘못된 스테이지 ID나 클리어 조건 미달 시 Action이 실패하고 데이터 변경이 없는지 확인 (서버 측 검증).
    *   존재하지 않는 다음 스테이지 ID가 `current_stage_id`로 업데이트되지 않는지 확인.
    *   데이터베이스 테이블 간 관계(FK) 및 제약 조건이 올바르게 설정되었는지 확인.

---
