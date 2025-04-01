---

## **기능명세서: 10. 스킬 시스템 (기본)**

**개발 우선순위:** Phase 2 (핵심 게임 루프 구현)

### **프론트엔드 기능명세서**

1.  **화면 레이아웃 및 디자인 명세**:
    *   **스킬 목록 화면 (`app/skills/page.tsx`)**:
        *   사용자가 습득한 스킬 목록 및 습득 가능한 스킬 목록을 표시. 탭(액티브/패시브) 또는 필터로 구분 가능.
        *   **표시 정보:** 스킬 아이콘, 이름, 현재 레벨/최대 레벨, (습득 가능 시) 필요 포인트/조건.
        *   각 스킬은 클릭 가능하여 상세 정보 팝업을 열 수 있음.
        *   **ShadCN 컴포넌트 활용:** `Tabs` (액티브/패시브 구분), `Card` (스킬 정보 요약), `Button` (습득/강화 액션 유도), `ScrollArea`.
        *   **파일 위치:** `app/skills/page.tsx`, `app/skills/SkillList.tsx`, `app/skills/SkillCard.tsx`.
    *   **스킬 상세 정보 팝업 (`components/features/SkillDetailDialog.tsx`)**:
        *   스킬 목록에서 스킬 클릭 시 표시되는 모달 창.
        *   **표시 정보:** 스킬 아이콘, 이름, 타입(액티브/패시브), 현재 레벨, 다음 레벨 효과(존재 시), 스킬 설명, 쿨타임(액티브), 필요 마나(액티브), 현재 레벨 효과 상세.
        *   **액션 버튼:**
            *   '습득': 아직 배우지 않은 스킬일 경우 (조건 충족 시 활성화).
            *   '강화': 배운 스킬이고 최대 레벨이 아닐 경우 (조건 충족 시 활성화). 필요 포인트/재화 표시.
            *   '장착'(액티브 스킬 전용): 배우고 장착하지 않은 액티브 스킬일 경우.
            *   '해제'(액티브 스킬 전용): 장착 중인 액티브 스킬일 경우.
        *   **ShadCN 컴포넌트 활용:** `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `Button`, `Badge` (스킬 타입 표시), `Separator`.
        *   **파일 위치:** `components/features/SkillDetailDialog.tsx`.
    *   **액티브 스킬 슬롯 UI (`app/dashboard/ActiveSkillSlots.tsx`)**:
        *   메인 게임 화면(`app/dashboard/page.tsx`)의 일부에 표시.
        *   정해진 개수(예: 4~6개)의 슬롯 표시.
        *   각 슬롯에는 장착된 액티브 스킬 아이콘 표시. 빈 슬롯은 기본 이미지.
        *   슬롯 클릭 시 해당 스킬 상세 정보 팝업 표시 또는 간단한 해제 기능 제공.
        *   자동 전투 중 스킬 사용 시 쿨타임 시각화 (예: 어두워지는 오버레이, 타이머 텍스트).
        *   **ShadCN 컴포넌트 활용:** 슬롯 자체는 커스텀 컴포넌트일 가능성이 높으나, 쿨타임 표시에 `Progress` (변형) 또는 텍스트 활용 가능. 슬롯 배경 등에 `Card` 변형 사용 가능.
        *   **파일 위치:** `app/dashboard/ActiveSkillSlots.tsx`, `app/dashboard/SkillSlot.tsx`.
    *   **보유 스킬 포인트 표시:**
        *   스킬 목록 화면 상단 또는 캐릭터 정보 화면에 현재 보유 스킬 포인트(SP) 표시.
        *   **파일 위치:** `app/skills/page.tsx` 또는 `app/character/page.tsx`.

2.  **사용자 흐름 및 상호작용**:
    *   **스킬 확인:** 스킬 목록 화면에서 습득/미습득 스킬 정보 확인.
    *   **스킬 습득:** 상세 정보 팝업에서 '습득' 버튼 클릭 > 스킬 포인트 차감 > 스킬 목록 업데이트 (습득됨 표시, 레벨 1) > 보유 스킬 포인트 UI 업데이트.
    *   **스킬 강화:** 상세 정보 팝업에서 '강화' 버튼 클릭 > 스킬 포인트/재화 차감 > 스킬 레벨 증가 > 스킬 목록 및 상세 정보 UI 업데이트 > 보유 스킬 포인트 UI 업데이트.
    *   **스킬 장착 (액티브):**
        *   상세 정보 팝업에서 '장착' 버튼 클릭 > (빈 슬롯 선택 UI 또는 자동 빈 슬롯 찾기) > 해당 스킬이 액티브 스킬 슬롯 UI에 표시됨. 상세 정보 팝업 버튼 상태 변경 ('해제').
        *   (드래그 앤 드롭 방식도 고려 가능: 스킬 목록에서 슬롯으로 끌어다 놓기)
    *   **스킬 해제 (액티브):**
        *   상세 정보 팝업에서 '해제' 버튼 클릭 > 액티브 스킬 슬롯 UI에서 해당 스킬 제거. 상세 정보 팝업 버튼 상태 변경 ('장착').
        *   액티브 스킬 슬롯 UI에서 직접 해제.
    *   **자동 전투 연동:** 자동 전투 시스템(기능 2)은 액티브 스킬 슬롯 UI의 정보를 참조하여, 장착된 스킬을 쿨타임 및 조건에 따라 자동으로 사용. 사용 시 해당 스킬 슬롯 UI에 쿨타임 시각화 적용.

3.  **API 연동**:
    *   **스킬 데이터 로드:**
        *   `game_skills`: 모든 스킬의 기본 정보 (Server Component 또는 초기 fetch).
        *   `user_skills`: 사용자가 습득한 스킬 목록 및 레벨 (Server Component 또는 초기 fetch).
        *   `user_equipped_skills`: 사용자가 장착한 액티브 스킬 및 슬롯 정보 (Server Component 또는 초기 fetch).
        *   `user_characters` 또는 `user_game_data`: 현재 보유 스킬 포인트 (Server Component 또는 초기 fetch).
    *   **Server Action 호출:**
        *   `learnSkill(skillId: string)`
        *   `upgradeSkill(userSkillId: string)` (또는 `skillId` 사용)
        *   `equipSkill(userSkillId: string, slotIndex: number)`
        *   `unequipSkill(userSkillId: string)`

4.  **테스트 항목**:
    *   스킬 목록(습득/미습득), 상세 정보, 액티브 슬롯 UI가 정확하게 표시되는지 확인.
    *   스킬 습득 시 스킬 포인트 차감, 스킬 목록 업데이트, UI 반영이 정상 작동하는지 확인.
    *   스킬 강화 시 포인트/재화 차감, 레벨 증가, UI 반영이 정상 작동하는지 확인.
    *   조건 미충족(포인트 부족, 최대 레벨 등) 시 습득/강화 버튼 비활성화 또는 클릭 시 오류 메시지 표시 확인.
    *   액티브 스킬 장착/해제가 슬롯 UI 및 상세 정보 버튼 상태에 올바르게 반영되는지 확인.
    *   최대 슬롯 개수 초과하여 장착 시도 시 처리가 올바른지 확인 (교체 또는 실패).
    *   자동 전투 시 장착된 액티브 스킬이 정상적으로 사용되고 슬롯 UI에 쿨타임이 표시되는지 확인.

---

### **백엔드 기능명세서**

1.  **API 정의**:
    *   **스킬 관련 데이터 제공 API (Server Component / Route Handler)**:
        *   **목적:** 클라이언트에 필요한 스킬 데이터(전체 스킬 정보, 사용자 습득 스킬, 장착 스킬, 보유 포인트) 제공.
        *   **처리 로직:** 인증된 사용자의 `userId` 기반으로 `game_skills`, `user_skills`, `user_equipped_skills`, `user_characters`(또는 `user_game_data`) 테이블 조회.
        *   효율적인 조회를 위해 필요시 조인 사용.
    *   **Server Action `learnSkill(skillId: string)`**:
        *   **파일 위치:** `actions/skills.ts`
        *   **처리 로직:**
            1.  사용자 인증 확인.
            2.  `game_skills` 테이블에서 `skillId` 정보 조회 (습득 필요 포인트, 선행 조건 등 확인).
            3.  `user_characters` (또는 `user_game_data`) 테이블에서 현재 스킬 포인트 조회.
            4.  `user_skills` 테이블에서 `skillId` 이미 습득했는지 확인.
            5.  **조건 검증:** 포인트 충분한지, 선행 스킬 조건 만족하는지, 이미 배운 스킬 아닌지.
            6.  **트랜잭션 시작 (DB 함수 권장):**
                *   `user_skills` 테이블에 `{ user_id, skill_id, level: 1 }` 삽입.
                *   `user_characters` (또는 `user_game_data`) 테이블의 `skill_points` 차감.
            7.  **트랜잭션 종료.**
            8.  성공/실패 결과 반환. `revalidatePath` 호출 (`/skills`, `/character`).
    *   **Server Action `upgradeSkill(userSkillId: string)`**:
        *   **파일 위치:** `actions/skills.ts`
        *   **처리 로직:**
            1.  사용자 인증 확인.
            2.  `userSkillId`로 `user_skills` 테이블 조회 (소유권, 현재 레벨 확인). `skill_id` 가져오기.
            3.  `game_skills` 테이블에서 해당 `skill_id` 정보 조회 (최대 레벨, 레벨업 필요 포인트/재화 확인).
            4.  `user_characters` (또는 `user_game_data`) 테이블에서 현재 스킬 포인트/재화 조회.
            5.  **조건 검증:** 최대 레벨 미만인지, 포인트/재화 충분한지.
            6.  **트랜잭션 시작 (DB 함수 권장):**
                *   `user_skills` 테이블의 `level` 1 증가 업데이트.
                *   `user_characters` (또는 `user_game_data`) 테이블의 `skill_points` 및 재화 차감.
            7.  **트랜잭션 종료.**
            8.  성공/실패 결과 반환. `revalidatePath` 호출.
    *   **Server Action `equipSkill(userSkillId: string, slotIndex: number)`**:
        *   **파일 위치:** `actions/skills.ts`
        *   **처리 로직:**
            1.  사용자 인증 확인.
            2.  `userSkillId`로 `user_skills` 조회 (소유권 확인). `skill_id` 가져오기.
            3.  `game_skills` 테이블에서 해당 `skill_id` 정보 조회 (액티브 스킬인지 확인).
            4.  `slotIndex` 유효성 검증 (0 ~ 최대 슬롯 수 - 1).
            5.  `user_equipped_skills` 테이블에서 `user_id` 와 `slotIndex` 가 동일한 기존 장착 정보 조회.
            6.  **처리:**
                *   해당 슬롯에 이미 스킬이 있다면, 해당 레코드 삭제 또는 `slot_index`를 null로 업데이트 (정책에 따라).
                *   `user_equipped_skills` 테이블에 `{ user_id, user_skill_id: userSkillId, slot_index: slotIndex }` 삽입 또는 업데이트 (기존에 다른 슬롯에 있었다면 이동 처리). Supabase의 `upsert` 활용 가능.
            7.  성공/실패 결과 반환. `revalidatePath` 호출 (`/dashboard`, `/skills`).
    *   **Server Action `unequipSkill(userSkillId: string)`**:
        *   **파일 위치:** `actions/skills.ts`
        *   **처리 로직:**
            1.  사용자 인증 확인.
            2.  `user_equipped_skills` 테이블에서 `user_id`와 `user_skill_id`가 일치하는 레코드 조회 및 삭제.
            3.  성공/실패 결과 반환. `revalidatePath` 호출.

2.  **데이터베이스 설계 및 연동**:
    *   **`game_skills` 테이블**:
        *   `id` (varchar or int, PK), `name` (text), `description` (text), `skill_type` (text, check in ('active', 'passive')), `icon_url` (text), `max_level` (int), `cooldown_ms` (int, nullable), `mana_cost` (int, nullable), `prerequisite_skill_id` (varchar or int, FK nullable), `prerequisite_level` (int, nullable).
        *   효과/레벨 스케일링 정보: `base_effect` (jsonb), `level_scaling` (jsonb) - 예: `{"damage_multiplier": 1.5, "duration_ms": 3000}`, `{"damage_multiplier_per_level": 0.1}`
    *   **`user_skills` 테이블**:
        *   `id` (uuid, PK, default `gen_random_uuid()`)
        *   `user_id` (uuid, FK to auth.users.id, not null)
        *   `skill_id` (varchar or int, FK to game_skills.id, not null)
        *   `level` (integer, default 1, not null)
        *   `acquired_at` (timestamptz, default `now()`, not null)
        *   Unique constraint: `(user_id, skill_id)`
        *   RLS 정책 필수.
    *   **`user_equipped_skills` 테이블**:
        *   `user_id` (uuid, FK to auth.users.id, not null)
        *   `user_skill_id` (uuid, FK to user_skills.id, not null)
        *   `slot_index` (integer, not null) - 0부터 시작.
        *   Primary Key: `(user_id, slot_index)`
        *   Unique constraint: `(user_id, user_skill_id)` - 한 스킬은 한 슬롯에만 장착 가능.
        *   RLS 정책 필수.
    *   **`user_characters` 또는 `user_game_data` 테이블**:
        *   `skill_points` (integer, default 0, not null) 컬럼 추가.
    *   **연동 로직:** Server Action 내에서 Supabase 클라이언트 사용. 트랜잭션 보장을 위해 DB 함수 또는 Supabase Edge Function 사용 권장 (특히 포인트 차감 관련).

3.  **테스트 항목**:
    *   스킬 관련 데이터 API가 정확한 정보를 반환하는지 확인.
    *   `learnSkill` 액션: 포인트 차감, `user_skills` 삽입, 조건 검증(포인트 부족, 선행 스킬, 중복 습득) 확인.
    *   `upgradeSkill` 액션: 포인트/재화 차감, `user_skills` 레벨 업데이트, 조건 검증(최대 레벨, 포인트 부족) 확인.
    *   `equipSkill` 액션: `user_equipped_skills` 삽입/업데이트/삭제(교체 시) 확인. 슬롯 인덱스 유효성 검증 확인. 액티브 스킬만 장착 가능한지 확인.
    *   `unequipSkill` 액션: `user_equipped_skills` 삭제 확인.
    *   모든 액션에서 사용자 인증 및 소유권 검증이 올바르게 작동하는지 확인.
    *   트랜잭션 관련 액션(습득, 강화)의 원자성(성공 시 모두 반영, 실패 시 모두 롤백) 확인.
    *   DB 스키마, 제약 조건, RLS 정책 확인.

---
