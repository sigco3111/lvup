---

## **기능명세서: 8. 장비 시스템 (기본)**

**개발 우선순위:** Phase 2 (핵심 게임 루프 구현)

### **프론트엔드 기능명세서**

1.  **화면 레이아웃 및 디자인 명세**:
    *   **인벤토리 화면 (`app/inventory/page.tsx`)**:
        *   사용자가 보유한 장비 아이템 목록을 그리드 또는 리스트 형태로 표시.
        *   **필터링:** 장비 부위(무기, 투구, 갑옷 등 7개 슬롯)별 필터링 기능 제공. (ShadCN `Select` 또는 `Tabs` 활용)
        *   **정렬:** 등급(일반~전설), 획득 순서, 강화 레벨 기준 정렬 기능 제공. (ShadCN `Select` 또는 `Button` 활용)
        *   **아이템 슬롯 표시:** 각 아이템은 아이콘, 등급(테두리 색상/뱃지), 강화 레벨(+X), 잠금 아이콘(🔒)을 표시. (커스텀 컴포넌트 또는 ShadCN `Card` 변형 활용)
        *   무한 스크롤 또는 페이지네이션 적용 고려 (아이템 개수가 많아질 경우).
        *   **파일 위치:** `app/inventory/page.tsx`, `app/inventory/InventoryList.tsx`, `app/inventory/InventoryFilterSort.tsx`, `app/inventory/InventoryItemCard.tsx`
    *   **아이템 상세 정보 팝업 (`components/features/ItemDetailDialog.tsx`)**:
        *   인벤토리에서 아이템 클릭 시, 해당 아이템의 상세 정보를 보여주는 모달 창.
        *   **표시 정보:** 아이템 아이콘, 이름, 등급, 종류/부위, 기본 능력치, 추가 옵션(랜덤 부여된 옵션), 강화 레벨, (구현 시) 세트 효과 정보.
        *   **비교 기능:** 현재 착용 중인 동일 부위 장비의 주요 스탯을 함께 표시하여 비교 용이성 제공.
        *   **액션 버튼:** '장착'/'해제', '강화'(기능 7 연계), '잠금'/'해제'. (ShadCN `Button`, `Tooltip` 활용)
        *   **ShadCN 컴포넌트 활용:** `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `Button`, `Badge` (등급 표시), `Separator` (정보 구분).
        *   **파일 위치:** `components/features/ItemDetailDialog.tsx`
    *   **캐릭터 정보 화면 - 장비 슬롯 (`app/character/CharacterEquipmentPanel.tsx`)**:
        *   캐릭터 정보 페이지(`app/character/page.tsx`) 내 또는 메인 대시보드의 일부로 표시.
        *   7개의 장비 슬롯(무기, 투구, 상의, 하의, 장갑, 신발, 장신구)을 시각적으로 배치.
        *   각 슬롯에는 현재 착용 중인 아이템의 아이콘 표시. 빈 슬롯은 기본 이미지 또는 아이콘 표시.
        *   슬롯에 마우스 오버 시 간단한 아이템 정보(이름, 등급) 툴팁 표시. (ShadCN `Tooltip`)
        *   슬롯 클릭 시:
            *   옵션 1: 해당 부위 아이템 목록 필터링된 인벤토리 팝업 표시.
            *   옵션 2: 장착 해제 기능만 제공.
        *   **파일 위치:** `app/character/CharacterEquipmentPanel.tsx`, `app/character/EquipmentSlot.tsx`

2.  **사용자 흐름 및 상호작용**:
    *   **장비 획득:** 자동 전투(기능 2) 및 자동 획득(기능 3)을 통해 새 장비 아이템이 `user_inventory`에 추가됨. 인벤토리 메뉴에 알림 표시.
    *   **인벤토리 확인:** 사용자가 인벤토리 화면으로 이동하여 획득한 아이템 확인. 필터/정렬 기능 사용.
    *   **상세 정보 확인 및 비교:** 아이템 클릭 > 상세 정보 팝업 확인. 현재 착용 장비와 능력치 비교.
    *   **장비 장착:** 상세 정보 팝업에서 '장착' 버튼 클릭 > 해당 아이템이 캐릭터 정보 패널의 슬롯에 표시됨. 기존에 해당 슬롯에 있던 장비는 해제되어 인벤토리로 이동. 인벤토리 목록에서 해당 아이템은 '착용 중' 표시 또는 비활성화 처리.
    *   **장비 해제:**
        *   상세 정보 팝업(착용 중인 아이템)에서 '해제' 버튼 클릭 > 아이템이 슬롯에서 제거되고 인벤토리로 이동. 캐릭터 정보 패널 슬롯은 비워짐.
        *   캐릭터 정보 패널 슬롯 클릭 > '해제' 선택 > 위와 동일하게 처리.
    *   **아이템 잠금/해제:** 상세 정보 팝업에서 '잠금'/'해제' 버튼 클릭 > 아이템 슬롯에 잠금 아이콘 표시/숨김. 잠긴 아이템은 분해/판매 불가 (해당 기능 구현 시).

3.  **API 연동**:
    *   **인벤토리 데이터 로드:**
        *   Server Component (`app/inventory/page.tsx`): 페이지 로드 시 Supabase 서버 클라이언트로 `user_inventory`와 `game_items` 조인하여 데이터 조회 후 클라이언트에 전달.
        *   Client Component (`app/inventory/InventoryList.tsx`): `useEffect` 내에서 Supabase 클라이언트(`createClient`)로 데이터 fetch. (필터/정렬 변경 시 재-fetch 필요)
    *   **장착 장비 데이터 로드:** 캐릭터 정보 패널 컴포넌트에서 `user_inventory` 테이블 `is_equipped=true` 조건으로 데이터 조회 (Server 또는 Client 방식).
    *   **장비 장착/해제 (Server Action)**: `equipItem(userInventoryId: string)` / `unequipItem(userInventoryId: string)` 호출. `userInventoryId`는 아이템 인스턴스의 고유 ID.
    *   **아이템 잠금/해제 (Server Action)**: `toggleItemLock(userInventoryId: string, lock: boolean)` 호출.

4.  **테스트 항목**:
    *   인벤토리에 보유한 모든 장비 아이템이 정확하게 표시되는지 확인 (아이콘, 등급, 강화 레벨, 잠금 상태 포함).
    *   필터링(부위별), 정렬(등급, 획득순 등) 기능이 정상적으로 동작하는지 확인.
    *   아이템 상세 정보 팝업에 모든 정보(기본 스탯, 추가 옵션 등)가 정확히 표시되는지 확인.
    *   장비 비교 정보가 정확하게 표시되는지 확인.
    *   '장착' 시 캐릭터 정보 패널 슬롯 업데이트, 기존 장비 해제 처리, 인벤토리 상태 변경이 올바른지 확인.
    *   '해제' 시 캐릭터 정보 패널 슬롯 비워짐, 인벤토리 상태 변경이 올바른지 확인.
    *   '잠금'/'해제' 기능이 정상 동작하고 UI에 반영되는지 확인.
    *   존재하지 않는 아이템 또는 타 유저 아이템에 대한 액션 시도가 불가능한지 확인 (백엔드 연동 후).

---

### **백엔드 기능명세서**

1.  **API 정의**:
    *   **인벤토리 데이터 제공 API (Server Component / Route Handler)**:
        *   **목적:** 사용자의 인벤토리 목록 제공.
        *   **처리 로직:** 인증된 사용자의 `userId`를 기반으로 `user_inventory` 테이블 조회. 성능을 위해 `game_items` 테이블과 조인하여 아이템 기본 정보(이름, 등급, 아이콘, 슬롯 등)를 함께 반환하는 것을 고려. 필터링/정렬 조건을 파라미터로 받아 처리. 페이지네이션 구현.
        *   **Supabase 클라이언트 예시 (조인):**
            ```javascript
            const { data, error } = await supabase
              .from('user_inventory')
              .select(`
                id, quantity, enhancement_level, options, is_equipped, is_locked, acquired_at,
                game_items (id, name, item_slot, grade, icon_url)
              `)
              .eq('user_id', userId)
              // .eq('game_items.item_slot', filterSlot) // 필터링 예시
              // .order('game_items.grade', { ascending: false }) // 정렬 예시
              // .range(offset, offset + limit - 1) // 페이지네이션 예시
            ```
    *   **장착 장비 데이터 제공 API (Server Component / Route Handler)**:
        *   **목적:** 사용자가 현재 착용 중인 장비 목록 제공.
        *   **처리 로직:** 위 API와 유사하나, `user_inventory` 조회 시 `is_equipped=true` 조건을 추가.
    *   **Server Action `equipItem(userInventoryId: string)`**:
        *   **파일 위치:** `actions/inventory.ts`
        *   **처리 로직:**
            1.  사용자 인증 확인 (`supabase.auth.getUser()`).
            2.  `userInventoryId`로 `user_inventory` 테이블에서 아이템 정보 조회 (소유권 확인 포함). `game_items` 테이블과 조인하여 `item_slot` 확인.
            3.  해당 `item_slot`에 이미 장착된 아이템(`existingEquippedItem`)이 있는지 `user_inventory` 테이블에서 조회 (`is_equipped=true` 및 동일 `item_slot`).
            4.  **트랜잭션 시작 (DB 함수 권장):**
                *   만약 `existingEquippedItem`이 있고, 그것이 현재 장착하려는 아이템(`userInventoryId`)과 다르면, `existingEquippedItem`의 `is_equipped`를 `false`로 업데이트.
                *   `userInventoryId` 아이템의 `is_equipped`를 `true`로 업데이트.
            5.  **트랜잭션 종료.**
            6.  성공/실패 결과 반환. `revalidatePath` 호출 (`/inventory`, `/character`).
    *   **Server Action `unequipItem(userInventoryId: string)`**:
        *   **파일 위치:** `actions/inventory.ts`
        *   **처리 로직:**
            1.  사용자 인증 확인.
            2.  `userInventoryId`로 `user_inventory` 조회 (소유권 및 `is_equipped=true` 확인).
            3.  해당 아이템의 `is_equipped`를 `false`로 업데이트.
            4.  성공/실패 결과 반환. `revalidatePath` 호출.
    *   **Server Action `toggleItemLock(userInventoryId: string, lock: boolean)`**:
        *   **파일 위치:** `actions/inventory.ts`
        *   **처리 로직:**
            1.  사용자 인증 확인.
            2.  `userInventoryId`로 `user_inventory` 조회 (소유권 확인).
            3.  해당 아이템의 `is_locked`를 `lock` 값으로 업데이트.
            4.  성공/실패 결과 반환. `revalidatePath` 호출 (`/inventory`).

2.  **데이터베이스 설계 및 연동**:
    *   **`user_inventory` 테이블**:
        *   `id` (uuid, PK, default `gen_random_uuid()`) - 아이템 인스턴스 ID
        *   `user_id` (uuid, FK to auth.users.id, not null)
        *   `item_id` (varchar or int, FK to game_items.id, not null) - 아이템 종류 ID
        *   `quantity` (integer, default 1, not null) - (장비는 항상 1)
        *   `enhancement_level` (integer, default 0, not null)
        *   `options` (jsonb, nullable) - 예: `{"attack": 10, "crit_chance": 0.05}`
        *   `is_equipped` (boolean, default false, not null)
        *   `is_locked` (boolean, default false, not null)
        *   `acquired_at` (timestamptz, default `now()`, not null)
        *   인덱스: `(user_id)`, `(user_id, is_equipped)`, `(user_id, item_id)`
        *   RLS 정책 필수 적용.
    *   **`game_items` 테이블**:
        *   `id` (varchar or int, PK) - 아이템 종류 ID (예: 'sword_001', 1001)
        *   `name` (text, not null)
        *   `description` (text)
        *   `item_type` (text, check in ('weapon', 'armor', 'accessory'), not null)
        *   `item_slot` (text, check in ('weapon', 'head', 'chest', 'legs', 'hands', 'feet', 'accessory1', 'accessory2'), not null) - (7개 슬롯 고려하여 정의)
        *   `grade` (text, check in ('common', 'uncommon', 'rare', 'epic', 'legendary'), not null)
        *   `base_stats` (jsonb) - 예: `{"attack": 50, "defense": 10}`
        *   `icon_url` (text)
        *   `max_enhancement_level` (integer, default 10) - (기능 7 연계)
        *   RLS 정책 (읽기 전용 허용) 권장.
    *   **연동 로직:** Server Action 및 API 핸들러 내에서 Supabase 클라이언트를 사용하여 `user_inventory`, `game_items` 테이블 조회/업데이트. `equipItem` 로직의 트랜잭션 보장을 위해 Supabase Edge Function 또는 PostgreSQL 함수(plpgsql) 사용 강력 권장.

3.  **테스트 항목**:
    *   인벤토리/장착 장비 API가 필터링, 정렬, 페이지네이션 조건에 맞게 정확한 데이터를 반환하는지 확인.
    *   `equipItem` 액션: DB에서 `is_equipped` 상태 변경(기존 장비 false, 새 장비 true) 확인. 트랜잭션 롤백 테스트(중간에 에러 발생 시). 동시 요청 시 데이터 정합성 확인.
    *   `unequipItem` 액션: DB에서 `is_equipped` 상태 false 변경 확인.
    *   `toggleItemLock` 액션: DB에서 `is_locked` 상태 변경 확인.
    *   존재하지 않거나 권한 없는 `userInventoryId`로 액션 호출 시 실패 처리 및 DB 변경 없음 확인.
    *   `user_inventory`, `game_items` 테이블 스키마, 제약 조건, RLS 정책이 올바르게 설정되었는지 확인.
    *   DB 함수/트랜잭션 로직이 의도대로 동작하는지 단위 테스트 또는 통합 테스트 수행.

---

