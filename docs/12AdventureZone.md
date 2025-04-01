---

## **기능명세서: 12. 모험 지역 시스템**

**개발 우선순위:** Phase 3 (주요 부가 기능 및 편의성 개선)

### **프론트엔드 기능명세서**

1.  **화면 레이아웃 및 디자인 명세**:
    *   **모험 지역 선택 UI (`components/features/AdventureZoneDialog.tsx`)**:
        *   메인 대시보드 화면(`app/dashboard/page.tsx`)의 특정 버튼(예: '모험 지역') 클릭 시 열리는 `Dialog` 형태의 UI.
        *   해금된 모험 지역 목록을 `Card` 컴포넌트를 사용하여 그리드 또는 리스트 형태로 표시.
        *   각 `Card`에는 지역 이름, 대표 이미지/아이콘, 특화 자원(골드, 경험치, 특정 아이템 등 - `Badge` 활용), 권장 전투력(선택적), '입장' 버튼 표시.
        *   아직 해금되지 않은 지역은 비활성화(disabled) 상태 또는 '해금 조건' (예: "월드 1 보스 클리어") 툴팁(`Tooltip`) 표시.
        *   상단 또는 하단에 '닫기' 버튼 제공.
        *   **ShadCN 컴포넌트 활용:** `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter`, `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `Button`, `Badge`, `Tooltip`, `ScrollArea`.
        *   **파일 위치:** `components/features/AdventureZoneDialog.tsx`.
    *   **메인 대시보드 상태 표시 업데이트**:
        *   `app/dashboard/StageInfo.tsx` (또는 유사 컴포넌트): 현재 위치가 메인 스테이지인지, 특정 모험 지역인지 텍스트로 구분하여 표시 (예: "모험 지역: 고대 금광").
        *   `app/dashboard/page.tsx`: 모험 지역에 입장해 있는 동안에는 '메인 스테이지로 복귀' 버튼 표시. (ShadCN `Button`)
        *   `app/dashboard/BattleScene.tsx`: 모험 지역 입장 시 해당 지역 테마에 맞는 배경 이미지로 변경.

2.  **사용자 흐름 및 상호작용**:
    *   사용자가 메인 대시보드에서 '모험 지역' 버튼 클릭 > 모험 지역 선택 `Dialog` 열림.
    *   사용자는 해금된 지역 목록 확인. 특화 자원 등 정보 확인 후 원하는 지역의 '입장' 버튼 클릭.
    *   '입장' 버튼 클릭 시 입장 처리 API(Server Action) 호출 및 로딩 상태 표시.
    *   성공 응답 시:
        *   모험 지역 선택 `Dialog` 닫힘.
        *   메인 대시보드 UI 업데이트:
            *   `StageInfo` 컴포넌트에 현재 위치가 해당 모험 지역으로 표시됨.
            *   `BattleScene` 배경 변경.
            *   등장 몬스터가 해당 모험 지역 몬스터로 변경됨 (자동 전투 시스템 연동).
            *   '메인 스테이지로 복귀' 버튼 표시됨.
        *   자동 전투는 해당 모험 지역에서 계속 진행되며, 특화 자원 드랍률이 적용됨 (기능 2, 3 연동).
    *   사용자가 '메인 스테이지로 복귀' 버튼 클릭 > 복귀 처리 API(Server Action) 호출 및 로딩 상태 표시.
    *   성공 응답 시:
        *   메인 대시보드 UI가 이전에 진행 중이던 메인 스테이지 상태로 복귀.
        *   `StageInfo` 컴포넌트, `BattleScene` 배경, 등장 몬스터가 메인 스테이지 기준으로 변경됨.
        *   '메인 스테이지로 복귀' 버튼 숨김.
        *   자동 전투는 메인 스테이지에서 계속 진행됨.

3.  **API 연동**:
    *   **모험 지역 목록 및 해금 상태 로드:**
        *   모험 지역 선택 `Dialog` 열릴 때, Server Component 데이터 전달 또는 Client Component 내 `useEffect`에서 Supabase 클라이언트를 사용하여 `game_adventure_zones` 및 `user_unlocked_adventure_zones` (또는 `user_cleared_stages` 참조) 데이터 fetch. 해금 조건(클리어한 보스 스테이지 ID 등) 비교하여 상태 결정.
    *   **Server Action 호출:**
        *   `enterAdventureZone(zoneId: string)`: 모험 지역 입장 시.
        *   `returnToMainStage()`: 메인 스테이지 복귀 시.

4.  **테스트 항목**:
    *   모험 지역 선택 UI가 정상적으로 열리고 닫히는지 확인.
    *   해금된 지역과 잠긴 지역이 올바르게 구분되어 표시되는지, 해금 조건 툴팁이 뜨는지 확인.
    *   지역 '입장' 시 메인 대시보드 UI(지역명 표시, 배경, 복귀 버튼)가 올바르게 업데이트되는지 확인.
    *   입장 후 전투 시 해당 모험 지역 몬스터가 등장하고 특화 자원 획득이 반영되는지 확인 (기능 2, 3 연동 후).
    *   '메인 스테이지로 복귀' 시 메인 대시보드 UI가 이전 메인 스테이지 상태로 올바르게 복구되는지 확인.
    *   잠긴 지역 입장 시도 시 실패 처리되는지 확인 (백엔드 연동 후).
    *   Server Action 호출 및 응답 처리가 정상적으로 이루어지는지 확인.

---

### **백엔드 기능명세서**

1.  **API 정의**:
    *   **모험 지역 데이터 제공 API (게임 상태 로드 API 통합 또는 별도)**:
        *   **목적:** 클라이언트에 `game_adventure_zones` 목록과 사용자별 해금 상태 제공.
        *   **처리 로직:**
            1.  `game_adventure_zones` 테이블 전체 데이터 조회.
            2.  사용자의 `user_cleared_stages` 테이블(보스 스테이지 클리어 기록) 또는 `user_unlocked_adventure_zones` 테이블 조회.
            3.  각 `game_adventure_zones` 레코드의 `required_boss_clear_stage_id`와 사용자 클리어 기록 비교하여 `isUnlocked` 필드 추가 후 반환.
        *   **반환 데이터 예시:** `[{ id: 'gold_mine', name: '고대 금광', ..., required_boss_clear_stage_id: '1-10', isUnlocked: true }, ...]`
    *   **Server Action `enterAdventureZone(zoneId: string)`**:
        *   **파일 위치:** `actions/adventure.ts` (또는 `actions/game.ts`)
        *   **처리 로직:**
            1.  사용자 인증 확인.
            2.  `zoneId`로 `game_adventure_zones` 조회 (존재 여부 및 `required_boss_clear_stage_id` 확인).
            3.  사용자의 해당 `required_boss_clear_stage_id` 클리어 여부 확인 (`user_cleared_stages` 조회).
            4.  **조건 검증:** 사용자가 해당 지역을 해금했는가?
            5.  **업데이트:** `user_game_data` 테이블 업데이트:
                *   `current_location_type` = `'adventure'`
                *   `current_adventure_zone_id` = `zoneId`
                *   `updated_at` = `now()`
            6.  성공/실패 결과 반환. `revalidatePath('/dashboard')`.
    *   **Server Action `returnToMainStage()`**:
        *   **파일 위치:** `actions/adventure.ts` (또는 `actions/game.ts`)
        *   **처리 로직:**
            1.  사용자 인증 확인.
            2.  **업데이트:** `user_game_data` 테이블 업데이트:
                *   `current_location_type` = `'main'`
                *   `current_adventure_zone_id` = `null`
                *   `updated_at` = `now()`
            3.  성공/실패 결과 반환. `revalidatePath('/dashboard')`.

2.  **데이터베이스 설계 및 연동**:
    *   **`game_adventure_zones` 테이블**:
        *   `id` (varchar or int, PK)
        *   `name` (text, not null)
        *   `description` (text)
        *   `icon_url` (text)
        *   `background_url` (text)
        *   `specialized_resource` (text, not null) - 예: 'gold', 'exp', 'item_grade_rare', 'item_type_weapon'
        *   `resource_bonus_multiplier` (numeric, default 1.0) - 특화 자원 획득 배율
        *   `monsters` (jsonb) - 등장 몬스터 ID 및 확률 목록. 예: `[{"monsterId": "gold_goblin", "chance": 0.8}, {"monsterId": "gem_slime", "chance": 0.2}]`
        *   `required_boss_clear_stage_id` (varchar or int, FK to game_stages.id, nullable) - 해금 조건.
        *   `required_power` (integer, nullable) - 권장 전투력.
        *   RLS 정책 (읽기 전용 허용) 권장.
    *   **`user_game_data` 테이블**:
        *   `current_location_type` (text, default 'main', not null, check (`current_location_type` in ('main', 'adventure'))) 컬럼 추가.
        *   `current_adventure_zone_id` (varchar or int, FK to game_adventure_zones.id, nullable) 컬럼 추가.
    *   **`user_cleared_stages` 테이블** (기존 정의됨): `required_boss_clear_stage_id` 해금 조건 확인에 사용.
    *   **(선택적) `user_unlocked_adventure_zones` 테이블**: 명시적으로 해금 상태 관리 시 사용. `user_id` (FK), `adventure_zone_id` (FK), `unlocked_at`. 복합 PK `(user_id, adventure_zone_id)`.
    *   **연동 로직:** Server Action 내에서 Supabase 클라이언트 사용하여 관련 테이블 조회 및 업데이트. 해금 조건 검증 로직 중요.

3.  **테스트 항목**:
    *   모험 지역 데이터 API가 각 지역 정보와 사용자별 해금 상태(`isUnlocked`)를 정확하게 반환하는지 확인.
    *   `enterAdventureZone` 액션: 해금 조건 검증이 올바르게 작동하는지 확인 (해금된 지역만 입장 가능). 성공 시 `user_game_data`의 `current_location_type`과 `current_adventure_zone_id`가 정확히 업데이트되는지 확인.
    *   `returnToMainStage` 액션: 성공 시 `user_game_data`의 `current_location_type`과 `current_adventure_zone_id`가 'main'과 null로 올바르게 업데이트되는지 확인.
    *   사용자 인증 및 유효하지 않은 `zoneId` 처리 확인.
    *   `game_adventure_zones` 테이블의 몬스터 목록 및 특화 자원 정보가 올바르게 정의되었는지 확인.
    *   DB 스키마, 제약 조건, RLS 정책 확인.

---
