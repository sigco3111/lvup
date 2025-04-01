---

## **기능명세서: 20. 직업 변경 기능**

**개발 우선순위:** Phase 4 (심화 콘텐츠 및 운영 도구) - 난이도: 보통

### **프론트엔드 기능명세서**

1.  **화면 레이아웃 및 디자인 명세**:
    *   **직업 변경 UI (`components/features/JobSwitchDialog.tsx`)**:
        *   캐릭터 정보 화면(`app/character/page.tsx`) 등에서 접근 가능한 별도의 `Dialog` 형태 UI.
        *   **현재 직업 정보:** 현재 직업 아이콘, 이름, 티어 표시.
        *   **변경 가능 직업 목록:** 현재 직업과 동일한 티어(Tier) 내에서 변경 가능한 다른 직업 목록을 `Card` 형태로 표시. (예: 1차 전직 '버서커' 상태라면, 동일 티어의 다른 1차 직업 '팔라딘' 표시)
        *   각 `Card`에는 변경할 직업의 아이콘, 이름, 간략한 특징 설명 표시.
        *   **변경 비용:** 직업 변경에 필요한 재화(예: 다이아몬드 또는 대량의 골드) 종류와 수량 명확히 표시. (ShadCN `Badge` 또는 텍스트)
        *   **"이 직업으로 변경" 버튼:** 선택한 직업 카드의 하단에 배치. 비용 부족 시 비활성화.
        *   **주의사항 안내:** 직업 변경 시 발생할 수 있는 변경 사항(예: 일부 스킬 초기화)에 대한 안내 문구 포함.
        *   **ShadCN 컴포넌트 활용:** `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `Card`, `Button`, `Badge`, `AlertDialog` (최종 확인용).
        *   **파일 위치:** `components/features/JobSwitchDialog.tsx`.
    *   **캐릭터 정보 화면 업데이트 (`app/character/page.tsx`)**:
        *   직업 변경 완료 시 직업 이름, 아이콘, 티어(동일 유지), 스탯 정보가 업데이트되어야 함.
    *   **스킬 관련 UI 업데이트 (`app/skills/page.tsx`, `app/dashboard/ActiveSkillSlots.tsx`)**:
        *   직업 변경으로 인해 스킬 목록(습득/미습득 상태) 및 액티브 슬롯 상태가 변경될 수 있으므로, 해당 UI도 업데이트 필요.

2.  **사용자 흐름 및 상호작용**:
    *   사용자가 캐릭터 정보 화면 등에서 '직업 변경' 버튼 클릭 > 직업 변경 `Dialog` 열림.
    *   현재 직업과 변경 가능한 동일 티어 직업 목록 및 비용 확인.
    *   변경을 원하는 직업 카드 선택.
    *   "이 직업으로 변경" 버튼 클릭 (비용 충분 시 활성화).
    *   최종 확인 `AlertDialog` 표시 ("직업을 [대상 직업 이름](으)로 변경하시겠습니까? 비용: [비용]. 변경 시 일부 스킬이 초기화될 수 있습니다.") > '확인' 클릭.
    *   직업 변경 Server Action 호출 및 로딩 상태 표시.
    *   성공 응답 시:
        *   "직업이 [대상 직업 이름](으)로 변경되었습니다." `Toast` 메시지 표시.
        *   `Dialog` 닫힘.
        *   캐릭터 정보, 스킬 목록, 액티브 슬롯 등 관련 UI 업데이트.
        *   보유 재화 UI 업데이트.
    *   실패 응답 시 (예: 재화 부족 최종 체크 실패) 오류 메시지 표시.

3.  **API 연동**:
    *   **데이터 로드**: 직업 변경 UI 열 때 필요한 데이터 fetch:
        *   현재 사용자 정보 (직업, 티어, 보유 재화).
        *   현재 직업과 동일 티어의 다른 직업 목록 (`game_jobs` 테이블 조회, 티어 및 관계 기반 필터링).
        *   각 직업 변경 비용 정보 (`game_jobs` 테이블).
    *   **Server Action 호출**: `requestJobSwitch(targetJobId: string)` 호출.

4.  **테스트 항목**:
    *   직업 변경 UI가 정상적으로 열리고, 현재 직업과 변경 가능한 동일 티어 직업 목록, 비용이 정확하게 표시되는지 확인.
    *   재화 부족 시 변경 버튼이 비활성화되는지 확인.
    *   최종 확인 팝업이 올바른 정보(대상 직업, 비용)와 함께 표시되는지 확인.
    *   직업 변경 성공 시 관련 UI(캐릭터 정보, 스킬 목록/슬롯, 재화)가 올바르게 업데이트되고 성공 메시지가 표시되는지 확인.
    *   다른 티어의 직업으로 변경 시도가 불가능한지 확인 (UI 레벨 및 백엔드 검증).
    *   Server Action 호출 및 응답 처리가 올바르게 이루어지는지 확인.

---

### **백엔드 기능명세서**

1.  **API 정의**:
    *   **동일 티어 직업 목록 제공 API (기존 직업 정보 API 확장 또는 별도)**:
        *   **목적:** 클라이언트에 현재 직업과 동일한 티어 내에서 변경 가능한 직업 목록 및 변경 비용 제공.
        *   **처리 로직:** 요청된 직업 ID의 `tier` 및 '기반 직업'(base job, 예: 전사 계열, 마법사 계열 등 분류 필요) 정보를 사용하여, 동일 `tier`와 동일 '기반 직업' 그룹에 속하는 다른 직업 목록(`game_jobs`)과 해당 직업들의 `job_change_cost` 정보 조회 및 반환. ('기반 직업' 분류를 위한 `game_jobs` 테이블 설계 필요)
    *   **Server Action `requestJobSwitch(targetJobId: string)`**:
        *   **파일 위치:** `actions/character.ts` (또는 `actions/job.ts`)
        *   **처리 로직:**
            1.  사용자 인증 확인.
            2.  `user_characters` 테이블에서 현재 사용자 정보(현재 `job_id`, 보유 재화 정보 확인 위해 `user_game_data` 조인 또는 별도 조회) 조회.
            3.  `game_jobs` 테이블에서 현재 직업 정보(`currentJob`) 및 `targetJobId` 직업 정보(`targetJob`) 조회 (`tier`, `job_change_cost`, `job_specific_skills`, `auto_learn_skills_on_change` 등).
            4.  **조건 검증:**
                *   `targetJobId`가 유효한 직업 ID인가?
                *   `targetJob.tier` == `currentJob.tier` 인가? (동일 티어 검증)
                *   `targetJobId` != `currentJob.id` 인가? (다른 직업인지 검증)
                *   (선택적) `targetJob`과 `currentJob`이 동일 '기반 직업' 그룹에 속하는가?
                *   사용자가 `targetJob.job_change_cost`에 명시된 재화를 충분히 보유하고 있는가?
            5.  **스킬 처리 정책 정의 및 구현:** (중요!)
                *   **방안 예시:**
                    *   **기존 직업 전용 스킬 처리:** `currentJob.job_specific_skills` 목록에 해당하는 스킬들을 `user_skills`에서 삭제 (또는 비활성화). 관련 `user_equipped_skills` 레코드도 삭제.
                    *   **신규 직업 기본 스킬 처리:** `targetJob.auto_learn_skills_on_change` 목록에 해당하는 스킬들을 `user_skills`에 삽입 (Lv 1).
                    *   **공용 스킬 및 스킬 포인트:** 유지 (또는 별도 정책).
            6.  **트랜잭션 시작 (DB 함수 권장):**
                *   `user_game_data` 테이블에서 `job_change_cost` 만큼 재화 차감.
                *   `user_characters` 테이블의 `job_id`를 `targetJobId`로 업데이트.
                *   (필요시) 스탯 보정치 재적용.
                *   정의된 스킬 처리 정책에 따라 `user_skills` 및 `user_equipped_skills` 테이블 업데이트 (삭제 및 삽입).
            7.  **트랜잭션 종료.**
            8.  성공/실패 결과 반환. `revalidatePath` 호출 (`/character`, `/skills`, `/dashboard`).

2.  **데이터베이스 설계 및 연동**:
    *   **`game_jobs` 테이블 수정/확장**:
        *   `job_change_cost` (jsonb, nullable): 변경 비용 정의. 예: `{"currency": "diamond", "amount": 100}`.
        *   `base_job_group` (text, nullable): 동일 티어 내 변경 가능 그룹 식별자 (예: 'warrior_line', 'mage_line'). 또는 다른 방식으로 관계 정의.
        *   `job_specific_skills` (jsonb or text[]): 해당 직업 고유 스킬 ID 목록 (스킬 처리 로직에 필요).
        *   `auto_learn_skills_on_change`: 데이터 활용 방식 변경 없음 (신규 직업 기본 스킬 부여용).
    *   **`user_characters` 테이블**: `job_id` 업데이트 대상. 스탯 재계산 대상.
    *   **`user_game_data` 테이블**: 재화 차감 대상.
    *   **`user_skills` 테이블**: 스킬 삭제 및 삽입 대상.
    *   **`user_equipped_skills` 테이블**: 장착된 직업 전용 스킬 삭제 대상.
    *   **연동 로직:** Server Action 내 Supabase 클라이언트 사용. 재화 차감, 직업 변경, 스탯 업데이트, 스킬 변경 등 여러 테이블에 걸친 작업이므로 트랜잭션(DB 함수) 사용 필수. 스킬 처리 로직을 명확히 구현해야 함.

3.  **테스트 항목**:
    *   동일 티어 직업 목록 및 변경 비용 API가 정확한 데이터를 반환하는지 확인.
    *   `requestJobSwitch` 액션:
        *   조건 검증(동일 티어, 다른 직업, 재화 보유량)이 올바르게 작동하는지 확인.
        *   성공 시:
            *   재화가 정확히 차감되는지 확인 (`user_game_data`).
            *   직업 ID가 올바르게 변경되는지 확인 (`user_characters`).
            *   (구현 시) 스탯이 재계산되어 반영되는지 확인.
            *   정의된 정책에 따라 기존 직업 스킬이 삭제/비활성화되고, 새 직업 기본 스킬이 추가되는지 확인 (`user_skills`, `user_equipped_skills`).
        *   트랜잭션 원자성 확인 (모든 변경이 성공하거나 모두 롤백되어야 함).
    *   사용자 인증 및 유효하지 않은 `targetJobId` 처리 확인.
    *   DB 스키마 변경(필드 추가, 데이터 정의) 및 RLS 정책 확인.

---
