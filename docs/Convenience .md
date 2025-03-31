---

## **기능명세서: 14. 편의 기능 (기본)**

**개발 우선순위:** Phase 3 (주요 부가 기능 및 편의성 개선)

### **프론트엔드 기능명세서**

1.  **화면 레이아웃 및 디자인 명세**:
    *   **최고 장비 자동 장착 버튼 (`app/inventory/page.tsx` 또는 `app/character/page.tsx`)**:
        *   인벤토리 화면 상단이나 캐릭터 정보의 장비 패널 근처에 "자동 장착" 버튼 배치.
        *   클릭 시 확인 `AlertDialog` 표시 ("현재 장착 가능한 가장 좋은 장비로 자동 교체하시겠습니까?").
        *   **ShadCN 컴포넌트 활용:** `Button`, `AlertDialog`.
        *   **파일 위치:** `app/inventory/AutoEquipButton.tsx` (컴포넌트 분리 시) 또는 해당 페이지 내 직접 구현.
    *   **자동 분해/판매 설정 UI (`components/features/AutoSalvageSettingsDialog.tsx` 또는 `app/settings/page.tsx`)**:
        *   인벤토리 화면 또는 별도의 설정 페이지(`app/settings/page.tsx`)에서 접근 가능한 UI. (Dialog 형태 권장)
        *   "자동 분해/판매 활성화" 체크박스. (ShadCN `Checkbox`)
        *   활성화 시, 분해/판매 대상 등급 선택 UI 제공. (예: '일반', '고급', '희귀' 등급까지 선택 가능한 `Checkbox` 그룹 또는 `Select` 컴포넌트) - **여기서는 '자동 판매'로 용어 통일 (골드 획득)**
        *   "잠금 상태 아이템 제외" 체크박스 (기본 활성화).
        *   설정 내용을 저장하는 "저장" 버튼.
        *   **ShadCN 컴포넌트 활용:** `Dialog`, `Checkbox`, `Select` (필요시), `Button`, `Label`.
        *   **파일 위치:** `components/features/AutoSalvageSettingsDialog.tsx` (Dialog 형태 시) 또는 `app/settings/page.tsx` 내 구현.
    *   **장비 비교/잠금 기능**:
        *   **참고:** 이 기능의 UI(상세 정보 팝업 내 비교 정보 표시, 잠금 버튼)는 **"6. 장비 시스템 (기본)"** 기능 명세서의 `components/features/ItemDetailDialog.tsx` 부분에 이미 정의되어 있음.

2.  **사용자 흐름 및 상호작용**:
    *   **최고 장비 자동 장착**:
        1.  사용자가 "자동 장착" 버튼 클릭.
        2.  확인 `AlertDialog` 표시 > '확인' 클릭.
        3.  자동 장착 Server Action 호출 및 로딩 상태 표시 (버튼 비활성화).
        4.  성공 응답 시:
            *   "자동 장착 완료. N개의 장비가 교체되었습니다." 메시지 표시 (ShadCN `Toast`).
            *   캐릭터 정보의 장비 슬롯 UI (`app/character/CharacterEquipmentPanel.tsx`) 및 인벤토리 UI 업데이트.
        5.  실패 응답 시 오류 메시지 표시. 로딩 상태 해제.
    *   **자동 판매 설정**:
        1.  사용자가 설정 UI 접근 (인벤토리 내 버튼 또는 설정 페이지).
        2.  자동 판매 활성화 여부 및 대상 등급 선택.
        3.  "저장" 버튼 클릭.
        4.  설정 저장 Server Action 호출.
        5.  성공 응답 시 "자동 판매 설정이 저장되었습니다." 메시지 표시 및 UI 닫힘.
    *   **자동 판매 실행 (획득 시점 - 클라이언트 트리거 방식 예시)**:
        1.  자동 전투 중 장비 아이템 획득 이벤트 발생 (기능 3 연계).
        2.  클라이언트는 로드된 자동 판매 설정을 확인 (활성화 여부, 대상 등급, 잠금 제외 여부).
        3.  획득한 아이템이 자동 판매 조건(설정된 등급 이하, 잠금 상태 아님)에 해당하면, '자동 판매' Server Action 호출 (획득한 아이템 정보 전달).
        4.  Server Action 성공 응답 시, 인벤토리에 추가하는 대신 "아이템 이름 (+N 골드 자동 판매됨)" 로그 표시 (기능 3 `BattleLog.tsx` 연계) 및 골드 UI 업데이트.
        5.  조건 미해당 시 일반적인 아이템 획득 처리.
    *   **장비 비교/잠금**:
        *   **참고:** 사용자 흐름(상세 정보 확인, 비교, 잠금/해제 버튼 클릭)은 **"6. 장비 시스템 (기본)"** 기능 명세서 참조.

3.  **API 연동**:
    *   **Server Action 호출**:
        *   `autoEquipBestItems()`: 최고 장비 자동 장착 실행.
        *   `saveAutoSalvageSettings(settings: AutoSalvageSettings)`: 자동 판매 설정 저장.
        *   `autoSellItem(userInventoryId: string)` 또는 `autoSellItems(userInventoryIds: string[])`: 조건에 맞는 아이템 자동 판매 실행.
    *   **데이터 로드**:
        *   자동 판매 설정을 클라이언트에서 사용하기 위해 페이지 로드 시 사용자 설정(`user_settings.auto_salvage`) fetch 필요.

4.  **테스트 항목**:
    *   "자동 장착" 버튼 클릭 및 확인 후, 실제로 더 좋은 장비(정의된 기준에 따라)로 교체되는지, UI가 업데이트되는지, 성공 메시지가 표시되는지 확인.
    *   자동 판매 설정 UI에서 설정 변경 및 저장이 정상적으로 작동하고 성공 메시지가 표시되는지 확인.
    *   자동 판매 활성화 및 등급 설정 후, 해당 등급의 아이템 획득 시 자동으로 판매 처리되고 골드가 증가하며 관련 로그가 표시되는지 확인. 잠긴 아이템은 제외되는지 확인.
    *   기존 장비 비교/잠금 기능이 여전히 정상 작동하는지 확인 (회귀 테스트).

---

### **백엔드 기능명세서**

1.  **API 정의**:
    *   **Server Action `autoEquipBestItems()`**:
        *   **파일 위치:** `actions/inventory.ts` (또는 `actions/character.ts`)
        *   **처리 로직:**
            1.  사용자 인증 확인.
            2.  사용자의 모든 인벤토리 아이템(`user_inventory`)과 장착 중인 아이템 정보 로드 (`is_equipped` 기준). `game_items` 정보 조인하여 아이템 스탯 및 슬롯 정보 포함.
            3.  **'최고' 장비 판단 로직 정의:** 각 장비 슬롯별로 어떤 기준으로 가장 좋은 장비를 선택할지 결정. (예: 주 스탯 + 부 스탯 가중치 합, 특정 스탯 우선, 아이템 등급 우선, 강화 레벨 고려 등 복합적인 점수 계산 로직 필요).
            4.  각 7개 슬롯별로 현재 장착된 아이템과 인벤토리 내 미장착 아이템들을 비교하여 슬롯별 최고 아이템(`bestItemPerSlot`) 선정.
            5.  현재 장착된 아이템과 `bestItemPerSlot`이 다른 슬롯 목록 식별.
            6.  **트랜잭션 시작 (DB 함수 권장):**
                *   변경이 필요한 각 슬롯에 대해, 기존 장착 아이템 `is_equipped=false` 업데이트, `bestItemPerSlot` 아이템 `is_equipped=true` 업데이트 (기능 6의 `equipItem` 로직과 유사하게 처리).
            7.  **트랜잭션 종료.**
            8.  성공/실패 결과 및 실제 교체된 장비 개수 반환. `revalidatePath` 호출 (`/inventory`, `/character`).
    *   **Server Action `saveAutoSalvageSettings(settings: AutoSalvageSettings)`**:
        *   **파일 위치:** `actions/settings.ts`
        *   **처리 로직:**
            1.  사용자 인증 확인.
            2.  `settings` 데이터 유효성 검증 (활성화 여부, 등급 목록 등).
            3.  `user_settings` 테이블에 해당 사용자의 설정 업데이트 (`upsert` 사용 권장). 설정 데이터는 JSONB 컬럼에 저장.
            4.  성공/실패 결과 반환.
    *   **Server Action `autoSellItem(userInventoryId: string)` / `autoSellItems(userInventoryIds: string[])`**:
        *   **파일 위치:** `actions/inventory.ts`
        *   **처리 로직:**
            1.  사용자 인증 확인.
            2.  `userInventoryId(s)` 유효성 및 소유권 검증. 해당 아이템이 잠금 상태(`is_locked`)가 아닌지 확인.
            3.  판매될 아이템들의 정보(`game_items` 조인하여 판매 가격 정보 등) 조회. (판매 가격은 `game_items` 테이블에 정의하거나, 등급/강화 레벨 기반 공식으로 계산).
            4.  **트랜잭션 시작 (DB 함수 권장):**
                *   `user_inventory` 테이블에서 해당 아이템 레코드 삭제.
                *   계산된 총 판매 골드를 `user_game_data` 테이블의 `gold`에 추가 업데이트 (기능 3의 재화 업데이트 함수 활용 가능).
            5.  **트랜잭션 종료.**
            6.  성공/실패 결과 및 판매로 얻은 총 골드 반환. `revalidatePath` 호출 (`/inventory`, `/dashboard`).
    *   **사용자 설정 데이터 제공 API (게임 상태 로드 API 통합 또는 별도)**:
        *   **목적:** 클라이언트에 사용자별 설정(`user_settings` 테이블 내용) 제공.
        *   **처리 로직:** 인증된 사용자의 `userId`로 `user_settings` 테이블 조회.

2.  **데이터베이스 설계 및 연동**:
    *   **`user_settings` 테이블 (신규 생성)**:
        *   `user_id` (uuid, PK, FK to auth.users.id)
        *   `auto_salvage_settings` (jsonb, nullable) - 예: `{"enabled": true, "targetGrades": ["common", "uncommon"], "excludeLocked": true}`
        *   `updated_at` (timestamptz, default `now()`)
        *   RLS 정책 필수.
    *   **`user_inventory` 테이블**: `is_locked` (boolean) 컬럼 활용. 자동 판매 시 레코드 삭제 대상.
    *   **`game_items` 테이블**: (선택적) `sell_price` (integer) 컬럼 추가 또는 판매가 계산 로직 정의 필요. '최고' 장비 판단을 위한 스탯 정보 활용.
    *   **`user_game_data` 테이블**: 자동 판매 시 `gold` 업데이트 대상.
    *   **연동 로직:** Server Action 내에서 Supabase 클라이언트 사용. `autoEquipBestItems`는 복잡한 비교 및 업데이트 로직, `autoSellItem`은 삭제 및 재화 업데이트 로직 포함. 트랜잭션 관리가 중요하므로 DB 함수 활용 권장.

3.  **테스트 항목**:
    *   `autoEquipBestItems` 액션: 정의된 '최고' 기준에 따라 올바른 장비들이 장착되는지, 기존 장비 해제 처리가 되는지, 교체된 개수가 정확히 반환되는지 확인. 트랜잭션 원자성 확인.
    *   `saveAutoSalvageSettings` 액션: `user_settings` 테이블에 설정이 올바르게 저장/업데이트되는지 확인.
    *   `autoSellItem(s)` 액션: 지정된 아이템이 `user_inventory`에서 삭제되고, 정확한 골드가 `user_game_data`에 추가되는지 확인. 잠긴 아이템 판매 시도 시 실패 처리되는지 확인. 트랜잭션 원자성 확인.
    *   사용자 설정 로드 API가 올바른 설정 데이터를 반환하는지 확인.
    *   모든 액션에서 사용자 인증, 소유권, 조건 검증(최고 장비 기준, 자동 판매 조건)이 올바르게 작동하는지 확인.
    *   DB 스키마, 제약 조건, RLS 정책 확인.

---

