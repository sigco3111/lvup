# LVUP - 딴짓하는 동안 레벨업

온라인 방치형 RPG 게임. 플레이어의 적극적인 조작 개입을 최소화하면서도 RPG의 핵심 재미인 캐릭터 육성의 깊이를 제공합니다.

## 기술 스택

- **프레임워크:** Next.js (App Router)
- **UI 라이브러리:** ShadCN
- **스타일링:** TailwindCSS
- **백엔드 (BaaS):** Supabase
  - **인증:** Supabase Auth (Google OAuth)
  - **데이터베이스:** Supabase Postgres
  - **데이터 접근:** `supabase-js` 클라이언트 라이브러리
- **배포:** Vercel

## 개발 환경 설정

### 사전 요구사항

- Node.js 18 이상
- npm 또는 yarn
- Supabase 계정
- Google 개발자 계정 (OAuth 설정용)

### 로컬 설치

1. 저장소 클론
   ```bash
   git clone https://github.com/your-username/lvup.git
   cd lvup
   ```

2. 의존성 설치
   ```bash
   npm install
   ```

3. 환경 변수 설정 (`.env.local` 파일 생성)
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. 개발 서버 실행
   ```bash
   npm run dev
   ```

## Supabase 설정

### 프로젝트 생성

1. [Supabase](https://supabase.com)에 가입하고 새 프로젝트 생성
2. 프로젝트 설정에서 API URL과 Anon Key, Service Role Key 확인 (`.env.local`에 추가)

### 데이터베이스 스키마 설정

Supabase SQL 편집기에서 다음 SQL 실행:

```sql
-- 프로필 테이블 생성
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS 정책 설정
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);
```

### 구글 OAuth 설정

1. [Google Cloud Console](https://console.cloud.google.com)에서 새 프로젝트 생성
2. APIs & Services > Credentials > Create Credentials > OAuth client ID 선택
3. 애플리케이션 유형으로 "Web application" 선택
4. 이름 입력 및 다음 리디렉션 URI 추가:
   - `https://your-project-ref.supabase.co/auth/v1/callback`
   - 개발용: `http://localhost:3000/api/auth/callback`
5. 생성된 클라이언트 ID와 비밀번호 저장
6. Supabase Authentication 설정에서 Google provider 추가:
   - 클라이언트 ID와 비밀번호 입력
   - 리디렉션 URL: `https://your-project-ref.supabase.co/auth/v1/callback`

## 배포

### Vercel 배포

1. GitHub 저장소 연결
2. 환경 변수 설정 (Supabase URL, 키 등)
3. 배포 실행

## 개발 관련 문서

- [Next.js 문서](https://nextjs.org/docs)
- [Supabase 문서](https://supabase.io/docs)
- [TailwindCSS 문서](https://tailwindcss.com/docs)
- [ShadcnUI 문서](https://ui.shadcn.com) 