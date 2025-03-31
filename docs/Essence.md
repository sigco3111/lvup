---

## **기능명세서: 20. '고대의 정수' 추가 획득처**

**개발 우선순위:** Phase 3 (주요 부가 기능 및 편의성 개선) - 난이도: 쉬움

### **프론트엔드 기능명세서**

1.  **화면 레이아웃 및 디자인 명세**:
    *   **UI 변경 사항 최소화:** 이 기능 자체를 위한 새로운 UI 요소는 거의 없음. 기존 UI 컴포넌트의 데이터 업데이트가 중요.
    *   **'고대의 정수' 보유량 표시 업데이트 (`app/relics/page.tsx` 또는 관련 컴포넌트)**:
        *   **참고:** 유물 관리 화면 등에 이미 정의된 '고대의 정수' 보유량 표시 UI가 새로운 획득처에서 얻었을 때 실시간(또는 적절한 시점)으로 업데이트되어야 함. (기능 11 명세서 참조)
    *   **획득 로그 표시 (`app/dashboard/BattleLog.tsx`)**:
        *   자동 전투 중 몬스터 드랍 또는 특정 스테이지 클리어 보상으로 '고대의 정수'를 획득했을 경우, 전투 로그에 해당 내역 표시 (예: "+5 고대의 정수 (스테이지 클리어 보상)"). (기능 3 명세서 참조)
    *   **(구현 시) 업적 보상 UI (`app/achievements/page.tsx`)**:
        *   **참고:** 업적 시스템(기능 18) 구현 시, 보상 목록에 '고대의 정수' 아이콘과 수량이 표시될 수 있어야 함.

2.  **사용자 흐름 및 상호작용**:
    *   사용자는 평소대로 게임을 플레이 (자동 전투, 스테이지 진행, 향후 업적 달성 등).
    *   백엔드에서 정의된 조건(예: 특정 보스 반복 클리어, 특정 몬스터 처치 시 확률적 드랍, 업적 달성) 충족 시 '고대의 정수' 자동 획득.
    *   획득 시점에 전투 로그 및 보유량 UI에 즉시 또는 주기적으로 반영됨. 사용자가 별도로 수행하는 액션은 없음 (업적 보상 수령 제외).

3.  **API 연동**:
    *   **데이터 업데이트 수신:** 백엔드에서 '고대의 정수' 획득 이벤트 발생 시 (예: Server Action 응답, Supabase Realtime 등 활용 가능), 클라이언트의 보유량 상태 업데이트 필요.
    *   **Server Action 호출 의존성:**
        *   몬스터 드랍 추가 시: `recordLoot` (기능 3) Action이 '고대의 정수' 획득 정보를 처리하고 반환해야 함.
        *   스테이지 클리어 보상 추가 시: `clearStage` (기능 4) Action이 '고대의 정수' 보상 정보를 처리하고 반환해야 함.
        *   업적 보상 추가 시: (향후) `claimAchievementReward` (기능 18) Action이 '고대의 정수' 지급 처리.

4.  **테스트 항목**:
    *   정의된 추가 획득처(예: 특정 스테이지 클리어, 몬스터 드랍)에서 '고대의 정수'가 실제로 획득되는지 확인 (백엔드 로그 또는 DB 확인 병행).
    *   획득 시 전투 로그에 정확한 수량과 함께 메시지가 표시되는지 확인.
    *   '고대의 정수' 보유량 UI가 획득량만큼 정확하게 증가하는지 확인.
    *   (구현 시) 업적 보상으로 '고대의 정수' 수령 시 정상적으로 지급되고 UI에 반영되는지 확인.

---

### **백엔드 기능명세서**

1.  **API 정의**:
    *   **기존 Server Action 수정:**
        *   **`recordLoot` (`actions/game.ts`) 수정**:
            *   몬스터 드랍 테이블(`game_monster_loot_tables`) 조회 로직에 '고대의 정수' 항목 추가 가능성 고려.
            *   LootData 인터페이스 및 처리 로직에 `ancient_essence?: number` 추가.
            *   재화 업데이트 로직 (`update_user_resources` DB 함수 또는 직접 업데이트)에 `ancient_essence` 증가 처리 추가.
        *   **`clearStage` (`actions/game.ts`) 수정**:
            *   특정 스테이지(특히 보스 스테이지 반복 클리어) 클리어 시 '고대의 정수' 보상을 지급하는 로직 추가.
            *   `game_stages` 테이블에 `repeat_clear_reward_essence` (integer, nullable) 같은 컬럼 추가 고려.
            *   조건 만족 시, 재화 업데이트 로직 호출하여 `ancient_essence` 지급.
            *   Action 반환값에 획득한 `ancient_essence` 수량 포함.
        *   **`update_user_resources` (DB 함수)** 수정:
            *   `p_ancient_essence_delta` (bigint) 파라미터 추가.
            *   `UPDATE public.user_game_data SET ancient_essence = ancient_essence + p_ancient_essence_delta ...` 로직 추가.
    *   **(향후) `claimAchievementReward` (`actions/achievements.ts`)**:
        *   업적 보상 데이터(`game_achievements.rewards`)에 '고대의 정수' 정보 포함 가능하도록 설계.
        *   보상 수령 시 `update_user_resources` DB 함수 호출하여 `ancient_essence` 지급.

2.  **데이터베이스 설계 및 연동**:
    *   **`user_game_data` 테이블**: `ancient_essence` 컬럼 (기능 11에서 추가됨) 사용.
    *   **`game_stages` 테이블**: (선택적) `repeat_clear_reward_essence` 컬럼 추가하여 스테이지 클리어 시 정수 보상 설정.
    *   **`game_monster_loot_tables` / `game_monsters` 테이블**: (선택적) 몬스터 드랍 항목에 '고대의 정수' ID, 드랍률, 수량 범위 등 정의 필요.
    *   **`game_achievements` 테이블** (기능 18): `rewards` (jsonb) 컬럼에 `{ "type": "ancient_essence", "amount": 10 }` 형태의 데이터 저장 가능하도록 설계.
    *   **연동 로직:** 수정된 Server Action 내에서 Supabase 클라이언트 사용. 재화 업데이트는 `update_user_resources` DB 함수 호출을 통해 원자성 보장.

3.  **테스트 항목**:
    *   `recordLoot` 액션: 몬스터가 '고대의 정수'를 드랍하도록 설정했을 때, `user_game_data.ancient_essence`가 정상적으로 증가하는지 확인.
    *   `clearStage` 액션: '고대의 정수' 보상이 설정된 스테이지 클리어 시, `user_game_data.ancient_essence`가 정상적으로 증가하는지 확인.
    *   `update_user_resources` DB 함수가 '고대의 정수' 증감 처리를 올바르게 수행하는지 단위 테스트.
    *   (구현 시) `claimAchievementReward` 액션: '고대의 정수' 보상이 포함된 업적 완료 및 보상 수령 시, `user_game_data.ancient_essence`가 정상적으로 증가하는지 확인.
    *   모든 추가 획득 경로에서 지급되는 수량이 기획 의도와 일치하는지 확인.
    *   재화 증가 처리의 원자성 및 동시성 문제 발생 여부 확인.

---
