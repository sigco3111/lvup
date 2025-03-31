
---

## **기능명세서: 1. 캐릭터 기본 시스템**

**개발 우선순위:** Phase 1 (기초 인프라 및 핵심 데이터 설정) - 난이도: 보통

### **프론트엔드 기능명세서**

1.  **화면 레이아웃 및 디자인 명세**:
    *   **캐릭터 정보 화면 (`app/character/page.tsx`)**:
        *   **레벨 및 경험치 표시 (`app/character/LevelExpPanel.tsx`)**:
            *   현재 캐릭터 레벨을 크게 표시 (ShadCN `Badge` 또는 커스텀 스타일).
            *   현재 경험치 / 다음 레벨까지 필요한 경험치 텍스트 표시.
            *   경험치 바(Bar)를 시각적으로 표시하여 현재 경험치 비율을 보여줌 (ShadCN `Progress`).
        *   **기본 스탯 표시 (`app/character/BaseStatsPanel.tsx`)**:
            *   주요 기본 스탯(예: 힘, 민첩, 지능, 체력 등 PRD에서 정의된 기본 스탯) 목록과 해당 수치를 표시. (리스트 또는 그리드 형태, `Card` 컴포넌트 활용 가능).
            *   (선택적) 각 스탯에 마우스 오버 시 해당 스탯이 영향을 미치는 상세 능력치(예: 힘 -> 물리 공격력) 툴팁(`Tooltip`) 표시.
        *   **파일 위치:** `app/character/page.tsx` 및 관련 컴포넌트 (`app/character/LevelExpPanel.tsx`, `app/character/BaseStatsPanel.tsx`).
    *   **메인 대시보드 - 요약 정보 (`app/dashboard/GameStatusHeader.tsx`)**:
        *   화면 상단 헤더 영역에 현재 캐릭터 레벨(`Badge`) 요약 표시.
        *   경험치 바(`Progress`)를 헤더에 함께 표시하여 실시간 진행 상황 확인 용이.
    *   **레벨업 연출 및 알림**:
        *   경험치 획득으로 레벨업 발생 시:
            *   화면에 시각적 이펙트(예: 번쩍임, 파티클) 표시 (`app/dashboard/LevelUpEffect.tsx` - 별도 컴포넌트).
            *   "레벨 업! [Lv. N]" `Toast` 알림 표시 (`components/common/Notifications.tsx`).
            *   (스탯 포인트 시스템 구현 시) "스탯 포인트 +N 획득!" 알림 추가.

2.  **사용자 흐름 및 상호작용**:
    *   자동 전투(기능 2, 3)를 통해 경험치 획득 시:
        *   메인 대시보드 및 캐릭터 정보 화면의 경험치 바/텍스트 실시간(또는 주기적) 업데이트.
    *   경험치 요구량 충족 시 레벨업 자동 발생.
    *   레벨업 시:
        *   관련 UI(레벨 표시, 경험치 바/텍스트) 즉시 업데이트.
        *   레벨업 연출 및 알림 표시.
        *   캐릭터 정보 화면의 기본 스탯 값 업데이트.

3.  **API 연동**:
    *   **캐릭터 정보 로드:** 페이지 진입 시 사용자의 현재 레벨, 경험치, 기본 스탯, 다음 레벨 필요 경험치 등의 데이터를 로드 (`user_characters`, `game_level_requirements` 등 조회). (Server Component 데이터 전달 또는 Client fetch)
    *   **데이터 업데이트 수신:**
        *   경험치 획득 결과는 `recordLoot` (기능 3) Server Action의 응답 또는 Supabase Realtime 구독을 통해 수신하여 UI 업데이트.
        *   레벨업 발생 시 백엔드에서 변경된 레벨, 경험치, 스탯 정보를 받아 UI 업데이트.

4.  **테스트 항목**:
    *   캐릭터 정보 화면 및 메인 대시보드에 레벨, 경험치(바/텍스트), 기본 스탯이 정확하게 표시되는지 확인.
    *   경험치 획득 시 경험치 바 및 텍스트가 실시간으로(또는 주기적으로) 올바르게 업데이트되는지 확인.
    *   레벨업 시 레벨 숫자 증가, 경험치 바 리셋(또는 초과분 표시), 스탯 증가가 UI에 정확히 반영되는지 확인.
    *   레벨업 시 시각적 연출 및 알림 메시지가 정상적으로 표시되는지 확인.
    *   표시되는 '다음 레벨 필요 경험치' 값이 정확한지 확인.

---

### **백엔드 기능명세서**

1.  **API 정의**:
    *   **캐릭터 정보 제공 API (기존 게임 상태 로드 API 확장)**:
        *   **목적:** 클라이언트에 캐릭터의 레벨, 현재 경험치, 기본 스탯(힘, 민첩 등), 계산된 2차 스탯(HP, MP, 공격력 등 - 선택적) 및 다음 레벨 필요 경험치 제공.
        *   **처리 로직:** 인증된 사용자의 `userId`로 `user_characters` 테이블 조회. 현재 레벨(`user_characters.level`) + 1 기준으로 `game_level_requirements` 테이블 조회하여 `required_exp` 반환.
    *   **경험치 획득 및 레벨업 처리 로직 (기존 `update_user_resources` DB 함수 또는 관련 Server Action 내 통합)**:
        *   **목적:** 획득한 경험치를 반영하고, 조건 충족 시 레벨업 처리 및 관련 데이터 업데이트.
        *   **처리 로직:**
            1.  `userId`와 획득 경험치(`expDelta`) 입력 받음.
            2.  `user_characters` 테이블에서 현재 `level`, `experience` 조회.
            3.  새 경험치 계산: `newExperience = experience + expDelta`.
            4.  **레벨업 체크 루프 시작:** (여러 레벨 동시 상승 가능성 고려)
                a. 현재 `level` 기준으로 `game_level_requirements` 테이블에서 `required_exp` 조회.
                b. **If** `newExperience >= required_exp`: (레벨업 발생)
                   i.  `level` 1 증가.
                   ii. `newExperience = newExperience - required_exp` (경험치 차감 또는 레벨업 후 0부터 시작 정책 적용).
                   iii. 레벨업에 따른 기본 스탯 증가분 계산 (`game_jobs` 또는 `game_level_stats` 참조) 및 누적.
                   iv. (스킬 포인트 시스템 적용 시) 스킬 포인트 증가분 누적.
                   v.  레벨업 체크 루프 반복 (a 단계로 돌아가 새 레벨 기준 검사).
                c. **Else:** (레벨업 없음 또는 루프 종료)
                   i. 최종 계산된 `level`, `newExperience`, 누적된 스탯 증가량, 누적된 스킬 포인트 증가량 확정.
            5.  **DB 업데이트 (트랜잭션 내에서):**
                *   `user_characters` 테이블에 최종 `level`, `experience`, 증가된 스탯, 증가된 스킬 포인트 업데이트.
            6.  레벨업 발생 여부, 최종 레벨/경험치/스탯/포인트 정보 반환.

2.  **데이터베이스 설계 및 연동**:
    *   **`user_characters` 테이블 (기존 정의 확장)**:
        *   `level` (integer, default 1, not null)
        *   `experience` (bigint, default 0, not null)
        *   기본 스탯 컬럼들 (strength, dexterity, intelligence, vitality 등 - integer, not null, default 값 설정).
        *   (선택적) 계산된 스탯 컬럼들 (HP, MP, attack_power 등).
        *   `skill_points` (integer, default 0, not null).
    *   **`game_level_requirements` 테이블 (신규 생성)**:
        *   `level` (integer, PK) - 해당 레벨 도달에 필요한 조건 정의 (다음 레벨 X가 되기 위해 필요한 것).
        *   `required_exp` (bigint, not null) - 레벨 X -> 레벨 X+1 로 가기 위해 필요한 경험치 양.
        *   (선택적) 레벨별 기본 스탯 증가량 (`stat_increase` jsonb) - `game_jobs`와 별개로 레벨 자체 증가분 정의 시.
    *   **`game_jobs` 테이블 (기존 정의 확장)**:
        *   (선택적) `stats_per_level` (jsonb, nullable) - 직업별 레벨업 시 기본 스탯 증가량 정의. 예: `{"strength": 2, "vitality": 1}`.
    *   **연동 로직:** 재화/경험치 획득 처리 로직(`update_user_resources` DB 함수 또는 관련 Server Action) 내에서 Supabase 클라이언트 사용. 레벨업 체크 및 관련 데이터 업데이트는 원자적으로 처리되어야 하므로 DB 함수 구현 강력 권장.

3.  **테스트 항목**:
    *   캐릭터 정보 API가 레벨, 경험치, 스탯, 다음 레벨 필요 경험치를 정확하게 반환하는지 확인.
    *   경험치 획득 처리 시 `user_characters.experience`가 올바르게 업데이트되는지 확인.
    *   레벨업 조건 충족 시 (`required_exp` 이상):
        *   `user_characters.level`이 1 증가하는지 확인.
        *   `user_characters.experience`가 올바르게 조정되는지 확인 (초과분 반영 또는 리셋).
        *   `user_characters`의 기본 스탯이 `game_jobs.stats_per_level` (또는 `game_level_stats`) 기준으로 정확히 증가하는지 확인.
        *   `user_characters.skill_points`가 올바르게 증가하는지 확인 (정책에 따라).
    *   동시에 여러 레벨업이 가능한 경험치 획득 시 모든 레벨업이 정상 처리되는지 확인.
    *   `update_user_resources` DB 함수 또는 관련 로직의 정확성 및 원자성(모두 성공 또는 모두 실패) 확인.
    *   DB 스키마, 제약 조건, 기본값 설정 확인.

---
