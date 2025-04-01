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
```

## 데이터베이스 함수

```sql
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

## 초기 데이터

```sql
-- 초기 레벨 요구 경험치 데이터 입력
INSERT INTO public.game_level_requirements (level, required_exp)
VALUES
  (1, 100),
  (2, 200),
  (3, 300),
  (4, 400),
  (5, 500),
  (6, 600),
  (7, 700),
  (8, 800),
  (9, 900),
  (10, 1000),
  (11, 1200),
  (12, 1400),
  (13, 1600),
  (14, 1800),
  (15, 2000),
  (16, 2300),
  (17, 2600),
  (18, 2900),
  (19, 3200),
  (20, 3500)
ON CONFLICT (level) DO NOTHING;

-- 초기 직업 데이터 입력
INSERT INTO public.game_jobs (name, description, tier, parent_job_id, required_level, stats_per_level, base_stats)
VALUES
  -- 기본 직업 (Tier 1)
  ('전사', '근접 물리 공격에 특화된 직업', 1, NULL, 1, 
   '{"strength": 3, "dexterity": 1, "intelligence": 0, "vitality": 2}'::JSONB,
   '{"strength": 12, "dexterity": 8, "intelligence": 5, "vitality": 15, "hp": 150, "mp": 30}'::JSONB),
   
  ('마법사', '원거리 마법 공격에 특화된 직업', 1, NULL, 1, 
   '{"strength": 0, "dexterity": 1, "intelligence": 3, "vitality": 1}'::JSONB,
   '{"strength": 5, "dexterity": 8, "intelligence": 15, "vitality": 7, "hp": 80, "mp": 100}'::JSONB),
   
  ('궁수', '원거리 물리 공격에 특화된 직업', 1, NULL, 1, 
   '{"strength": 1, "dexterity": 3, "intelligence": 1, "vitality": 1}'::JSONB,
   '{"strength": 8, "dexterity": 15, "intelligence": 8, "vitality": 9, "hp": 100, "mp": 50}'::JSONB),
   
  ('도적', '빠른 공격속도와 회피에 특화된 직업', 1, NULL, 1, 
   '{"strength": 1, "dexterity": 3, "intelligence": 1, "vitality": 1}'::JSONB,
   '{"strength": 10, "dexterity": 13, "intelligence": 7, "vitality": 10, "hp": 110, "mp": 40}'::JSONB)
ON CONFLICT (name) DO NOTHING;
```

## ERD(Entity-Relationship Diagram)

```
+----------------------+       +----------------------+       +----------------------+
|  game_jobs           |       |  user_characters     |       |  game_level_req.     |
+----------------------+       +----------------------+       +----------------------+
| id (PK)              |       | id (PK)              |       | level (PK)           |
| name                 |       | user_id (FK)         |       | required_exp         |
| description          |       | job_id (FK)          |       | stat_increase        |
| tier                 |       | level                |       +----------------------+
| parent_job_id (FK)   |<---+  | experience           |       
| required_level       |    |  | strength             |       
| stats_per_level      |    |  | dexterity            |       
| base_stats           |    |  | intelligence         |       
+----------------------+    |  | vitality             |       
       ^                    |  | max_hp               |       
       |                    |  | max_mp               |       
       +--------------------+  | current_hp           |       
                              | current_mp            |       
                              | physical_attack       |       
                              | magical_attack        |       
                              | physical_defense      |       
                              | magical_defense       |       
                              | critical_rate         |       
                              | critical_damage       |       
                              | skill_points          |       
                              | created_at            |       
                              | updated_at            |       
                              +----------------------+       
```

## 전투 시스템 테이블

자동 전투 시스템에 필요한 테이블과 함수들입니다. Supabase SQL 편집기에서 다음 SQL을 실행하여 필요한 테이블과 기본 데이터를 생성할 수 있습니다:

```sql
-- 게임 스테이지 테이블
CREATE TABLE IF NOT EXISTS game_stages (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  level_requirement INT NOT NULL DEFAULT 1,
  stage_order INT NOT NULL,
  world_id INT NOT NULL,
  region_id INT NOT NULL,
  is_boss_stage BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 게임 몬스터 테이블
CREATE TABLE IF NOT EXISTS game_monsters (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  level INT NOT NULL DEFAULT 1,
  max_hp INT NOT NULL,
  attack INT NOT NULL,
  defense INT NOT NULL,
  exp INT NOT NULL,
  gold INT NOT NULL,
  stage_id BIGINT NOT NULL REFERENCES game_stages(id),
  is_boss BOOLEAN NOT NULL DEFAULT FALSE,
  drop_table_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 기본 스테이지 데이터 삽입
INSERT INTO game_stages (name, description, level_requirement, stage_order, world_id, region_id, is_boss_stage) VALUES
('초보자 마을', '모험가들이 처음 시작하는 마을입니다.', 1, 1, 1, 1, false),
('숲의 입구', '작은 슬라임들이 서식하는 곳입니다.', 1, 2, 1, 1, false),
('깊은 숲', '조금 더 강한 몬스터들이 있는 곳입니다.', 3, 3, 1, 1, false),
('숲의 심장부', '숲의 보스 몬스터가 있는 곳입니다.', 5, 4, 1, 1, true);

-- 기본 몬스터 데이터 삽입
INSERT INTO game_monsters (name, description, level, max_hp, attack, defense, exp, gold, stage_id, is_boss) VALUES
('초록 슬라임', '가장 기본적인 몬스터입니다.', 1, 50, 5, 2, 10, 5, 1, false),
('빨간 슬라임', '조금 더 강한 슬라임입니다.', 2, 80, 8, 3, 15, 8, 2, false),
('파란 슬라임', '마법 속성을 가진 슬라임입니다.', 3, 120, 12, 5, 20, 12, 3, false),
('슬라임 킹', '모든 슬라임을 다스리는 왕입니다.', 5, 500, 25, 15, 100, 50, 4, true);

-- 경험치 획득 함수 수정 (몬스터 처치 시 호출)
CREATE OR REPLACE FUNCTION gain_experience(
  p_character_id UUID,
  p_exp_amount INT,
  p_gold_amount INT
) RETURNS VOID AS $$
DECLARE
  v_current_level INT;
  v_current_exp INT;
  v_required_exp INT;
  v_new_level INT;
  v_skill_points INT;
BEGIN
  -- 현재 캐릭터 정보 조회
  SELECT level, experience INTO v_current_level, v_current_exp
  FROM user_characters
  WHERE id = p_character_id;

  -- 경험치 추가
  UPDATE user_characters
  SET experience = experience + p_exp_amount,
      gold = gold + p_gold_amount
  WHERE id = p_character_id;

  -- 레벨업 체크 및 처리
  LOOP
    -- 다음 레벨 필요 경험치 조회
    SELECT required_exp INTO v_required_exp
    FROM game_level_requirements
    WHERE level = v_current_level;

    EXIT WHEN (v_current_exp + p_exp_amount) < v_required_exp;

    -- 레벨업
    v_current_level := v_current_level + 1;
    v_skill_points := 1; -- 레벨업 시 스킬 포인트 1 지급

    UPDATE user_characters
    SET level = v_current_level,
        skill_points = skill_points + v_skill_points,
        physical_attack = physical_attack + 2,
        magical_attack = magical_attack + 2,
        physical_defense = physical_defense + 1,
        magical_defense = magical_defense + 1,
        max_hp = max_hp + 10
    WHERE id = p_character_id;

    -- 남은 경험치 계산
    v_current_exp := (v_current_exp + p_exp_amount) - v_required_exp;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

## 테이블 설명

### 1. game_level_requirements
레벨별 요구 경험치와 스탯 증가량을 정의합니다.

### 2. game_jobs
게임의 직업 정보를 저장합니다. 기본 직업(Tier 1)부터 전직 직업(Tier 2, 3, 4)까지 정의 가능합니다.

### 3. user_characters
사용자의 캐릭터 정보를 저장합니다. 각 사용자는 하나의 캐릭터만 가질 수 있습니다.

## 데이터베이스 함수 설명

### 1. process_experience_gain
경험치 획득과 레벨업 처리를 담당하는 함수입니다. 다음 기능을 수행합니다:
- 현재 캐릭터와 직업 정보 조회
- 경험치 누적 계산
- 레벨업 체크 및 여러 레벨 동시 상승 처리
- 스탯 자동 증가 (기본 + 직업별)
- 스킬 포인트 부여
- 결과 반환 (레벨업 여부, 현재 스탯 등)

### 2. create_new_character
새 캐릭터를 생성하는 함수입니다. 다음 기능을 수행합니다:
- 직업 정보 조회
- 직업 기반 초기 스탯 설정
- 사용자 ID 연결
- 생성된 캐릭터 ID 반환

### 전투 시스템 테이블 설명

#### 1. game_stages
게임 내 스테이지 정보를 저장합니다. 각 스테이지는 월드와 지역에 소속되며, 레벨 요구사항과 보스 스테이지 여부를 정의합니다.

- `id`: 스테이지 식별자
- `name`: 스테이지 이름
- `description`: 스테이지 설명
- `level_requirement`: 입장에 필요한 최소 레벨
- `stage_order`: 스테이지 순서
- `world_id`: 소속 월드 ID
- `region_id`: 소속 지역 ID
- `is_boss_stage`: 보스 스테이지 여부

#### 2. game_monsters
게임 내 몬스터 정보를 저장합니다. 각 몬스터는 특정 스테이지에 소속되며, 레벨, HP, 공격력, 방어력, 경험치, 골드 등의 기본 속성을 갖습니다.

- `id`: 몬스터 식별자
- `name`: 몬스터 이름
- `description`: 몬스터 설명
- `level`: 몬스터 레벨
- `max_hp`: 최대 체력
- `attack`: 공격력
- `defense`: 방어력
- `exp`: 처치 시 획득 경험치
- `gold`: 처치 시 획득 골드
- `stage_id`: 소속 스테이지 ID
- `is_boss`: 보스 몬스터 여부
- `drop_table_id`: 아이템 드랍 테이블 참조 (향후 확장)

### 전투 시스템 함수 설명

#### 1. gain_experience
몬스터 처치 후 캐릭터의 경험치와 골드를 증가시키는 함수입니다. 다음 기능을 수행합니다:

- 캐릭터의 현재 레벨과 경험치 조회
- 경험치와 골드 증가 처리
- 레벨업 조건 충족 시 레벨 증가 및 스탯 상승
- 스킬 포인트 부여
- 여러 레벨 동시 상승 처리 (루프 사용)