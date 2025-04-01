---

## **기능명세서: 21. 어드민 시스템**

**개발 우선순위:** Phase 4 (심화 콘텐츠 및 운영 도구) - 난이도: 어려움

### **프론트엔드 기능명세서 (Admin Panel)**

*   **접근 경로:** `/admin` (별도 라우트 그룹 또는 미들웨어로 접근 제어)

1.  **화면 레이아웃 및 디자인 명세**:
    *   **어드민 레이아웃 (`app/admin/layout.tsx`)**:
        *   관리자 전용 레이아웃. 일반 사용자 UI와 분리.
        *   **사이드바 네비게이션 (`components/admin/AdminSidebar.tsx`)**: 관리 기능 메뉴 목록 (대시보드, 사용자 관리, 게임 데이터 관리, 재화/아이템 지급, 로그 등). 현재 활성화된 메뉴 표시.
        *   **헤더 (`components/admin/AdminHeader.tsx`)**: 로그인된 어드민 정보, 로그아웃 버튼 등 표시.
        *   **메인 컨텐츠 영역**: 선택된 관리 기능 화면 렌더링.
        *   **ShadCN 컴포넌트 활용:** 기본 레이아웃 구조 외 메뉴, 버튼 등에 ShadCN 컴포넌트 활용.
    *   **어드민 로그인 화면 (`app/admin/login/page.tsx` 또는 미들웨어 연동)**:
        *   관리자 계정(이메일/비밀번호 또는 특정 OAuth 제공자)으로 로그인. 일반 사용자 로그인과 분리.
        *   **ShadCN 컴포넌트 활용:** `Card`, `Form`, `Input`, `Button`.
    *   **대시보드 화면 (`app/admin/dashboard/page.tsx`)**:
        *   주요 지표(현재 접속자 수, 일일 가입자 수, 주요 재화 총량 등) 요약 표시. (차트 라이브러리 연동 필요: `recharts` 등)
        *   자주 사용하는 관리 기능 바로가기 버튼.
        *   **ShadCN 컴포넌트 활용:** `Card`, `Button`.
    *   **사용자 관리 화면 (`app/admin/users/page.tsx`)**:
        *   사용자 목록을 테이블 형태로 표시 (ID, 닉네임, 이메일(부분 마스킹), 가입일, 마지막 접속일, 상태(정상/정지)).
        *   검색(닉네임, 이메일) 및 필터링(상태별) 기능.
        *   페이지네이션.
        *   각 사용자 행 클릭 시 상세 정보 조회/수정 팝업(`Dialog`) 열림.
            *   **상세 정보:** 기본 정보 + 게임 진행 정보(레벨, 현재 스테이지, 보유 재화 요약).
            *   **관리 액션 (제한적):** 계정 상태 변경(정상/정지), 닉네임 변경(필요시), 재화/아이템 지급 바로가기. **개인정보 직접 수정은 지양.**
        *   **ShadCN 컴포넌트 활용:** `DataTable` (커스텀 구현 필요), `Input`, `Button`, `Dialog`, `Select`, `Badge`.
        *   **파일 위치:** `app/admin/users/page.tsx`, `app/admin/users/UserDataTable.tsx`, `app/admin/users/UserDetailDialog.tsx`.
    *   **게임 데이터 관리 화면 (예: `app/admin/game-data/items/page.tsx`)**:
        *   관리할 데이터 종류별 서브 메뉴 구성 (아이템, 몬스터, 스테이지, 스킬, 직업 등).
        *   각 데이터 목록을 `DataTable`로 표시. 검색/필터링 기능.
        *   데이터 생성('새로 만들기' 버튼), 수정(행 클릭 > `Dialog` 폼), 삭제 기능 제공.
        *   **주의:** 데이터 구조가 복잡하므로(JSONB 필드 등), 해당 데이터를 쉽게 편집할 수 있는 UI 폼 설계 필요 (예: JSON 편집기 연동 또는 필드별 입력 컴포넌트 매핑).
        *   **ShadCN 컴포넌트 활용:** `DataTable`, `Input`, `Button`, `Dialog`, `Form`, `Textarea` (JSON 편집용), `Select`.
    *   **재화/아이템 지급 화면 (`app/admin/giveaways/page.tsx`)**:
        *   지급 대상 사용자 선택 (닉네임/ID 검색).
        *   지급할 재화 종류(골드, 정수 등) 및 수량 입력.
        *   지급할 아이템 선택(아이템 ID 검색/선택) 및 수량, (필요시) 옵션 입력.
        *   지급 사유 입력 필드 (로그 기록용).
        *   "지급" 버튼 (확인 `AlertDialog` 필수).
        *   **ShadCN 컴포넌트 활용:** `Input`, `Select`, `Button`, `Form`, `AlertDialog`, `Textarea`.

2.  **사용자 흐름 및 상호작용**:
    *   관리자 계정으로 로그인 후 어드민 패널 접근.
    *   사이드바 메뉴를 통해 원하는 관리 기능 화면으로 이동.
    *   데이터 조회: 테이블에서 목록 확인, 검색/필터링 사용.
    *   데이터 관리: 생성/수정/삭제 버튼 클릭 > 팝업(Dialog) 폼 입력 > 저장.
    *   사용자 관리: 사용자 검색 > 상세 조회 > 필요시 상태 변경 등 제한적 액션 수행.
    *   재화/아이템 지급: 대상 사용자 선택 > 지급 내용 입력 > 사유 입력 > 확인 후 지급.
    *   모든 중요 액션(데이터 수정, 지급 등) 전 확인 `AlertDialog` 표시.

3.  **API 연동**:
    *   **인증 API:** 어드민 로그인/로그아웃 처리.
    *   **각 관리 기능별 CRUD API 호출:**
        *   `GET /api/admin/users`, `GET /api/admin/users/{userId}`, `PATCH /api/admin/users/{userId}`
        *   `GET /api/admin/game-data/items`, `POST /api/admin/game-data/items`, `GET /api/admin/game-data/items/{itemId}`, `PATCH /api/admin/game-data/items/{itemId}`, `DELETE /api/admin/game-data/items/{itemId}` (다른 데이터 타입도 유사)
        *   `POST /api/admin/giveaways/currency`, `POST /api/admin/giveaways/items`
    *   API 요청 시 어드민 인증 토큰(쿠키/헤더) 포함 필수.

4.  **테스트 항목**:
    *   어드민 역할 사용자만 `/admin` 경로 접근 및 로그인 가능한지 확인. 일반 사용자 접근 차단 확인.
    *   각 관리 화면 UI(테이블, 폼, 버튼 등)가 정상적으로 표시되고 동작하는지 확인.
    *   데이터 조회, 검색, 필터링, 페이지네이션 기능 확인.
    *   데이터 생성/수정/삭제 기능이 정상 작동하고 DB에 반영되는지 확인. 복잡한 데이터(JSONB) 편집 UI 확인.
    *   사용자 관리 액션(상태 변경 등) 확인.
    *   재화/아이템 지급 기능이 정상 작동하고 대상 사용자의 데이터 및 지급 로그가 생성되는지 확인.
    *   모든 관리 액션 전 확인 팝업이 뜨는지 확인.
    *   API 호출 시 권한 검증이 제대로 이루어지는지 확인 (어드민 아닌 사용자의 API 호출 차단).

---

### **백엔드 기능명세서 (Admin API)**

*   **API 경로:** `/api/admin/...`

1.  **API 정의**:
    *   **인증 및 권한 검증 (미들웨어 `middleware.ts` 또는 각 핸들러 시작 부분)**:
        *   요청 사용자가 인증되었는지, 그리고 'admin' 역할을 가졌는지 확인. Supabase `auth.getUser()` 및 사용자 메타데이터/별도 역할 테이블 활용. 권한 없으면 401/403 응답.
    *   **사용자 관리 API (`app/api/admin/users/...`)**:
        *   `GET /`: 사용자 목록 조회 (페이지네이션, 검색, 필터링 지원). `select` 시 민감 정보 제외.
        *   `GET /{userId}`: 특정 사용자 상세 정보 조회 (게임 진행 데이터 포함).
        *   `PATCH /{userId}`: 사용자 상태 변경, 닉네임 변경 등 제한적 수정 기능.
    *   **게임 데이터 관리 API (`app/api/admin/game-data/{dataType}/...`)**:
        *   `GET /`: 해당 타입 데이터 목록 조회 (페이지네이션, 검색, 필터링 지원).
        *   `POST /`: 새 데이터 생성. 요청 본문 유효성 검증 필수.
        *   `GET /{id}`: 특정 데이터 상세 조회.
        *   `PATCH /{id}`: 데이터 수정. 요청 본문 유효성 검증 필수.
        *   `DELETE /{id}`: 데이터 삭제. (주의: 연관 데이터 처리 방안 고려 - 예: 스테이지 삭제 시 관련 몬스터 배치 정보 처리)
    *   **재화/아이템 지급 API (`app/api/admin/giveaways/...`)**:
        *   `POST /currency`: 특정 사용자에게 재화 지급. 요청 본문에 `userId`, `currencyType`, `amount`, `reason` 포함. `update_user_resources` DB 함수 활용.
        *   `POST /items`: 특정 사용자에게 아이템 지급. 요청 본문에 `userId`, `itemId`, `quantity`, `options`(JSONB, nullable), `reason` 포함. `user_inventory` 테이블에 삽입.
    *   **운영 로그 기록**:
        *   모든 관리 API 핸들러는 실행 시 액션 내용(누가, 언제, 무엇을, 어떻게 변경/지급했는지, 사유)을 별도의 `admin_logs` 테이블에 기록하는 로직 포함.

2.  **데이터베이스 설계 및 연동**:
    *   **Supabase Auth 사용자 역할 관리**: 사용자 메타데이터(`raw_user_meta_data`)에 `role: 'admin'` 추가 또는 별도의 `user_roles` 테이블 설계 및 활용하여 어드민 구분.
    *   **RLS 정책 강화**:
        *   모든 테이블(특히 `user_*` 테이블)에 어드민 역할(커스텀 `is_admin()` 함수 활용)만 접근/수정 가능한 정책 추가. 일반 사용자와 권한 분리 명확화.
        *   **주의:** 어드민이라도 민감 데이터(예: 사용자 이메일 전체) 접근은 API 레벨에서 제한하는 것이 안전.
    *   **`admin_logs` 테이블 (신규 생성)**:
        *   `id` (bigserial, PK)
        *   `admin_user_id` (uuid, FK to auth.users.id)
        *   `action_type` (text, not null) - 예: 'UPDATE_USER_STATUS', 'CREATE_ITEM', 'GIVE_CURRENCY'
        *   `target_type` (text, nullable) - 예: 'user', 'item', 'stage'
        *   `target_id` (text, nullable) - 대상 ID (사용자 ID, 아이템 ID 등)
        *   `details` (jsonb, nullable) - 변경 전/후 데이터 또는 지급 내용 상세
        *   `reason` (text, nullable) - 관리자 입력 사유
        *   `created_at` (timestamptz, default `now()`)
    *   **연동 로직:** 각 API Route Handler 내에서 Supabase 서버 클라이언트(`createClient(cookies())` 활용) 사용하여 DB 작업 수행. 모든 DB 작업 전 권한 검증 필수. 로그 기록 로직 반드시 포함.

3.  **테스트 항목**:
    *   API 접근 시 어드민 역할 검증이 올바르게 작동하는지 확인 (미들웨어, 핸들러 레벨).
    *   각 관리 API가 CRUD 및 지급 기능을 정상적으로 수행하고 DB에 반영하는지 확인. 요청/응답 데이터 형식 검증.
    *   잘못된 파라미터, 권한 없는 요청 등에 대해 적절한 에러(4xx, 5xx)를 반환하는지 확인.
    *   모든 관리 액션이 `admin_logs` 테이블에 상세 정보와 함께 기록되는지 확인.
    *   RLS 정책이 의도대로 어드민 권한과 일반 사용자 권한을 분리하는지 확인.
    *   대량 데이터 조회/수정 시 성능 테스트 (인덱싱 확인).

4.  **보안 고려사항**:
    *   어드민 계정 관리 철저 (2단계 인증 권장).
    *   모든 어드민 액션은 로그 기록 및 감사 추적 가능해야 함.
    *   민감 사용자 정보 접근 및 수정 최소화.
    *   SQL Injection 등 일반적인 웹 보안 취약점 방지 (Supabase 클라이언트 사용 시 기본적으로 방어되나, 직접 SQL 작성 시 주의).
    *   어드민 시스템 자체의 접근 제어 강화 (IP 제한 등 고려).

---
