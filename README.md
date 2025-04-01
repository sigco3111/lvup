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

데이터베이스 테이블, 함수 및 초기 데이터 등의 자세한 SQL 스키마는 [Database.md](Database.md) 문서를 참조하세요.

이 문서에는 다음 정보가 포함되어 있습니다:
- 프로필 및 캐릭터 관련 테이블 스키마
- 경험치 처리 및 레벨업 함수
- 캐릭터 생성 함수
- 초기 데이터 (레벨별 요구 경험치, 기본 직업)
- Row Level Security 정책

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

## 캐릭터 시스템 구현

캐릭터 시스템은 게임의 핵심 기능으로, 다음 주요 기능들을 제공합니다:

### 주요 기능

1. **캐릭터 생성 및 관리**
   - 4가지 기본 직업(전사, 마법사, 궁수, 도적) 선택 가능
   - 직업별 특화된 기본 스탯 할당

2. **레벨 및 경험치 시스템**
   - 자동 전투를 통한 경험치 획득
   - 레벨업 시 자동 스탯 증가 및 스킬 포인트 획득
   - 레벨업 효과 및 알림

3. **스탯 시스템**
   - 기본 스탯: 힘, 민첩, 지능, 체력
   - 계산된 스탯: HP, MP, 물리/마법 공격력, 물리/마법 방어력, 치명타 확률 등
   - 직업별 스탯 성장 패턴

### 구현 컴포넌트

- **페이지**: `/character` (캐릭터 정보), `/dashboard` (게임 메인 화면)
- **컴포넌트**: 
  - `LevelExpPanel`: 레벨 및 경험치 표시
  - `BaseStatsPanel`: 스탯 표시
  - `LevelUpEffect`: 레벨업 효과
  - `GameStatusHeader`: 게임 상태 헤더
  - `CreateCharacterForm`: 캐릭터 생성 폼
  - `GainExperienceButton`: 경험치 획득 버튼

### 데이터베이스 구조

- `game_level_requirements`: 레벨별 요구 경험치 정보
- `game_jobs`: 직업 정보 및 스탯 성장 패턴
- `user_characters`: 사용자 캐릭터 정보

### 서버 함수

- `process_experience_gain`: 경험치 획득 및 레벨업 처리
- `create_new_character`: 새 캐릭터 생성

### API

- `POST /api/character/gain-exp`: 경험치 획득 API
- 캐릭터 관련 서버 액션 (경험치 획득, 캐릭터 생성)
