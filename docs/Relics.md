---

## **기능명세서: 11. 유물 시스템 (기본)**

**개발 우선순위:** Phase 3 (주요 부가 기능 및 편의성 개선) - 난이도: 어려움

### **프론트엔드 기능명세서**

1.  **화면 레이아웃 및 디자인 명세**:
    *   **유물 관리 화면 (`app/relics/page.tsx` 또는 캐릭터 정보 내 탭)**:
        *   **보유 유물 목록 (`app/relics/RelicInventoryList.tsx`)**: 사용자가 보유한 유물들을 `Card` 형태로 표시. 각 카드에는 유물 아이콘, 이름, 등급(테두리/뱃지), 현재 레벨 표시. 클릭 시 상세 정보 팝업 열림. (ShadCN `Card`, `ScrollArea`, `Badge`)
        *   **유물 장착 슬롯 (`app/relics/RelicSlotPanel.tsx`)**: 상단 또는 측면에 고정된 개수(예: 4개)의 슬롯 표시. 각 슬롯에는 장착된 유물의 아이콘 또는 빈 슬롯 이미지 표시. 슬롯 클릭 시 해당 유물 상세 정보 팝업 열리거나 해제 옵션 제공. (커스텀 슬롯 컴포넌트, ShadCN `Tooltip`으로 정보 표시 가능)
        *   **보유 '고대의 정수' 표시**: 화면 어딘가에 현재 보유한 '고대의 정수' 아이콘과 수량 표시. (커스텀 컴포넌트)
        *   **파일 위치:** `app/relics/page.tsx` (페이지 방식 시) 및 관련 컴포넌트 (`app/relics/`), 또는 `app/character/page.tsx` 내 탭 및 관련 컴포넌트.
    *   **유물 상세 정보 팝업 (`components/features/RelicDetailDialog.tsx`)**:
        *   보유 유물 또는 장착 슬롯 클릭 시 열리는 `Dialog`.
        *   **표시 정보:** 유물 아이콘, 이름, 등급, 타입(패시브), 현재 레벨 / 최대 레벨, 현재 레벨에서의 상세 효과 설명, 다음 레벨 효과(강화 가능 시).
        *   **액션 버튼:**
            *   '장착': 보유 중이고 미장착 상태일 때. 클릭 시 슬롯 선택 UI(구현 시) 또는 자동 빈 슬롯 찾기 로직 실행.
            *   '해제': 장착 중일 때.
            *   '강화': 최대 레벨 미만일 때. 버튼에 필요 '고대의 정수' 개수 표시 가능. (재료 부족 시 비활성화)
        *   **강화 UI 영역 (팝업 내 통합)**: '강화' 버튼 근처에 현재 보유 '고대의 정수', 필요 '고대의 정수', (구현 시) 성공 확률 표시.
        *   **ShadCN 컴포넌트 활용:** `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `Button`, `Badge`, `Separator`, `Tooltip`.
        *   **파일 위치:** `components/features/RelicDetailDialog.tsx`.
    *   **유물 획득 알림 (`components/common/Notifications.tsx`)**:
        *   메인 스테이지 보스 최초 클리어 시 "유물 [유물 이름] 획득!" `Toast` 알림 표시.

2.  **사용자 흐름 및 상호작용**:
    *   **유물 획득:** 메인 스테이지 보스 최초 클리어 시 자동으로 획득 (`acquireRelic` Server Action 호출 결과). 획득 알림 표시. 유물 관리 화면 목록에 새 유물 추가됨.
    *   **유물 확인 및 관리:** 사용자가 유물 관리 화면으로 이동하여 보유/장착 유물 확인.
    *   **유물 장착:**
        1.  인벤토리 목록에서 장착할 유물 클릭 > 상세 정보 팝업 열림.
        2.  '장착' 버튼 클릭.
        3.  (구현 방식에 따라) 빈 슬롯 자동 선택 또는 사용자가 슬롯 선택.
        4.  장착 요청 API(Server Action) 호출 및 로딩 상태 표시.
        5.  성공 시 팝업 닫히고, 장착 슬롯 UI 및 인벤토리 상태 업데이트.
        6.  슬롯이 가득 찼을 경우, 교체할 슬롯 선택 UI 표시 또는 장착 불가 메시지.
    *   **유물 해제:**
        1.  장착 슬롯 패널에서 해제할 유물 클릭 > 상세 정보 팝업 열림.
        2.  '해제' 버튼 클릭.
        3.  해제 요청 API(Server Action) 호출 및 로딩 상태 표시.
        4.  성공 시 팝업 닫히고, 장착 슬롯 UI 및 인벤토리 상태 업데이트.
    *   **유물 강화:**
        1.  강화할 유물 클릭 > 상세 정보 팝업 열림.
        2.  강화 UI 영역에서 필요 재료 및 보유량 확인.
        3.  '강화' 버튼 클릭 (재료 충분하고 최대 레벨 아닐 시 활성화됨).
        4.  강화 요청 API(Server Action) 호출 및 로딩 상태 표시.
        5.  API 응답 수신 (성공/실패 여부, 업데이트된 레벨/효과, 소모된 재료 정보 포함 가능).
        6.  **성공 시:** "강화 성공!" `Toast` 표시. 상세 정보 팝업의 레벨, 효과, 필요 재료 정보 업데이트. 보유 '고대의 정수' UI 업데이트.
        7.  **실패 시 (만약 확률 강화라면):** "강화 실패..." `Toast` 표시. 보유 '고대의 정수' UI 업데이트. (기본 시스템에서는 확정 강화 가능성 높음)
        8.  재료 부족 또는 최대 레벨 시 '강화' 버튼 비활성화, 클릭 시 사유 안내.

3.  **API 연동**:
    *   **데이터 로드:** 유물 관리 화면 진입 시 또는 필요 시 다음 데이터 fetch:
        *   `game_relics`: 전체 유물 정의 데이터 (클라이언트 캐싱 고려).
        *   `user_relics`: 사용자가 보유한 유물 목록 및 레벨.
        *   `user_equipped_relics`: 사용자가 장착한 유물 정보 및 슬롯 인덱스.
        *   `user_game_data`: 보유 `ancient_essence` 수량.
    *   **Server Action 호출:**
        *   `acquireRelic(relicId: string)`: (주로 보스 클리어 로직(`clearStage`) 내부에서 호출될 수 있음)
        *   `equipRelic(userRelicId: string, slotIndex: number)`
        *   `unequipRelic(userRelicId: string)`
        *   `enhanceRelic(userRelicId: string)`

4.  **테스트 항목**:
    *   유물 관리 화면 UI(보유 목록, 장착 슬롯, 보유 재료)가 정확하게 표시되는지 확인.
    *   보스 최초 클리어 시 유물 획득 알림 및 목록 추가 확인.
    *   유물 상세 정보 팝업이 올바른 정보(레벨, 효과 등)를 표시하는지 확인.
    *   유물 장착/해제 시 슬롯 UI 및 인벤토리 상태가 올바르게 업데이트되는지 확인. 슬롯 개수 제한 확인.
    *   유물 강화 시 '고대의 정수' 소모, 레벨 증가(성공 시), UI 정보 업데이트, 성공/실패 메시지가 정상 작동하는지 확인.
    *   조건(재료 부족, 최대 레벨)에 따른 강화 버튼 비활성화 확인.
    *   Server Action 호출 및 응답 처리가 올바르게 이루어지는지 확인.

---

### **백엔드 기능명세서**

1.  **API 정의**:
    *   **유물 관련 데이터 제공 API (게임 상태 로드 API 통합 또는 별도)**:
        *   **목적:** 클라이언트에 필요한 유물 관련 데이터 제공 (`game_relics`, `user_relics`, `user_equipped_relics`, `user_game_data`.`ancient_essence`).
        *   **처리 로직:** 인증된 사용자 `userId` 기반으로 관련 테이블 조회. `user_relics` 조회 시 `game_relics` 정보(이름, 효과 등) 조인하여 반환하면 효율적.
    *   **Server Action `acquireRelic(userId: string, relicId: string)`**:
        *   **파일 위치:** `actions/relics.ts` (또는 `actions/rewards.ts`)
        *   **처리 로직:** (주로 다른 Action, 예: `clearStage` 내부에서 호출될 수 있음)
            1.  `userId`, `relicId` 유효성 확인.
            2.  `user_relics` 테이블에서 해당 `userId`와 `relicId` 조합이 이미 존재하는지 확인 (중복 획득 방지).
            3.  존재하지 않으면 `user_relics` 테이블에 `{ user_id: userId, relic_id: relicId, level: 1 }` 레코드 삽입.
            4.  성공/실패 결과 반환 (또는 에러 처리).
    *   **Server Action `equipRelic(userRelicId: string, slotIndex: number)`**:
        *   **파일 위치:** `actions/relics.ts`
        *   **처리 로직:**
            1.  사용자 인증 확인.
            2.  `userRelicId`로 `user_relics` 조회 (소유권 확인).
            3.  `slotIndex` 유효성 검증 (0 ~ 최대 슬롯 수 - 1).
            4.  `user_equipped_relics` 테이블에서 `user_id` 와 `slotIndex` 가 동일한 기존 장착 정보 조회.
            5.  `user_equipped_relics` 테이블에서 `user_id` 와 `user_relic_id` 가 동일한 기존 장착 정보 조회 (다른 슬롯에 이미 장착되어 있는지).
            6.  **처리 (upsert 또는 분리된 로직):**
                *   기존에 `slotIndex`에 다른 유물이 있었다면 해당 레코드 삭제 또는 `slot_index` 변경.
                *   기존에 `userRelicId`가 다른 슬롯에 있었다면 해당 레코드 삭제 또는 `slot_index` 변경.
                *   `user_equipped_relics` 테이블에 `{ user_id: userId, user_relic_id: userRelicId, slot_index: slotIndex }` 삽입 또는 업데이트.
            7.  성공/실패 결과 반환. `revalidatePath` 호출 (`/relics`, `/character`, `/dashboard`).
    *   **Server Action `unequipRelic(userRelicId: string)`**:
        *   **파일 위치:** `actions/relics.ts`
        *   **처리 로직:**
            1.  사용자 인증 확인.
            2.  `user_equipped_relics` 테이블에서 `user_id` 와 `user_relic_id` 가 일치하는 레코드 조회 및 삭제.
            3.  성공/실패 결과 반환. `revalidatePath` 호출.
    *   **Server Action `enhanceRelic(userRelicId: string)`**:
        *   **파일 위치:** `actions/relics.ts`
        *   **처리 로직:**
            1.  사용자 인증 확인.
            2.  `userRelicId`로 `user_relics` 테이블 조회 (소유권, 현재 `level`, `relic_id` 확인).
            3.  `relic_id`로 `game_relics` 테이블 조회 (`max_level` 확인).
            4.  현재 `level` + 1 (목표 레벨) 기준으로 강화 규칙 조회 (`game_relic_enhancement_rules` 또는 `game_relics` 내 정보) - 필요 `ancient_essence`, 성공 확률(구현 시).
            5.  `user_game_data` 테이블에서 현재 `ancient_essence` 보유량 조회.
            6.  **조건 검증:**
                *   현재 `level` < `max_level` 인가?
                *   보유 `ancient_essence` >= 필요 `ancient_essence` 인가?
            7.  (확률 강화 시) 성공 여부 결정.
            8.  **트랜잭션 시작 (DB 함수 권장):**
                *   `user_game_data` 테이블에서 필요 `ancient_essence` 만큼 차감 업데이트.
                *   **성공 시:** `user_relics` 테이블에서 해당 `userRelicId`의 `level` 1 증가 업데이트.
                *   **실패 시:** 레벨 변경 없음.
            9.  **트랜잭션 종료.**
            10. 강화 결과(성공 여부), 업데이트된 레벨, 업데이트된 `ancient_essence` 보유량 반환. `revalidatePath` 호출.

2.  **데이터베이스 설계 및 연동**:
    *   **`game_relics` 테이블 (신규 생성)**:
        *   `id` (varchar or int, PK)
        *   `name` (text, not null)
        *   `description` (text)
        *   `grade` (text, not null) - 예: 'rare', 'epic', 'legendary'
        *   `icon_url` (text)
        *   `max_level` (integer, default 10)
        *   `base_effect` (jsonb) - 레벨 1 효과. 예: `{"passive_stat": "attack_percent", "value": 0.05}`
        *   `level_scaling` (jsonb) - 레벨당 효과 증가량. 예: `{"value_per_level": 0.01}`
        *   (선택적) `enhancement_rules_inline` (jsonb) - 레벨별 강화 비용/확률 직접 정의.
    *   **`user_relics` 테이블 (신규 생성)**:
        *   `id` (uuid, PK, default `gen_random_uuid()`) - 유물 인스턴스 ID.
        *   `user_id` (uuid, FK to auth.users.id, not null)
        *   `relic_id` (varchar or int, FK to game_relics.id, not null)
        *   `level` (integer, default 1, not null)
        *   `acquired_at` (timestamptz, default `now()`, not null)
        *   Unique constraint: `(user_id, relic_id)` - (기본적으로 유물 종류별 1개만 보유 가정 시. 여러 개 보유 가능 시 제거)
        *   RLS 정책 필수.
    *   **`user_equipped_relics` 테이블 (신규 생성)**:
        *   `user_id` (uuid, FK to auth.users.id, not null)
        *   `user_relic_id` (uuid, FK to user_relics.id, not null)
        *   `slot_index` (integer, not null, check (`slot_index` >= 0 and `slot_index` < MAX_RELIC_SLOTS))
        *   Primary Key: `(user_id, slot_index)`
        *   Unique constraint: `(user_id, user_relic_id)`
        *   RLS 정책 필수.
    *   **`user_game_data` 테이블**: `ancient_essence` (bigint, default 0, not null) 컬럼 추가.
    *   **(선택적) `game_relic_enhancement_rules` 테이블**: `level` (PK), `required_essence` (int), `success_chance` (numeric).
    *   **연동 로직:** Server Action 내 Supabase 클라이언트 사용. 강화 로직은 재료 소모 및 레벨 업데이트가 연관되므로 트랜잭션/DB 함수 사용 권장.

3.  **테스트 항목**:
    *   유물 관련 데이터 API가 정확한 정보를 반환하는지 확인.
    *   `acquireRelic` 액션: 중복 획득 방지 확인, `user_relics` 삽입 확인.
    *   `equipRelic` 액션: DB에서 `user_equipped_relics` 상태 변경(기존 슬롯 처리, 새 슬롯 삽입/업데이트) 확인. 슬롯 제한 확인.
    *   `unequipRelic` 액션: DB에서 `user_equipped_relics` 레코드 삭제 확인.
    *   `enhanceRelic` 액션: 조건 검증(최대 레벨, 재료 부족) 확인. 성공/실패 로직 확인. 성공 시 `user_relics` 레벨 증가 및 `user_game_data` 재료 감소 확인. 실패 시 레벨 유지 및 재료 감소 확인. 트랜잭션 원자성 확인.
    *   모든 액션에서 사용자 인증, 소유권 검증이 올바르게 작동하는지 확인.
    *   DB 스키마, 제약 조건, RLS 정책 확인.

---
