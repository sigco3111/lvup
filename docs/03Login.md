## **기능명세서: 3. 회원가입/로그인 (구글)**

**개발 우선순위:** Phase 1 (기초 인프라 및 핵심 데이터 설정)

### **프론트엔드 기능명세서**

*(프론트엔드 명세서는 Supabase 클라이언트 직접 사용 방식이므로 변경 사항 없습니다.)*

1.  **화면 레이아웃 및 디자인 명세**:
    *   **로그인 페이지 (`app/login/page.tsx` 또는 `app/page.tsx` 조건부 렌더링)**:
        *   게임 로고/타이틀, "Google 계정으로 로그인" 버튼 표시.
        *   **ShadCN 컴포넌트 활용:** `Button`.
        *   **파일 위치:** `app/login/page.tsx` 또는 `app/page.tsx`, `components/auth/LoginButton.tsx`.

2.  **사용자 흐름 및 상호작용**:
    *   "Google 계정으로 로그인" 버튼 클릭 > Google OAuth 인증 플로우 시작 (Supabase 클라이언트 사용).
    *   로그인 성공 > 메인 게임 화면 (`app/dashboard/page.tsx`) 리디렉션.
    *   최초 로그인 시 백엔드에서 프로필 생성 확인.
    *   로그인 실패/오류 시 메시지 표시 (ShadCN `Toast` 또는 `Alert`).
    *   로그인 상태에서 로그인 페이지 접근 시 메인 화면 리디렉션.

3.  **API 연동**:
    *   **직접 Supabase 연동:** 프론트엔드에서 Supabase 클라이언트 라이브러리 (`supabase-js`)를 사용하여 Google OAuth 로그인 처리 (`signInWithOAuth`).
    *   **로그인 상태 확인:** Supabase 클라이언트로 현재 사용자 세션 정보 확인.

4.  **테스트 항목**:
    *   로그인 페이지 표시 확인.
    *   Google 로그인 버튼 동작 확인.
    *   OAuth 인증 플로우 확인.
    *   로그인 성공 시 리디렉션 확인.
    *   로그인 실패 시 에러 메시지 확인.
    *   로그인 상태 유지 및 리디렉션 확인.
    *   로그아웃 후 로그인 페이지 이동 확인 (로그아웃 기능 구현 시).

---

### **백엔드 기능명세서**

1.  **API 정의**:
    *   **Supabase Auth 활용**: 핵심 인증 로직은 Supabase 제공 기능 사용. 별도 API 엔드포인트 불필요.
    *   **OAuth 콜백 처리 (`app/api/auth/callback/route.ts`)**:
        *   Google 로그인 후 리디렉션될 엔드포인트.
        *   Supabase 서버 클라이언트 (`@supabase/ssr` 또는 `@supabase/supabase-js` 서버용 인스턴스) 사용하여 인증 코드 세션 교환.
        *   **HTTP 메서드:** GET
        *   **처리 로직:**
            1.  요청에서 인증 코드(code) 추출.
            2.  Supabase 서버 클라이언트로 `exchangeCodeForSession` 호출 (또는 유사 메서드).
            3.  성공 시, 사용자 세션 쿠키 설정 및 메인 게임 화면 리디렉션 응답 반환.
            4.  실패 시, 에러 페이지 또는 로그인 페이지 리디렉션.
        *   **파일 위치:** `app/api/auth/callback/route.ts`
    *   **최초 로그인 시 프로필 생성 (Server Action 또는 Trigger 활용)**:
        *   **Server Action 사용 시:** 로그인 콜백 후 클라이언트에서 호출.
            *   **Action 파일 위치:** `actions/user.ts` (예시)
            *   **함수 명세:** `ensureUserProfile(userId: string, userData: any)`
                *   Supabase 클라이언트를 사용하여 `profiles` 테이블에서 `userId` 조회. (`supabase.from('profiles').select('id').eq('id', userId).maybeSingle()`)
                *   조회 결과가 없으면 `userData` 기반으로 `profiles` 테이블에 삽입. (`supabase.from('profiles').insert({ id: userId, ... })`)
        *   **Supabase Trigger 사용 시:** `auth.users` 테이블 INSERT 이벤트 발생 시, SQL 함수를 통해 `profiles` 테이블에 레코드 자동 생성. (백엔드 코드 불필요, Supabase 대시보드 SQL 편집기 또는 마이그레이션 파일로 설정) - **권장 방식**

2.  **데이터베이스 설계 및 연동**:
    *   **`auth.users` 테이블 (Supabase 자동 관리)**: 사용자 인증 정보.
    *   **`profiles` 테이블 (Supabase 대시보드에서 직접 생성/관리)**:
        *   **목적:** 게임 내 사용자 추가 정보 저장. `auth.users`와 1:1 관계.
        *   **SQL 스키마 예시 (Supabase SQL Editor 사용):**
            ```sql
            CREATE TABLE public.profiles (
              id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, -- auth.users.id 참조 및 자동 삭제
              nickname TEXT,
              created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
              updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
              -- 필요에 따라 게임 관련 필드 추가
            );
            -- Row Level Security (RLS) 설정 필수
            ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
            CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
            CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
            CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);
            ```
        *   **연동 로직:**
            *   Supabase Trigger 방식: `auth.users` 삽입 시 자동으로 `profiles` 레코드 생성 (SQL 함수 트리거 설정).
            *   Server Action 방식: Action 내에서 Supabase 클라이언트 (`supabase-js`)를 사용하여 `profiles` 테이블 조회 및 삽입. Supabase 클라이언트 초기화 필요 (`utils/supabase/server.ts` 등 활용).

3.  **테스트 항목**:
    *   Google 로그인 시 Supabase `auth.users` 테이블 레코드 생성 확인.
    *   최초 로그인 시 `profiles` 테이블 레코드 자동/수동 생성 확인 및 `id` 일치 확인.
    *   OAuth 콜백 API (`/api/auth/callback`) 세션 교환 및 쿠키 설정 확인.
    *   콜백 후 메인 게임 화면 리디렉션 확인.
    *   인증 실패/오류 시 콜백 API 오류 처리 및 리디렉션 확인.

---
