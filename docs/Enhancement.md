---

## **기능명세서: 7. 장비 강화 시스템**

**개발 우선순위:** Phase 2 (핵심 게임 루프 구현)

### **프론트엔드 기능명세서**

1.  **화면 레이아웃 및 디자인 명세**:
    *   **장비 강화 UI (`components/features/EnhancementDialog.tsx` 또는 아이템 상세 팝업 내 통합)**:
        *   아이템 상세 정보 팝업(`components/features/ItemDetailDialog.tsx`) 내에 강화 섹션을 두거나, 별도의 강화 전용 `Dialog` 컴포넌트로 구현.
        *   **강화 대상 슬롯:** 강화할 아이템의 아이콘, 이름, 현재 강화 레벨(+N) 표시.
        *   **강화 정보:**
            *   다음 강화 레벨 표시 (+N → +N+1).
            *   성공 시 예상 스탯 변화량 표시 (기본 능력치 증가량).
            *   필요 강화 비용(골드) 표시.
            *   현재 강화 레벨에서의 성공 확률(%) 표시.
        *   **"강화" 버튼:** 클릭 시 강화 시도. 골드 부족 또는 최대 레벨 도달 시 비활성화.
        *   **(선택적) 강화 연출 영역:** 강화 시도 시 간단한 시각적 효과(반짝임, 게이지 등) 표시.
        *   **ShadCN 컴포넌트 활용:** `Dialog` (별도 팝업 시), `Card` (강화 정보 섹션), `Button` (강화 버튼), `Tooltip` (확률 상세 설명 등), `Separator`, `Badge` (레벨 표시).
        *   **파일 위치:** `components/features/EnhancementDialog.tsx` (별도 팝업 시) 또는 `components/features/ItemDetailDialog.tsx` 내부에 구현.
    *   **인벤토리 및 장비 슬롯 강화 레벨 표시:**
        *   인벤토리 아이템 카드(`app/inventory/InventoryItemCard.tsx`) 및 캐릭터 정보의 장비 슬롯(`app/character/EquipmentSlot.tsx`)에 강화 레벨(+N)을 명확하게 표시.

2.  **사용자 흐름 및 상호작용**:
    *   사용자는 인벤토리 또는 캐릭터 장비 슬롯에서 아이템 선택 후 상세 정보 확인.
    *   상세 정보 내 '강화' 버튼 또는 섹션으로 접근.
    *   강화 UI에서 비용, 확률, 예상 결과 확인.
    *   골드가 충분하고 최대 강화 레벨이 아닐 경우, "강화" 버튼 클릭.
    *   클릭 시 강화 요청 API(Server Action) 호출 및 로딩 상태 표시.
    *   API 응답 수신:
        *   **성공 시:**
            *   "강화 성공!" 메시지 표시 (ShadCN `Toast`).
            *   강화 연출 재생.
            *   강화 UI의 아이템 레벨 및 스탯 정보 업데이트.
            *   강화 UI의 비용 및 확률 정보 다음 레벨 기준으로 업데이트.
            *   헤더 등 다른 곳의 골드 잔액 UI 업데이트.
            *   인벤토리/장비 슬롯의 강화 레벨 표시 업데이트.
        *   **실패 시 (파괴 없음):**
            *   "강화 실패..." 메시지 표시 (ShadCN `Toast`).
            *   헤더 등 다른 곳의 골드 잔액 UI 업데이트.
            *   강화 UI 상태는 이전과 동일하게 유지 (재시도 가능).
    *   골드 부족 또는 최대 강화 레벨 도달 시 "강화" 버튼 비활성화. 클릭 시 사유 안내 (Tooltip 또는 메시지).

3.  **API 연동**:
    *   **강화 정보 로드:**
        *   아이템 정보 로드 시 현재 강화 레벨, 최대 강화 레벨 정보 포함.
        *   강화 비용/확률 데이터 (`game_enhancement_rules`)는 클라이언트 시작 시 전체 로드하여 메모리에 캐싱하거나, 필요 시 API로 조회하여 관리.
    *   **Server Action 호출:** `enhanceItem(userInventoryId: string)` 호출하여 강화 시도.

4.  **테스트 항목**:
    *   강화 UI에 아이템 정보, 다음 레벨, 비용, 확률이 정확하게 표시되는지 확인.
    *   골드 보유량, 최대 강화 레벨에 따라 강화 버튼이 올바르게 활성화/비활성화되는지 확인.
    *   강화 성공 시 강화 레벨 증가, 골드 차감, UI 업데이트, 성공 메시지 및 연출이 정상 작동하는지 확인.
    *   강화 실패 시 골드 차감, 실패 메시지 표시, 아이템 레벨 유지 등 UI 상태 확인.
    *   강화 후 인벤토리 및 장비 슬롯의 강화 레벨 표시가 업데이트되는지 확인.
    *   Server Action 호출 및 응답 처리가 올바르게 이루어지는지 확인.

---

### **백엔드 기능명세서**

1.  **API 정의**:
    *   **강화 규칙 데이터 제공 API (선택적, `/app/api/enhancement-rules/route.ts` GET)**:
        *   **목적:** 클라이언트에 강화 레벨별 비용 및 성공 확률 데이터 제공.
        *   **처리 로직:** `game_enhancement_rules` 테이블 전체 데이터 조회 및 반환. 캐싱 활용 권장.
    *   **Server Action `enhanceItem(userInventoryId: string)`**:
        *   **파일 위치:** `actions/inventory.ts` (또는 `actions/enhancement.ts`)
        *   **처리 로직:**
            1.  사용자 인증 확인.
            2.  `userInventoryId`를 사용하여 `user_inventory` 테이블에서 아이템 정보(소유권, `enhancement_level`) 조회. `item_id` 포함.
            3.  `item_id`를 사용하여 `game_items` 테이블에서 아이템 정보(`max_enhancement_level`) 조회.
            4.  `user_inventory`의 현재 `enhancement_level` + 1 (시도할 레벨)을 기준으로 `game_enhancement_rules` 테이블에서 해당 레벨의 `cost_gold`와 `success_chance` 조회.
            5.  `user_game_data` 테이블에서 현재 사용자 `gold` 조회.
            6.  **조건 검증:**
                *   현재 `enhancement_level`이 `max_enhancement_level` 미만인가?
                *   사용자 보유 `gold`가 `cost_gold` 이상인가?
            7.  **강화 시도:** `Math.random()` 값과 `success_chance` 비교하여 성공 여부 결정.
            8.  **트랜잭션 시작 (DB 함수 권장):**
                *   `user_game_data` 테이블에서 `cost_gold` 만큼 `gold` 차감 업데이트.
                *   **성공 시:** `user_inventory` 테이블에서 해당 아이템의 `enhancement_level`을 1 증가시켜 업데이트.
                *   **실패 시:** `enhancement_level` 변경 없음.
            9.  **트랜잭션 종료.**
            10. 강화 결과(성공 여부), 업데이트된 아이템 정보(`enhancement_level`), 업데이트된 사용자 골드(`gold`) 반환. `revalidatePath` 호출 (`/inventory`, `/character`, `/dashboard`).

2.  **데이터베이스 설계 및 연동**:
    *   **`game_enhancement_rules` 테이블**:
        *   `level` (integer, PK) - 목표 강화 레벨 (예: 0->1 강화 시 level 1).
        *   `cost_gold` (bigint, not null).
        *   `success_chance` (numeric(5, 4), not null, check (success_chance >= 0 and success_chance <= 1)).
        *   (선택적) `required_item_id`, `required_item_quantity`.
    *   **`user_inventory` 테이블**: `enhancement_level` (integer, default 0).
    *   **`game_items` 테이블**: `max_enhancement_level` (integer, nullable, default 15).
    *   **`user_game_data` 테이블**: `gold` (bigint).
    *   **연동 로직:** Server Action 내에서 Supabase 클라이언트 사용. 관련 테이블 조회 및 업데이트. 골드 차감과 강화 레벨 변경은 원자적으로 처리되어야 하므로 DB 함수(plpgsql) 사용 권장.

3.  **테스트 항목**:
    *   강화 규칙 API가 정확한 데이터를 반환하는지 확인 (구현 시).
    *   `enhanceItem` 액션:
        *   조건 검증(최대 레벨, 골드 부족)이 올바르게 작동하는지 확인.
        *   성공 확률에 따라 성공/실패가 결정되는 로직 확인 (테스트 시 확률 조작 필요).
        *   성공 시: `user_inventory`의 `enhancement_level` 증가, `user_game_data`의 `gold` 감소 확인.
        *   실패 시: `user_inventory`의 `enhancement_level` 유지, `user_game_data`의 `gold` 감소 확인.
    *   트랜잭션 원자성(성공 시 모두 반영, 실패 시 골드만 차감되고 레벨 유지, 중간 오류 시 모두 롤백) 확인.
    *   사용자 인증, 아이템 소유권 검증 확인.
    *   존재하지 않는 아이템 ID, 규칙 레벨 처리 확인.
    *   DB 스키마, 제약 조건, RLS 정책 확인.

---
