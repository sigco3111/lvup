---

## **기능명세서: 19. 업적 시스템**

**개발 우선순위:** Phase 4 (심화 콘텐츠 및 운영 도구) - 난이도: 보통

### **프론트엔드 기능명세서**

1.  **화면 레이아웃 및 디자인 명세**:
    *   **업적 목록 화면 (`app/achievements/page.tsx`)**:
        *   사용자가 달성할 수 있는 업적 목록을 표시하는 전용 페이지.
        *   **탭/필터:** '진행 중', '완료됨', '보상 받기 가능' 등 상태별로 필터링 가능한 탭 또는 드롭다운 제공. (ShadCN `Tabs`, `Select`)
        *   **업적 카드 (`app/achievements/AchievementCard.tsx`)**: 각 업적은 `Card` 컴포넌트로 표시.
            *   **표시 정보:** 업적 아이콘/이미지, 이름, 달성 조건 설명, 현재 진행 상황 (예: 50/100), 보상 목록 (아이콘 + 수량), 완료 상태 뱃지(`Badge`).
            *   **진행도 시각화:** 달성률을 `Progress` 컴포넌트로 표시.
            *   **보상 받기 버튼:** 완료되었고 아직 보상을 받지 않은 업적 카드에 '보상 받기' 버튼 표시. (ShadCN `Button`) 이미 받은 경우 비활성화 또는 "보상 완료" 텍스트 표시.
        *   **ShadCN 컴포넌트 활용:** `Tabs`, `Select`, `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `Progress`, `Badge`, `Button`, `Tooltip` (보상 상세 설명).
        *   **파일 위치:** `app/achievements/page.tsx`, `app/achievements/AchievementCard.tsx`.
    *   **업적 달성 알림 (`components/common/Notifications.tsx`)**:
        *   특정 업적의 달성 조건을 충족했을 때 "업적 달성: [업적 이름]" `Toast` 알림 표시.
        *   알림 클릭 시 업적 목록 화면으로 이동하는 링크 제공 가능.
        *   **ShadCN 컴포넌트 활용:** `Toast`.
    *   **메뉴 알림 (선택적)**:
        *   새롭게 완료되어 보상 수령 가능한 업적이 있을 경우, 메뉴(예: 사이드바 또는 하단 네비게이션)의 '업적' 항목에 알림 뱃지(`Badge`) 표시.

2.  **사용자 흐름 및 상호작용**:
    *   사용자가 게임 내 다양한 활동(레벨업, 스테이지 클리어, 아이템 획득/강화 등)을 수행하면, 해당 활동과 연관된 업적의 진행도가 자동으로 업데이트됨 (백엔드 처리).
    *   업적 달성 조건을 충족하면 달성 알림 `Toast` 발생.
    *   사용자가 업적 목록 화면으로 이동하여 진행 상황 및 완료된 업적 확인.
    *   완료되었고 보상 수령 가능한 업적 카드에서 '보상 받기' 버튼 클릭.
    *   보상 수령 API(Server Action) 호출 및 로딩 상태 표시 (버튼 비활성화).
    *   성공 응답 시:
        *   "보상을 받았습니다!" `Toast` 메시지 표시.
        *   해당 업적 카드의 버튼 상태가 "보상 완료"로 변경됨.
        *   획득한 보상(재화, 아이템)이 사용자 데이터에 반영되고 관련 UI(골드, 인벤토리 알림 등) 업데이트.
    *   실패 응답 시 오류 메시지 표시.

3.  **API 연동**:
    *   **데이터 로드**: 업적 화면 진입 시 필요한 데이터 fetch:
        *   `game_achievements`: 모든 업적 정의 데이터 (클라이언트 캐싱 고려).
        *   `user_achievements`: 사용자의 각 업적별 진행 상황 및 완료/수령 상태.
    *   **Server Action 호출**:
        *   `claimAchievementReward(achievementId: string)`: 완료된 업적의 보상 수령 요청.
    *   **업적 진행도 업데이트**: 백엔드의 다양한 Server Action(예: `recordLoot`, `clearStage`, `enhanceItem` 등) 내부에서 관련 이벤트 발생 시, `updateAchievementProgress` (별도 Action 또는 DB 함수)를 호출하여 진행도 업데이트 필요. 프론트엔드는 업데이트된 데이터를 주기적으로 또는 실시간(Supabase Realtime)으로 받아 UI 갱신.

4.  **테스트 항목**:
    *   업적 목록 화면에 모든 업적이 정의된 정보(이름, 조건, 보상, 진행도)와 함께 올바르게 표시되는지 확인.
    *   진행 중/완료/보상 가능 상태 필터링이 정상 작동하는지 확인.
    *   게임 내 활동 시 관련 업적 진행도가 증가하고 UI(`Progress` 바, 텍스트)에 반영되는지 확인.
    *   업적 달성 시 알림 `Toast`가 발생하는지 확인.
    *   '보상 받기' 버튼이 조건에 따라 올바르게 활성화/비활성화되는지 확인.
    *   '보상 받기' 성공 시 버튼 상태 변경, 성공 메시지 표시, 보상이 정상 지급되고 관련 UI가 업데이트되는지 확인.
    *   이미 보상을 받은 업적에 대해 다시 받기 시도가 불가능한지 확인 (백엔드 연동 후).
    *   Server Action 호출 및 응답 처리가 올바르게 이루어지는지 확인.

---

### **백엔드 기능명세서**

1.  **API 정의**:
    *   **업적 정의 데이터 제공 API (`/api/game-data/achievements/route.ts` GET 또는 게임 초기 데이터 로드 시 포함)**:
        *   **목적:** 클라이언트에 전체 `game_achievements` 목록 제공.
        *   **처리 로직:** `game_achievements` 테이블 전체 데이터 조회 및 반환 (캐싱 활용).
    *   **사용자 업적 진행 상황 제공 API (`/api/user/achievements/route.ts` GET 또는 게임 상태 로드 시 포함)**:
        *   **목적:** 클라이언트에 현재 사용자의 `user_achievements` 정보 제공. `game_achievements` 정보와 조인하여 반환하면 효율적.
        *   **처리 로직:** 인증된 사용자의 `userId`로 `user_achievements` 테이블 조회. 필요시 `game_achievements` 조인.
    *   **Server Action `updateAchievementProgress(userId: string, eventType: string, eventData: any)` (내부 호출용)**:
        *   **파일 위치:** `actions/achievements.ts` (또는 DB 함수로 구현 권장)
        *   **목적:** 다양한 게임 이벤트 발생 시 관련 업적 진행도를 업데이트하는 중앙 처리 로직. 다른 Server Action들(`recordLoot`, `clearStage` 등) 내부에서 호출됨.
        *   **처리 로직:**
            1.  `eventType`과 `eventData`를 기반으로, 해당 이벤트와 관련된 `game_achievements` 목록 필터링 (예: `trigger_type` = 'LEVEL_UP', `trigger_type` = 'STAGE_CLEAR' 등).
            2.  필터링된 각 업적에 대해 `user_achievements` 테이블에서 해당 사용자의 진행 상황 조회 (없으면 생성).
            3.  `eventData`를 사용하여 진행도 업데이트 값 계산 (예: 스테이지 클리어 시 1 증가, 몬스터 처치 수 누적 등).
            4.  `user_achievements` 테이블의 `current_progress` 업데이트.
            5.  업데이트 후 `current_progress` >= `game_achievements.target_value` 이고, 아직 `completed_at`이 null이면 `completed_at`을 현재 시간으로 업데이트. (업적 달성 처리)
            6.  (선택적) 업적 달성 시 클라이언트에 알림을 보낼 수 있는 메커니즘 트리거 (예: Supabase Realtime 이벤트 발생).
    *   **Server Action `claimAchievementReward(achievementId: string)`**:
        *   **파일 위치:** `actions/achievements.ts`
        *   **처리 로직:**
            1.  사용자 인증 확인.
            2.  `achievementId`로 `game_achievements` 정보(특히 `rewards`) 조회.
            3.  `user_achievements` 테이블에서 해당 `userId`와 `achievementId` 레코드 조회.
            4.  **조건 검증:**
                *   `completed_at`이 null이 아닌가? (완료된 업적인가?)
                *   `claimed_at`이 null인가? (아직 보상을 받지 않았는가?)
            5.  **트랜잭션 시작 (DB 함수 권장):**
                *   `user_achievements` 테이블의 `claimed_at`을 현재 시간으로 업데이트.
                *   `game_achievements.rewards`에 정의된 보상 목록을 기반으로 사용자에게 재화/아이템 지급 (`update_user_resources` DB 함수 호출, `user_inventory` 삽입 등).
            6.  **트랜잭션 종료.**
            7.  성공/실패 결과 및 지급된 보상 정보 반환. `revalidatePath` 호출 (`/achievements`, `/inventory`, `/dashboard`).

2.  **데이터베이스 설계 및 연동**:
    *   **`game_achievements` 테이블 (신규 생성)**:
        *   `id` (varchar or int, PK)
        *   `name` (text, not null)
        *   `description` (text, not null)
        *   `icon_url` (text)
        *   `trigger_type` (text, not null) - 예: 'LEVEL_UP', 'STAGE_CLEAR', 'MONSTER_KILL', 'ITEM_ACQUIRE', 'ITEM_ENHANCE', 'GOLD_EARNED', 'JOB_CHANGE' 등 이벤트 타입 정의.
        *   `trigger_condition` (jsonb, nullable) - 특정 조건 필터링. 예: `{"stage_id": "1-10"}`, `{"monster_id": "goblin_king", "count": 100}`, `{"item_grade": "legendary"}`, `{"enhancement_level": 15}`.
        *   `target_value` (integer, default 1) - 달성 목표값.
        *   `rewards` (jsonb, not null) - 보상 목록. 예: `[{"type": "gold", "amount": 10000}, {"type": "item", "itemId": "gem_001", "quantity": 5}, {"type": "ancient_essence", "amount": 10}]`.
        *   RLS 정책 (읽기 전용 허용) 권장.
    *   **`user_achievements` 테이블 (신규 생성)**:
        *   `user_id` (uuid, FK to auth.users.id, not null)
        *   `achievement_id` (varchar or int, FK to game_achievements.id, not null)
        *   `current_progress` (integer, default 0, not null)
        *   `completed_at` (timestamptz, nullable) - 최초 완료 시각.
        *   `claimed_at` (timestamptz, nullable) - 보상 수령 시각.
        *   Primary Key: `(user_id, achievement_id)`
        *   RLS 정책 필수.
    *   **연동 로직:** 다양한 게임 이벤트 관련 Server Action에서 `updateAchievementProgress` 호출 필요. `claimAchievementReward`는 조건 검증 및 트랜잭션(보상 지급 + 상태 업데이트) 로직 포함. DB 함수 활용하여 진행도 업데이트 및 완료 체크 로직 구현 권장.

3.  **테스트 항목**:
    *   업적 정의/사용자 진행 상황 API가 정확한 데이터를 반환하는지 확인.
    *   `updateAchievementProgress`: 다양한 이벤트 타입(`eventType`, `eventData`)에 대해 올바른 업적 진행도가 `user_achievements` 테이블에 업데이트되는지 확인. 완료 조건 충족 시 `completed_at`이 기록되는지 확인.
    *   `claimAchievementReward`: 조건 검증(완료 여부, 미수령 여부) 확인. 성공 시 `claimed_at` 기록 및 보상(재화, 아이템)이 정확히 지급되는지 확인. 트랜잭션 원자성 확인. 이미 수령한 경우 실패 처리 확인.
    *   DB 스키마(`trigger_type` 종류, `trigger_condition` 구조, `rewards` 구조), 제약 조건, RLS 정책 확인.
    *   진행도 업데이트 및 완료 체크 로직의 성능 고려 (특히 이벤트가 빈번할 경우).

---
