---

## **기능명세서: 2. 자동 전투 시스템**

**개발 우선순위:** Phase 2 (핵심 게임 루프 구현)

### **프론트엔드 기능명세서**

1.  **화면 레이아웃 및 디자인 명세**:
    *   **메인 게임 화면 - 전투 장면 (`app/dashboard/BattleScene.tsx`)**:
        *   화면 중앙 영역에 현재 진행 중인 전투 상황을 시각적으로 표시.
        *   **캐릭터 표시:** 현재 플레이어 캐릭터의 스프라이트 또는 3D 모델(리소스 수급 상황에 따라) 표시. 상태(Idle, Attack, Skill Use, Hit)에 따른 애니메이션 적용.
        *   **몬스터 표시:** 현재 타겟 몬스터의 스프라이트 또는 모델 표시. 상태(Idle, Attack, Hit, Die)에 따른 애니메이션 적용.
        *   **배경:** 현재 스테이지 또는 지역에 맞는 배경 이미지 표시.
        *   **전투 이펙트:** 캐릭터/몬스터의 공격, 스킬 사용, 피격 시 간단한 시각 효과(예: 번쩍임, 파티클) 표시.
        *   **데미지 표시:** 캐릭터가 몬스터에게 입히는 데미지, 몬스터가 캐릭터에게 입히는 데미지를 숫자 텍스트로 표시 (Floating Text).
        *   **몬스터 HP 바:** 현재 타겟 몬스터의 체력 상태를 나타내는 바 표시.
        *   **(선택적) 캐릭터 HP/MP 바:** 캐릭터의 체력/마나 상태를 전투 장면에 함께 표시할 수 있음.
        *   **ShadCN 컴포넌트 활용:** 전투 장면 자체는 Canvas 또는 DOM 기반 애니메이션으로 구현될 가능성이 높아 직접적인 ShadCN 컴포넌트 사용은 적음. 다만, 상태 바 표시에 ShadCN `Progress` 컴포넌트를 활용하거나, 데미지 텍스트 스타일에 TailwindCSS를 적극 활용.
        *   **파일 위치:** `app/dashboard/BattleScene.tsx` 및 관련된 애니메이션/이펙트 컴포넌트.
    *   **메인 게임 화면 - 전투 관련 정보 (`app/dashboard/page.tsx` 내 통합 또는 별도 컴포넌트)**:
        *   현재 스테이지 정보 (예: "1-3. 어둠의 숲") 표시.
        *   현재 전투 중인 몬스터 이름 및 레벨 표시.
        *   다음 보스 등장까지 남은 몬스터 수 또는 진행률 표시.
        *   **파일 위치:** `app/dashboard/page.tsx` 또는 `app/dashboard/StageInfo.tsx` 등.

2.  **사용자 흐름 및 상호작용**:
    *   사용자가 게임(메인 대시보드)에 접속하면 자동으로 전투 시작.
    *   **전투 로직 (클라이언트 측 핵심 루프)**:
        1.  **타겟팅:** 현재 스테이지의 몬스터를 자동으로 타겟팅.
        2.  **이동 (선택적):** 캐릭터가 몬스터에게 접근하는 모션 (단순화 가능).
        3.  **공격/스킬 사용:**
            *   기본 공격 자동 시전 (일정 공격 속도 간격).
            *   장착된 스킬 자동 사용 (쿨타임 및 사용 조건 충족 시). 스킬 사용 우선순위 로직 필요.
        4.  **피격:** 몬스터의 공격에 의해 캐릭터가 피해를 입음.
        5.  **몬스터 처치:** 몬스터 HP가 0 이하가 되면 처치 처리.
            *   처치 애니메이션 재생.
            *   재화/아이템 획득 로직 호출 (기능 3 연계).
            *   다음 몬스터 등장 또는 다음 스테이지 이동 조건 확인 (기능 4 연계).
        6.  **캐릭터 사망 (선택적 초기 구현):** 캐릭터 HP가 0 이하가 되면 사망 처리. (초기 버전에서는 사망 없이 무한 전투 또는 매우 낮은 확률로 사망 후 부활 로직 적용 가능)
    *   **상호작용:** 기본적으로 자동 진행되므로 직접적인 사용자 상호작용은 없음. 사용자는 전투 과정을 시각적으로 관찰. (향후 스킬 수동 사용 등 기능 추가 시 상호작용 추가될 수 있음)

3.  **API 연동**:
    *   **초기 상태 로드:** 페이지 진입 시 사용자의 현재 캐릭터 스탯, 장착 스킬, 현재 진행 중인 스테이지 정보 등을 백엔드에서 로드. (Server Component 또는 초기 Client Component fetch). Supabase 클라이언트로 `user_game_data`, `user_characters`, `user_equipped_skills` 등 테이블 조회.
    *   **전투 결과 저장:** 일정 주기 또는 주요 이벤트(보스 클리어 등) 발생 시, 전투 결과(진행 스테이지, 누적 획득 재화/아이템 - 기능 3 연계)를 백엔드에 저장 (Server Action 사용).
    *   **핵심 전투 로직 위치:**
        *   **방법 1 (클라이언트 중심):** 대부분의 전투 계산(데미지, 스킬 쿨타임 등) 및 상태 업데이트를 클라이언트 측에서 수행. 서버는 주기적으로 상태를 동기화하고 검증하는 역할. (구현 용이성, 즉각적인 시각 피드백 장점. 보안/정합성 검증 필요) - **Front-end first 방식에 적합**
        *   **방법 2 (서버 중심):** 핵심 전투 로직을 서버(Route Handler 또는 별도 서버)에서 처리하고, 클라이언트는 결과를 받아 시각적으로 표시만 함. (보안/정합성 장점. 실시간 통신 복잡성 증가)
    *   *Front-end first 이므로, 우선 **클라이언트 중심**으로 전투 로직 및 시뮬레이션을 구현. 이후 백엔드 기능 구현 시 서버와의 상태 동기화 및 결과 저장 API(Server Action) 연동.*

4.  **테스트 항목**:
    *   캐릭터와 몬스터가 전투 장면에 정상적으로 표시되는지 확인.
    *   캐릭터/몬스터의 상태(Idle, Attack, Hit, Die)에 따른 애니메이션이 재생되는지 확인.
    *   자동 공격 및 스킬 사용이 설정된 로직(공격 속도, 쿨타임)에 따라 실행되는지 확인.
    *   데미지 계산이 캐릭터 스탯, 스킬 레벨, 몬스터 방어력 등을 기반으로 (초기 단순화된 공식으로라도) 이루어지는지 확인.
    *   데미지 숫자가 전투 장면에 정상적으로 표시되는지 확인.
    *   몬스터 HP 바가 데미지에 따라 감소하고, 0 이하 시 몬스터가 처치 처리되는지 확인.
    *   몬스터 처치 시 다음 몬스터가 등장하는 로직이 작동하는지 확인.
    *   획득 관련 로직(기능 3)이 몬스터 처치 시 정상적으로 호출되는지 확인.
    *   전투 관련 정보(스테이지, 몬스터 이름 등)가 정확히 표시되는지 확인.
    *   장시간 자동 전투 시 메모리 누수나 성능 저하가 없는지 확인.

---

### **백엔드 기능명세서**

1.  **API 정의**:
    *   **게임 상태 로드 API (페이지 로드 시 Server Component/Route Handler 또는 Client Component fetch)**:
        *   **목적:** 클라이언트가 전투 시작에 필요한 사용자 게임 상태(캐릭터 정보, 스탯, 장비, 스킬, 현재 스테이지 등) 로드.
        *   **엔드포인트/방식:**
            *   **Server Component:** `app/dashboard/page.tsx` 내에서 직접 Supabase 서버 클라이언트를 사용하여 데이터 조회 후 Client Component(예: `BattleScene`)에 props로 전달.
            *   **Route Handler:** `app/api/game-state/route.ts` (GET) - 클라이언트가 fetch 요청.
            *   **Client Component fetch:** Client Component 내에서 `useEffect` 등을 사용하여 Supabase 클라이언트(`createClient`)로 직접 데이터 조회.
        *   **처리 로직:** 인증된 사용자의 ID를 기반으로 `user_characters`, `user_game_data`, `user_equipped_items`, `user_equipped_skills`, `game_monsters`, `game_stages` 등 관련 테이블에서 필요한 데이터 조회 및 반환.
        *   **파일 위치:** (Server Component 방식 사용 시) `app/dashboard/page.tsx`, (Route Handler 방식 사용 시) `app/api/game-state/route.ts`. Supabase 클라이언트 초기화는 `utils/supabase/server.ts` 또는 `utils/supabase/client.ts` 활용.
    *   **전투 결과 저장 API (Server Action 권장)**:
        *   **목적:** 클라이언트에서 진행된 전투 결과(현재 스테이지, 클리어 타임, 획득 데이터 요약 등)를 서버에 저장/업데이트. (기능 3의 `recordLoot`과 통합 또는 별도 Action 구성 가능)
        *   **Server Action 함수 명세 (`actions/game.ts`)**:
            ```typescript
            // actions/game.ts
            'use server'

            import { createClient } from '@/utils/supabase/server'
            import { revalidatePath } from 'next/cache'

            interface BattleResultData {
              currentStageId: string;
              // 필요시 추가 데이터: 클리어 시간, 보스 처치 여부 등
              // 획득 데이터는 recordLoot Action을 통해 별도 처리하거나 여기에 포함 가능
            }

            export async function saveBattleProgress(resultData: BattleResultData): Promise<{ success: boolean; message?: string }> {
              const supabase = createClient();
              const { data: { user } } = await supabase.auth.getUser(); // 인증 체크는 필수

              if (!user) return { success: false, message: '사용자 인증 실패' };

              try {
                const { error } = await supabase
                  .from('user_game_data')
                  .update({
                    current_stage_id: resultData.currentStageId,
                    updated_at: new Date().toISOString()
                  })
                  .eq('user_id', user.id);

                if (error) throw error;

                revalidatePath('/dashboard'); // 관련 페이지 캐시 무효화

                return { success: true };
              } catch (error: any) {
                console.error('Error saving battle progress:', error.message);
                return { success: false, message: '전투 진행 상황 저장 실패: ' + error.message };
              }
            }
            ```
        *   **파일 위치:** `actions/game.ts`

2.  **데이터베이스 설계 및 연동**:
    *   **`user_game_data` 테이블**: `current_stage_id` 등 전투 진행 상태 저장 필드 필요.
    *   **`user_characters` 테이블**: 캐릭터 스탯 (HP, MP, 공격력, 방어력, 공격 속도 등) 저장.
    *   **`user_equipped_items` / `user_inventory` 테이블**: 장착된 장비 정보 (스탯 영향).
    *   **`user_equipped_skills` / `user_skills` 테이블**: 장착/습득한 스킬 정보 (ID, 레벨).
    *   **`game_stages` 테이블**: 스테이지 정보 (ID, 이름, 등장 몬스터 목록, 보스 정보, 요구 전투력 등).
    *   **`game_monsters` 테이블**: 몬스터 정보 (ID, 이름, 레벨, HP, 공격력, 방어력, 제공 경험치/골드, 드랍 아이템 테이블 ID 등).
    *   **`game_skills` 테이블**: 스킬 정보 (ID, 이름, 효과, 쿨타임, 필요 MP 등).
    *   *(위 테이블들은 Supabase 대시보드 또는 SQL 마이그레이션 스크립트로 생성 및 관리)*
    *   **연동 로직:** Server Component 또는 API Route Handler/Server Action 내에서 Supabase 클라이언트를 사용하여 관련 테이블 조회(`select`) 및 업데이트(`update`).

3.  **테스트 항목**:
    *   게임 상태 로드 시 필요한 모든 데이터(캐릭터 스탯, 장비, 스킬, 스테이지 정보 등)가 정확히 반환되는지 확인.
    *   `saveBattleProgress` Action 호출 시 `user_game_data` 테이블의 `current_stage_id`가 정상적으로 업데이트되는지 확인.
    *   인증되지 않은 사용자의 API 호출이 거부되는지 확인.
    *   잘못된 데이터 형식으로 Action 호출 시 에러 처리 및 데이터 무결성 유지 확인.
    *   스테이지/몬스터/스킬 데이터 조회 시 성능 문제 없는지 확인 (필요시 인덱싱).

---
