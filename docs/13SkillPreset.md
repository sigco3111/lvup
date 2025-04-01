---

## **기능명세서: 13. 스킬 프리셋 기능**

**개발 우선순위:** Phase 3 (주요 부가 기능 및 편의성 개선)

### **프론트엔드 기능명세서**

1.  **화면 레이아웃 및 디자인 명세**:
    *   **스킬 프리셋 UI (`components/features/SkillPresetSelector.tsx`)**:
        *   스킬 관련 화면(`app/skills/page.tsx`) 또는 메인 대시보드(`app/dashboard/page.tsx`)의 액티브 스킬 슬롯 근처에 배치.
        *   **프리셋 선택:** 현재 활성화된 프리셋 번호(또는 이름)를 표시하고, 다른 프리셋(예: 1, 2, 3)을 선택할 수 있는 드롭다운 또는 탭 형태의 UI. (ShadCN `Select`, `Tabs`, `RadioGroup`, `DropdownMenu` 활용 가능)
        *   **프리셋 액션 버튼:**
            *   '현재 스킬 저장' 버튼: 현재 액티브 슬롯에 장착된 스킬 구성을 선택된 프리셋 번호에 저장. (ShadCN `Button`, `Tooltip`으로 설명 추가)
            *   '프리셋 로드' 버튼 (선택적): 드롭다운/탭에서 프리셋을 선택하는 즉시 로드되도록 구현하면 불필요. 명시적 로드를 원할 경우 추가. (ShadCN `Button`)
        *   **(선택적) 프리셋 이름 변경:** 프리셋 번호 옆에 편집 아이콘 버튼 추가, 클릭 시 `Dialog`와 `Input`을 이용해 이름 변경 기능 제공.
        *   **ShadCN 컴포넌트 활용:** 주요 상호작용은 `Select`/`Tabs`/`RadioGroup`/`DropdownMenu`, `Button`, `Tooltip`, `Dialog`, `Input` 등 활용.
        *   **파일 위치:** `components/features/SkillPresetSelector.tsx`. 이를 `app/skills/page.tsx` 또는 `app/dashboard/page.tsx`에 포함.
    *   **액티브 스킬 슬롯 UI 업데이트 (`app/dashboard/ActiveSkillSlots.tsx`)**:
        *   프리셋 로드 시, 해당 프리셋에 저장된 스킬 구성으로 즉시 업데이트되어야 함. 기존 슬롯 UI 재활용.

2.  **사용자 흐름 및 상호작용**:
    *   **프리셋 저장:**
        1.  사용자가 원하는 스킬을 액티브 슬롯(`ActiveSkillSlots.tsx`)에 장착.
        2.  프리셋 UI(`SkillPresetSelector.tsx`)에서 저장할 프리셋 번호(예: '프리셋 2')를 선택.
        3.  '현재 스킬 저장' 버튼 클릭.
        4.  저장 요청 API(Server Action) 호출 및 로딩 상태 표시.
        5.  성공 응답 시 "프리셋 2에 저장되었습니다." 메시지 표시 (ShadCN `Toast`).
    *   **프리셋 로드:**
        1.  사용자가 프리셋 UI에서 로드할 프리셋 번호(예: '프리셋 1')를 선택 (Select, Tabs 등).
        2.  선택과 동시에 로드 요청 API(Server Action) 호출 (또는 '프리셋 로드' 버튼 클릭). 로딩 상태 표시.
        3.  성공 응답 시:
            *   액티브 스킬 슬롯 UI(`ActiveSkillSlots.tsx`)가 '프리셋 1'에 저장된 스킬 구성으로 즉시 변경됨.
            *   "프리셋 1을 로드했습니다." 메시지 표시.
    *   **(선택적) 프리셋 이름 변경:**
        1.  편집 아이콘 클릭 > 이름 변경 `Dialog` 열림.
        2.  새 이름 입력 후 '저장' 클릭 > 이름 변경 API(Server Action) 호출.
        3.  성공 시 `Dialog` 닫히고 프리셋 UI의 이름 업데이트.

3.  **API 연동**:
    *   **프리셋 데이터 로드:** 페이지 로드 시 사용자의 모든 스킬 프리셋 정보(`user_skill_presets`)를 fetch하여 프리셋 UI 구성 (Server Component 데이터 전달 또는 Client fetch).
    *   **Server Action 호출:**
        *   `saveSkillPreset(presetIndex: number, userSkillIds: string[])`: 현재 장착된 스킬의 `user_skills.id` 목록을 전달하여 저장.
        *   `loadSkillPreset(presetIndex: number)`: 선택한 프리셋 로드 요청.
        *   (선택적) `renameSkillPreset(presetIndex: number, newName: string)`: 프리셋 이름 변경 요청.

4.  **테스트 항목**:
    *   프리셋 선택 UI가 정상적으로 표시되고 프리셋 번호/이름 선택이 가능한지 확인.
    *   '현재 스킬 저장' 기능이 올바르게 동작하고 성공 메시지가 표시되는지 확인.
    *   프리셋 로드 시 액티브 스킬 슬롯 UI가 해당 프리셋 구성으로 즉시 변경되는지 확인.
    *   존재하지 않는 프리셋 로드 시도 시 오류 처리 확인.
    *   (구현 시) 프리셋 이름 변경 기능이 정상 작동하고 UI에 반영되는지 확인.
    *   Server Action 호출 및 응답 처리가 올바르게 이루어지는지 확인.

---

### **백엔드 기능명세서**

1.  **API 정의**:
    *   **프리셋 데이터 제공 API (게임 상태 로드 API 통합 또는 별도)**:
        *   **목적:** 클라이언트에 사용자의 저장된 스킬 프리셋 목록(`presetIndex`, `name`, `userSkillIds`) 제공.
        *   **처리 로직:** 인증된 사용자의 `userId`를 기반으로 `user_skill_presets` 테이블 조회.
    *   **Server Action `saveSkillPreset(presetIndex: number, userSkillIds: string[])`**:
        *   **파일 위치:** `actions/skills.ts` (또는 `actions/presets.ts`)
        *   **처리 로직:**
            1.  사용자 인증 확인.
            2.  `presetIndex` 유효성 검증 (예: 1 ~ 최대 프리셋 수).
            3.  `userSkillIds` 배열 유효성 검증 (각 ID가 실제로 사용자의 `user_skills` 레코드인지 확인 - 선택적이지만 권장). 액티브 스킬 최대 슬롯 개수 제한 고려.
            4.  `user_skill_presets` 테이블에 데이터 삽입 또는 업데이트 (`upsert` 사용):
                *   `where`: `user_id` = currentUser.id AND `preset_index` = presetIndex
                *   `data`: `{ user_id, preset_index, user_skill_ids: userSkillIds, name: (기존 이름 유지 또는 기본값) }`
            5.  성공/실패 결과 반환.
    *   **Server Action `loadSkillPreset(presetIndex: number)`**:
        *   **파일 위치:** `actions/skills.ts` (또는 `actions/presets.ts`)
        *   **처리 로직:**
            1.  사용자 인증 확인.
            2.  `presetIndex`로 `user_skill_presets` 테이블에서 해당 프리셋 정보(`user_skill_ids`) 조회. 프리셋이 존재하지 않으면 실패 반환.
            3.  **트랜잭션 시작 (DB 함수 권장):**
                *   현재 장착된 모든 스킬 조회 (`user_equipped_skills` 테이블에서 `user_id` 기준).
                *   조회된 기존 장착 스킬 정보 삭제 (`delete from user_equipped_skills where user_id = ...`).
                *   로드할 프리셋의 `user_skill_ids` 목록을 반복하며 각 `userSkillId`에 대해 `user_equipped_skills` 테이블에 새로운 레코드 삽입 (`insert into user_equipped_skills (user_id, user_skill_id, slot_index)`). `slot_index`는 배열 순서대로 0부터 할당.
            4.  **트랜잭션 종료.**
            5.  성공 시 로드된 스킬 목록(`userSkillIds`와 해당 스킬 정보 - `game_skills` 조인) 반환. `revalidatePath('/dashboard')`. 실패 시 에러 반환.
    *   **(선택적) Server Action `renameSkillPreset(presetIndex: number, newName: string)`**:
        *   **파일 위치:** `actions/skills.ts` (또는 `actions/presets.ts`)
        *   **처리 로직:**
            1.  사용자 인증 확인.
            2.  `presetIndex` 유효성 검증. `newName` 유효성 검증 (길이 제한 등).
            3.  `user_skill_presets` 테이블에서 해당 레코드의 `name` 필드 업데이트.
            4.  성공/실패 결과 반환.

2.  **데이터베이스 설계 및 연동**:
    *   **`user_skill_presets` 테이블 (신규 생성)**:
        *   `id` (uuid, PK, default `gen_random_uuid()`)
        *   `user_id` (uuid, FK to auth.users.id, not null)
        *   `preset_index` (integer, not null) - 예: 1, 2, 3...
        *   `name` (text, nullable) - 프리셋 이름 (선택적).
        *   `user_skill_ids` (uuid[], not null) - 해당 프리셋에 저장된 `user_skills.id` 목록 배열.
        *   `created_at` (timestamptz, default `now()`, not null)
        *   `updated_at` (timestamptz, default `now()`, not null)
        *   Unique constraint: `(user_id, preset_index)`
        *   RLS 정책 필수 적용.
    *   **`user_equipped_skills` 테이블** (기존 정의됨): 프리셋 로드 시 이 테이블의 내용이 갱신됨.
    *   **`user_skills` 테이블** (기존 정의됨): `user_skill_ids` 유효성 검증 및 스킬 정보 조회에 사용.
    *   **연동 로직:** Server Action 내에서 Supabase 클라이언트 사용. `saveSkillPreset`은 `upsert` 로직 필요. `loadSkillPreset`은 삭제 후 삽입 트랜잭션이 필요하므로 DB 함수 사용 권장.

3.  **테스트 항목**:
    *   프리셋 데이터 API가 사용자의 저장된 프리셋 정보를 정확하게 반환하는지 확인.
    *   `saveSkillPreset` 액션: `user_skill_presets` 테이블에 데이터가 올바르게 저장/업데이트 되는지 확인. 유효하지 않은 `userSkillIds` 처리 확인.
    *   `loadSkillPreset` 액션:
        *   트랜잭션 원자성 확인 (기존 장착 삭제 및 신규 장착 삽입이 모두 성공하거나 모두 실패해야 함).
        *   성공 시 `user_equipped_skills` 테이블이 로드된 프리셋 구성으로 완전히 교체되는지 확인.
        *   성공 시 로드된 스킬 목록 정보가 정확히 반환되는지 확인.
        *   존재하지 않는 `presetIndex` 로드 시도 시 실패 처리 확인.
    *   (구현 시) `renameSkillPreset` 액션이 `user_skill_presets` 테이블의 `name`을 올바르게 업데이트하는지 확인.
    *   사용자 인증 및 소유권 검증이 모든 액션에서 작동하는지 확인.
    *   DB 스키마, 제약 조건, RLS 정책 확인.

---
