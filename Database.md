# LVUP 데이터베이스 설계

이 문서는 "딴짓하는 동안 레벨업" 프로젝트의 데이터베이스 스키마와 관련 함수들을 설명합니다.

## 스키마 구조

Supabase SQL 편집기에서 다음 SQL을 실행하여 필요한 테이블과 함수를 생성할 수 있습니다:

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

-- 캐릭터 시스템 관련 테이블 생성

-- 레벨별 요구 경험치 테이블
CREATE TABLE IF NOT EXISTS public.game_level_requirements (
  level INTEGER PRIMARY KEY,
  required_exp BIGINT NOT NULL,
  -- 레벨업 시 기본 스탯 증가량 (JSON 형태로 저장)
  stat_increase JSONB DEFAULT '{"strength": 1, "dexterity": 1, "intelligence": 1, "vitality": 1}'::JSONB
);

-- 직업 테이블
CREATE TABLE IF NOT EXISTS public.game_jobs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  tier INTEGER NOT NULL DEFAULT 1, -- 1: 기본, 2: 1차 전직, 3: 2차 전직, 4: 3차 전직
  parent_job_id INTEGER REFERENCES public.game_jobs(id), -- 상위 직업 참조
  required_level INTEGER NOT NULL DEFAULT 1, -- 전직 필요 레벨
  -- 직업별 레벨업 시 기본 스탯 증가량
  stats_per_level JSONB DEFAULT '{"strength": 1, "dexterity": 1, "intelligence": 1, "vitality": 1}'::JSONB,
  -- 직업별 초기 스탯
  base_stats JSONB DEFAULT '{"strength": 10, "dexterity": 10, "intelligence": 10, "vitality": 10, "hp": 100, "mp": 50}'::JSONB
);

-- 사용자 캐릭터 테이블
CREATE TABLE IF NOT EXISTS public.user_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id INTEGER NOT NULL REFERENCES public.game_jobs(id),
  level INTEGER NOT NULL DEFAULT 1,
  experience BIGINT NOT NULL DEFAULT 0,
  -- 기본 스탯
  strength INTEGER NOT NULL DEFAULT 10,
  dexterity INTEGER NOT NULL DEFAULT 10,
  intelligence INTEGER NOT NULL DEFAULT 10,
  vitality INTEGER NOT NULL DEFAULT 10,
  -- 계산된 스탯
  max_hp INTEGER NOT NULL DEFAULT 100,
  max_mp INTEGER NOT NULL DEFAULT 50,
  current_hp INTEGER NOT NULL DEFAULT 100,
  current_mp INTEGER NOT NULL DEFAULT 50,
  -- 전투 관련 스탯
  physical_attack INTEGER NOT NULL DEFAULT 10,
  magical_attack INTEGER NOT NULL DEFAULT 10,
  physical_defense INTEGER NOT NULL DEFAULT 5,
  magical_defense INTEGER NOT NULL DEFAULT 5,
  critical_rate REAL NOT NULL DEFAULT 0.05,
  critical_damage REAL NOT NULL DEFAULT 1.5,
  -- 기타
  skill_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id) -- 한 유저당 하나의 캐릭터만 가능
);

-- 트리거: 캐릭터 정보 업데이트 시 업데이트 시간 자동 갱신
CREATE OR REPLACE FUNCTION update_character_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_characters_timestamp
BEFORE UPDATE ON public.user_characters
FOR EACH ROW
EXECUTE FUNCTION update_character_timestamp();

-- 캐릭터 RLS 정책 설정
ALTER TABLE public.user_characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "사용자는 자신의 캐릭터만 조회 가능" 
  ON public.user_characters FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 캐릭터만 수정 가능" 
  ON public.user_characters FOR UPDATE
  USING (auth.uid() = user_id);

-- 스테이지 시스템 관련 테이블 생성

-- 게임 월드 테이블
CREATE TABLE IF NOT EXISTS game_worlds (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  sequence INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 게임 지역 테이블
CREATE TABLE IF NOT EXISTS game_regions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  world_id TEXT NOT NULL REFERENCES game_worlds(id),
  sequence INTEGER NOT NULL DEFAULT 0,
  unlock_condition_stage_id BIGINT, -- 스테이지 클리어 조건
  related_adventure_zone_id TEXT, -- 관련된 모험 지역 ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 게임 스테이지 테이블
CREATE TABLE IF NOT EXISTS game_stages (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  level_requirement INT NOT NULL DEFAULT 1,
  stage_order INT NOT NULL,
  region_id INTEGER NOT NULL,
  world_id INTEGER NOT NULL,
  is_boss_stage BOOLEAN NOT NULL DEFAULT FALSE,
  normal_monsters JSONB DEFAULT '[]'::jsonb,
  required_monster_count INTEGER DEFAULT 10,
  background_url TEXT,
  next_stage_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 사용자가 클리어한 스테이지 테이블
CREATE TABLE IF NOT EXISTS user_cleared_stages (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stage_id BIGINT NOT NULL REFERENCES game_stages(id),
  cleared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, stage_id)
);

-- 사용자가 해금한 모험 지역 테이블
CREATE TABLE IF NOT EXISTS user_unlocked_adventure_zones (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  adventure_zone_id TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, adventure_zone_id)
);

-- user_game_data 테이블
CREATE TABLE IF NOT EXISTS user_game_data (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  gold INTEGER NOT NULL DEFAULT 0,
  current_stage_id BIGINT REFERENCES game_stages(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 외래 키 관계 설정
ALTER TABLE game_regions
ADD CONSTRAINT fk_regions_stage_id
FOREIGN KEY (unlock_condition_stage_id) 
REFERENCES game_stages(id);

ALTER TABLE game_stages
ADD CONSTRAINT fk_stages_next_stage_id
FOREIGN KEY (next_stage_id) 
REFERENCES game_stages(id);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_game_stages_region_id ON game_stages(region_id);
CREATE INDEX IF NOT EXISTS idx_game_stages_world_id ON game_stages(world_id);
CREATE INDEX IF NOT EXISTS idx_game_regions_world_id ON game_regions(world_id);
CREATE INDEX IF NOT EXISTS idx_user_cleared_stages_user_id ON user_cleared_stages(user_id);
CREATE INDEX IF NOT EXISTS idx_user_unlocked_adventure_zones_user_id ON user_unlocked_adventure_zones(user_id);
CREATE INDEX IF NOT EXISTS idx_user_game_data_current_stage_id ON user_game_data(current_stage_id);
```

## 데이터베이스 함수

```sql
-- 사용자 자원(골드, 경험치) 업데이트 함수
-- 전투 보상, 퀘스트 보상 등에서 사용
CREATE OR REPLACE FUNCTION public.update_user_resources(
  p_user_id UUID,
  p_gold_delta INT,
  p_exp_delta INT
) RETURNS VOID AS $$
BEGIN
  -- 사용자 게임 데이터 업데이트
  UPDATE user_game_data
  SET 
    gold = gold + p_gold_delta,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- 게임 데이터가 없는 경우 새로 생성
  IF NOT FOUND THEN
    INSERT INTO user_game_data (user_id, gold)
    VALUES (p_user_id, p_gold_delta);
  END IF;
  
  -- 경험치가 있는 경우 캐릭터 경험치 업데이트
  IF p_exp_delta > 0 THEN
    UPDATE user_characters
    SET 
      experience = experience + p_exp_delta,
      updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 레벨업/경험치 처리 함수
CREATE OR REPLACE FUNCTION process_experience_gain(
  p_user_id UUID,
  p_exp_gain BIGINT
)
RETURNS JSONB AS $$
DECLARE
  v_char RECORD;
  v_job RECORD;
  v_req_exp BIGINT;
  v_new_exp BIGINT;
  v_level_up BOOLEAN := false;
  v_levels_gained INTEGER := 0;
  v_stat_increases JSONB := '{}'::JSONB;
  v_result JSONB;
BEGIN
  -- 현재 캐릭터 정보 조회
  SELECT * INTO v_char
  FROM public.user_characters
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION '캐릭터를 찾을 수 없습니다.';
  END IF;
  
  -- 현재 직업 정보 조회
  SELECT * INTO v_job
  FROM public.game_jobs
  WHERE id = v_char.job_id;
  
  -- 새로운 경험치 계산
  v_new_exp := v_char.experience + p_exp_gain;
  
  -- 레벨업 체크 루프
  LOOP
    -- 다음 레벨 필요 경험치 조회
    SELECT required_exp INTO v_req_exp
    FROM public.game_level_requirements
    WHERE level = v_char.level;
    
    IF NOT FOUND THEN
      -- 최대 레벨에 도달한 경우
      EXIT;
    END IF;
    
    -- 레벨업 가능 여부 확인
    IF v_new_exp >= v_req_exp THEN
      -- 경험치 차감
      v_new_exp := v_new_exp - v_req_exp;
      
      -- 레벨 증가
      v_char.level := v_char.level + 1;
      v_levels_gained := v_levels_gained + 1;
      v_level_up := true;
      
      -- 스탯 증가량 계산 (기본 + 직업별)
      -- 레벨업 시 기본 스탯 증가
      SELECT stat_increase INTO v_stat_increases
      FROM public.game_level_requirements
      WHERE level = v_char.level - 1;
      
      -- 직업별 증가량 추가
      v_char.strength := v_char.strength + (v_stat_increases->>'strength')::INTEGER + (v_job.stats_per_level->>'strength')::INTEGER;
      v_char.dexterity := v_char.dexterity + (v_stat_increases->>'dexterity')::INTEGER + (v_job.stats_per_level->>'dexterity')::INTEGER;
      v_char.intelligence := v_char.intelligence + (v_stat_increases->>'intelligence')::INTEGER + (v_job.stats_per_level->>'intelligence')::INTEGER;
      v_char.vitality := v_char.vitality + (v_stat_increases->>'vitality')::INTEGER + (v_job.stats_per_level->>'vitality')::INTEGER;
      
      -- 계산된 스탯 업데이트
      -- HP = 기본값(100) + 체력 * 10
      v_char.max_hp := 100 + v_char.vitality * 10;
      -- MP = 기본값(50) + 지능 * 5
      v_char.max_mp := 50 + v_char.intelligence * 5;
      
      -- 전투 스탯 업데이트
      v_char.physical_attack := 10 + v_char.strength * 2 + v_char.dexterity * 1;
      v_char.magical_attack := 10 + v_char.intelligence * 3;
      v_char.physical_defense := 5 + v_char.vitality * 1 + v_char.strength * 0.5;
      v_char.magical_defense := 5 + v_char.intelligence * 1 + v_char.vitality * 0.5;
      
      -- 스킬 포인트 증가
      v_char.skill_points := v_char.skill_points + 1;
      
      -- HP/MP 최대값으로 회복 (레벨업 보너스)
      v_char.current_hp := v_char.max_hp;
      v_char.current_mp := v_char.max_mp;
    ELSE
      -- 더 이상 레벨업이 불가능한 경우 루프 종료
      EXIT;
    END IF;
  END LOOP;
  
  -- DB 업데이트
  UPDATE public.user_characters
  SET 
    level = v_char.level,
    experience = v_new_exp,
    strength = v_char.strength,
    dexterity = v_char.dexterity,
    intelligence = v_char.intelligence,
    vitality = v_char.vitality,
    max_hp = v_char.max_hp,
    max_mp = v_char.max_mp,
    current_hp = v_char.current_hp,
    current_mp = v_char.current_mp,
    physical_attack = v_char.physical_attack,
    magical_attack = v_char.magical_attack,
    physical_defense = v_char.physical_defense,
    magical_defense = v_char.magical_defense,
    skill_points = v_char.skill_points
  WHERE user_id = p_user_id;
  
  -- 결과 반환 
  v_result := jsonb_build_object(
    'level_up', v_level_up,
    'levels_gained', v_levels_gained,
    'current_level', v_char.level,
    'current_exp', v_new_exp,
    'stats', jsonb_build_object(
      'strength', v_char.strength,
      'dexterity', v_char.dexterity,
      'intelligence', v_char.intelligence,
      'vitality', v_char.vitality,
      'max_hp', v_char.max_hp,
      'max_mp', v_char.max_mp,
      'physical_attack', v_char.physical_attack,
      'magical_attack', v_char.magical_attack,
      'physical_defense', v_char.physical_defense,
      'magical_defense', v_char.magical_defense
    ),
    'next_level_exp', v_req_exp,
    'skill_points', v_char.skill_points
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 캐릭터 생성 함수
CREATE OR REPLACE FUNCTION create_new_character(
  p_user_id UUID,
  p_job_id INTEGER
)
RETURNS UUID AS $$
DECLARE
  v_job RECORD;
  v_character_id UUID;
BEGIN
  -- 직업 정보 조회
  SELECT * INTO v_job FROM public.game_jobs WHERE id = p_job_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION '존재하지 않는 직업입니다.';
  END IF;
  
  -- 캐릭터 생성
  INSERT INTO public.user_characters (
    user_id, 
    job_id, 
    strength, 
    dexterity, 
    intelligence, 
    vitality,
    max_hp,
    max_mp,
    current_hp,
    current_mp,
    physical_attack,
    magical_attack,
    physical_defense,
    magical_defense
  ) VALUES (
    p_user_id,
    p_job_id,
    (v_job.base_stats->>'strength')::INTEGER,
    (v_job.base_stats->>'dexterity')::INTEGER,
    (v_job.base_stats->>'intelligence')::INTEGER,
    (v_job.base_stats->>'vitality')::INTEGER,
    (v_job.base_stats->>'hp')::INTEGER,
    (v_job.base_stats->>'mp')::INTEGER,
    (v_job.base_stats->>'hp')::INTEGER,
    (v_job.base_stats->>'mp')::INTEGER,
    10 + (v_job.base_stats->>'strength')::INTEGER * 2 + (v_job.base_stats->>'dexterity')::INTEGER * 1,
    10 + (v_job.base_stats->>'intelligence')::INTEGER * 3,
    5 + (v_job.base_stats->>'vitality')::INTEGER * 1 + (v_job.base_stats->>'strength')::INTEGER * 0.5,
    5 + (v_job.base_stats->>'intelligence')::INTEGER * 1 + (v_job.base_stats->>'vitality')::INTEGER * 0.5
  )
  RETURNING id INTO v_character_id;
  
  RETURN v_character_id;
END;
$$ LANGUAGE plpgsql;
```

## 스테이지 시스템 테이블 설명

### 게임 월드 (game_worlds)
- **id**: TEXT 타입의 월드 고유 식별자 (예: 'beginners', 'midlands')
- **name**: 월드 이름 (예: '초심자의 대륙')
- **description**: 월드 설명
- **sequence**: 월드 표시 순서

### 게임 지역 (game_regions)
- **id**: TEXT 타입의 지역 고유 식별자 (예: 'forest', 'cave')
- **name**: 지역 이름 (예: '고블린 숲', '박쥐 동굴')
- **world_id**: 소속된 월드의 ID (외래 키)
- **sequence**: 지역 표시 순서
- **unlock_condition_stage_id**: 이 지역을 해금하기 위해 클리어해야 하는 스테이지 ID
- **related_adventure_zone_id**: 이 지역과 연관된 모험 지역 ID

### 게임 스테이지 (game_stages)
- **id**: BIGINT 타입으로, IDENTITY 컬럼(GENERATED ALWAYS AS IDENTITY)
- **name**: 스테이지 이름 (예: '고블린 숲 입구')
- **description**: 스테이지 설명
- **level_requirement**: 스테이지 진입에 필요한 최소 레벨
- **stage_order**: 각 지역 내에서의 스테이지 순서
- **region_id**: 스테이지가 속한 지역 ID
- **world_id**: 스테이지가 속한 월드 ID
- **is_boss_stage**: 보스 스테이지 여부 (TRUE/FALSE)
- **normal_monsters**: JSONB 타입으로, 스테이지에 등장하는 일반 몬스터 목록
- **required_monster_count**: 다음 스테이지로 넘어가기 위해 처치해야 하는 몬스터 수
- **background_url**: 스테이지 배경 이미지 URL
- **next_stage_id**: 이 스테이지 클리어 후 다음 스테이지 ID

### 사용자 클리어 스테이지 (user_cleared_stages)
- **user_id**: 사용자 ID (외래 키)
- **stage_id**: 클리어한 스테이지 ID (외래 키)
- **cleared_at**: 클리어 시간

### 사용자 해금 모험 지역 (user_unlocked_adventure_zones)
- **user_id**: 사용자 ID (외래 키)
- **adventure_zone_id**: 해금된 모험 지역 ID
- **unlocked_at**: 해금 시간

### 사용자 게임 데이터 (user_game_data)
- **user_id**: 사용자 ID (외래 키)
- **gold**: 보유 골드량
- **current_stage_id**: 현재 진행 중인 스테이지 ID (외래 키)

## 인덱스 및 외래키 관계
- 스테이지 ID, 지역 ID, 월드 ID에 대한 인덱스 생성으로 검색 성능 최적화
- game_regions.unlock_condition_stage_id → game_stages.id
- game_stages.next_stage_id → game_stages.id
- user_game_data.current_stage_id → game_stages.id

## 데이터베이스 함수 설명

### 1. update_user_resources
사용자의 골드와 경험치를 업데이트하는 함수입니다.
- **매개변수**:
  - `p_user_id`: 사용자 ID
  - `p_gold_delta`: 추가/차감할 골드 양 (양수: 증가, 음수: 감소)
  - `p_exp_delta`: 추가/차감할 경험치 양 (양수: 증가, 음수: 감소)
- **동작**:
  - 사용자 게임 데이터의 골드 업데이트
  - 데이터가 없는 경우 새로운 데이터 생성
  - 경험치가 있는 경우 캐릭터 경험치 업데이트

### 2. process_experience_gain
경험치 획득과 레벨업 처리를 담당하는 함수입니다.
- **매개변수**:
  - `p_user_id`: 사용자 ID
  - `p_exp_gain`: 획득한 경험치
- **동작**:
  - 현재 캐릭터와 직업 정보 조회
  - 경험치 누적 계산
  - 레벨업 체크 및 여러 레벨 동시 상승 처리
  - 스탯 자동 증가 (기본 + 직업별)
  - 스킬 포인트 부여

### 3. create_new_character
새 캐릭터를 생성하는 함수입니다.
- **매개변수**:
  - `p_user_id`: 사용자 ID
  - `p_job_id`: 직업 ID
- **동작**:
  - 직업 정보 조회
  - 직업 기반 초기 스탯 설정
  - 사용자 ID 연결
  - 생성된 캐릭터 ID 반환