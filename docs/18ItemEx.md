---

## **기능명세서: 18. 장비 시스템 (심화)**

**개발 우선순위:** Phase 4 (심화 콘텐츠 및 운영 도구) - 난이도: 어려움

### **프론트엔드 기능명세서**

1.  **화면 레이아웃 및 디자인 명세**:
    *   **신화 등급 시각적 표현**:
        *   인벤토리 아이템 카드(`app/inventory/InventoryItemCard.tsx`), 상세 정보 팝업(`components/features/ItemDetailDialog.tsx`), 장비 슬롯(`app/character/EquipmentSlot.tsx`) 등에서 '신화(Mythic)' 등급 아이템을 시각적으로 구분할 수 있는 고유한 스타일(예: 특별한 테두리 색상/애니메이션, 뱃지) 적용.
    *   **아이템 상세 정보 팝업 (`components/features/ItemDetailDialog.tsx`) 확장**:
        *   **고유 옵션(Unique Options) 표시:** 아이템 정보 내 별도 섹션으로 "고유 옵션" 표시. 옵션 이름과 상세 효과 설명. (기존 옵션 표시 영역 활용 또는 확장)
        *   **세트 효과(Set Effects) 표시:**
            *   아이템이 세트에 속할 경우, "세트: [세트 이름]" 표시.
            *   클릭 가능한 링크 또는 버튼으로 해당 세트의 전체 효과(2세트 효과, 4세트 효과 등)를 보여주는 별도 툴팁(`Tooltip`) 또는 팝업(`Dialog`) 표시.
            *   현재 착용 중인 동일 세트 아이템 개수 표시 (예: "세트 효과 (2/4)").
        *   **ShadCN 컴포넌트 활용:** 기존 `Dialog`, `Badge`, `Separator`, `Tooltip` 등 활용. 세트 효과 상세 표시에 추가 `Dialog` 또는 `Popover` 활용 가능.
    *   **캐릭터 정보 화면 - 활성화된 세트 효과 표시 (`app/character/CharacterStatPanel.tsx` 또는 별도 컴포넌트)**:
        *   캐릭터 정보 화면의 스탯 표시 영역 근처 또는 별도 패널에 현재 활성화된 세트 효과 목록 표시.
        *   세트 이름과 현재 적용 중인 효과 단계(예: "용기의 세트 (2세트 효과): 공격력 +10%") 표시.
        *   **파일 위치:** `app/character/CharacterStatPanel.tsx` 또는 `app/character/ActiveSetEffectsPanel.tsx`.
    *   **인벤토리 필터/정렬 (`app/inventory/InventoryFilterSort.tsx`) 업데이트 (선택적)**:
        *   필터에 '신화' 등급 추가.
        *   정렬 기준에 '세트 이름' 추가 고려.

2.  **사용자 흐름 및 상호작용**:
    *   사용자는 신화 등급 아이템을 획득 (고난도 콘텐츠 보상 등).
    *   인벤토리에서 신화 등급 아이템의 차별화된 시각적 표시 확인.
    *   아이템 상세 정보 팝업에서 신화 등급, 고유 옵션, 세트 정보 확인.
    *   세트 이름 클릭 또는 버튼으로 세트 효과 상세 내용 확인.
    *   동일 세트 아이템을 여러 개 장착.
    *   캐릭터 정보 화면에서 활성화된 세트 효과(예: 2세트 효과) 및 그로 인한 스탯 변화 확인.
    *   더 많은 동일 세트 아이템 장착 시, 상위 세트 효과(예: 4세트 효과)가 활성화되고 캐릭터 정보 화면에 반영되는 것 확인.

3.  **API 연동**:
    *   **아이템 데이터 로드 확장:**
        *   인벤토리, 캐릭터 장착 정보 등을 로드하는 API는 이제 `game_items`에서 신화 등급, 고유 옵션 데이터, 세트 ID(`set_id`) 및 세트 이름 정보를 포함하여 반환해야 함.
        *   `game_item_sets` 테이블의 세트 효과 정보를 클라이언트에서 접근 가능해야 함 (초기 전체 로드 또는 필요 시 API 요청).
    *   **캐릭터 스탯 계산 로직 의존성:** 활성화된 세트 효과는 최종 캐릭터 스탯 계산 시 반영되어야 함. 클라이언트에서 스탯 표시 시 이 계산 결과를 반영하거나, 서버에서 계산된 최종 스탯을 받아 표시.

4.  **테스트 항목**:
    *   신화 등급 아이템의 시각적 구분이 명확하게 표시되는지 확인.
    *   아이템 상세 정보 팝업에 고유 옵션과 세트 정보(이름, 소속 세트 개수)가 정확히 표시되는지 확인.
    *   세트 효과 상세 보기 기능(툴팁/팝업)이 정상 작동하고 모든 효과 단계가 표시되는지 확인.
    *   동일 세트 아이템 장착 개수에 따라 캐릭터 정보 화면의 활성화된 세트 효과 표시가 올바르게 업데이트되는지 확인 (예: 1개 -> 효과 없음, 2개 -> 2세트 효과 표시, 3개 -> 2세트 효과 표시, 4개 -> 4세트 효과 표시).
    *   (백엔드 연동 후) 활성화된 세트 효과가 실제 캐릭터 스탯에 반영되는지 확인.

---

### **백엔드 기능명세서**

1.  **API 정의**:
    *   **아이템/캐릭터 데이터 제공 API 수정 (기존 API 확장)**:
        *   `/api/inventory`, `/api/game-state` 등 아이템 정보를 반환하는 모든 API는 응답 데이터에 다음 내용을 포함하도록 수정:
            *   `grade`: 'mythic' 포함.
            *   `unique_options`: (JSONB 또는 관련 테이블 조인 결과) 고유 옵션 정보.
            *   `set_id`: 아이템이 속한 세트 ID (nullable).
            *   `set_info`: (선택적, `game_item_sets` 조인 결과) 세트 이름, 효과 요약 등.
        *   활성화된 세트 효과를 계산하여 반환하는 API (`/api/character-stats` 등) 구현 고려.
    *   **세트 정보 제공 API (선택적, `/api/item-sets/route.ts` GET)**:
        *   **목적:** 클라이언트에 전체 `game_item_sets` 정보 제공 (캐싱 활용).
        *   **처리 로직:** `game_item_sets` 테이블 전체 데이터 조회 및 반환.

2.  **데이터베이스 설계 및 연동**:
    *   **`game_items` 테이블 수정/확장**:
        *   `grade` (text): `check` 제약 조건에 'mythic' 추가.
        *   `unique_options` (jsonb, nullable): 고유 옵션 저장. 예: `[{"option_id": "life_steal", "value": 0.03}, {"option_id": "final_damage_increase", "value": 0.05}]`. (또는 별도 `item_unique_options` 테이블 설계).
        *   `set_id` (varchar or int, FK to game_item_sets.id, nullable): 아이템이 속한 세트 ID 참조.
    *   **`game_item_sets` 테이블 (신규 생성)**:
        *   `id` (varchar or int, PK) - 세트 고유 ID (예: 'dragon_slayer_set')
        *   `name` (text, not null) - 세트 이름 (예: "용 사냥꾼의 세트")
        *   `effects` (jsonb, not null) - 세트 효과 정의. 예:
            ```json
            [
              { "required_pieces": 2, "description": "공격력 +10%", "stats": [{"stat": "attack_percent", "value": 0.1}] },
              { "required_pieces": 4, "description": "모든 스킬 데미지 +15%", "stats": [{"stat": "skill_damage_increase", "value": 0.15}] },
              { "required_pieces": 6, "description": "궁극기 사용 시 10초간 치명타 확률 20% 증가", "special_effect": "ultimate_crit_buff" }
            ]
            ```
        *   RLS 정책 (읽기 전용 허용) 권장.
    *   **`user_inventory`, `user_equipped_items`**: 스키마 변경 불필요. `game_items` 조인하여 정보 활용.
    *   **(신규 생성 또는 기존 로직 확장) 캐릭터 스탯 계산 로직 (DB 함수 또는 서버 로직)**:
        *   사용자의 장착 아이템(`user_equipped_items`) 조회.
        *   장착된 아이템들의 `set_id`를 그룹화하고 개수 카운트.
        *   각 세트별로 `game_item_sets.effects` 조회하여 충족된 `required_pieces`에 해당하는 효과(`stats`, `special_effect`) 추출.
        *   기본 스탯, 아이템 스탯, 스킬 패시브 효과 등과 함께 세트 효과를 합산하여 최종 스탯 계산.
    *   **연동 로직:** API 핸들러 및 Server Action 내에서 Supabase 클라이언트 사용하여 확장된 `game_items` 및 신규 `game_item_sets` 테이블 조회. 아이템 획득 로직(`recordLoot`) 수정하여 신화 등급 및 고유 옵션 생성/할당 로직 추가 필요 (예: 고난도 보스 처치 시 특정 확률로 드랍, 옵션은 랜덤 풀에서 선택 또는 고정).

3.  **테스트 항목**:
    *   아이템 관련 API가 신화 등급, 고유 옵션, 세트 ID/정보를 정확하게 반환하는지 확인.
    *   (구현 시) 세트 정보 API가 모든 세트 효과 정의를 정확하게 반환하는지 확인.
    *   신화 등급 아이템 드랍 및 고유 옵션 할당 로직이 정상 작동하는지 확인 (백엔드 로직 테스트).
    *   캐릭터 스탯 계산 로직이 장착된 세트 아이템 개수에 따라 올바른 세트 효과(스탯 증가, 특수 효과 플래그 등)를 적용하여 최종 스탯을 계산하는지 확인 (단위/통합 테스트).
    *   DB 스키마 변경(check 제약 조건, FK, 신규 테이블) 및 RLS 정책이 올바르게 적용되었는지 확인.
    *   `game_item_sets`의 `effects` JSON 구조 및 데이터가 올바른지 확인.

---

