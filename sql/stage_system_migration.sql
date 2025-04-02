-- 스테이지 시스템 데이터베이스 마이그레이션 스크립트
-- 
-- 게임 월드, 지역, 스테이지 및 사용자 진행 상황 테이블을 생성합니다.

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
  unlock_condition_stage_id BIGINT, -- self-reference will be set after game_stages creation
  related_adventure_zone_id TEXT, -- 관련된 모험 지역 ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 게임 스테이지 테이블 정의 이전에 이미 존재하는지 확인
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'game_stages') THEN
        -- 테이블이 이미 존재하면 필요한 컬럼들 확인
        RAISE NOTICE 'game_stages 테이블이 이미 존재합니다. 필드 타입을 확인합니다.';
    ELSE
        -- 테이블이 없으면 새로 생성
        RAISE NOTICE 'game_stages 테이블을 새로 생성합니다.';
    END IF;
END $$;

-- 게임 스테이지 테이블 
-- region_id와 world_id의 타입이 기존 테이블과 다를 수 있으므로 주의
CREATE TABLE IF NOT EXISTS game_stages (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  region_id INTEGER NOT NULL, -- 숫자 ID로 변경 
  world_id INTEGER NOT NULL, -- 숫자 ID로 변경
  level_requirement INTEGER NOT NULL DEFAULT 1, -- 추가된 필드: 레벨 요구사항
  stage_order INTEGER NOT NULL, -- 추가된 필드: 스테이지 순서
  is_boss_stage BOOLEAN NOT NULL DEFAULT FALSE,
  boss_monster_id TEXT, -- 보스 몬스터 ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 필수 컬럼들 추가 (이미 있으면 무시)
-- sequence 컬럼 추가
ALTER TABLE game_stages ADD COLUMN IF NOT EXISTS sequence INTEGER DEFAULT 0;

-- normal_monsters 컬럼 추가
ALTER TABLE game_stages ADD COLUMN IF NOT EXISTS normal_monsters JSONB DEFAULT '[]'::jsonb;

-- required_monster_count 컬럼 추가
ALTER TABLE game_stages ADD COLUMN IF NOT EXISTS required_monster_count INTEGER DEFAULT 10;

-- background_url 컬럼 추가
ALTER TABLE game_stages ADD COLUMN IF NOT EXISTS background_url TEXT;

-- required_power 컬럼 추가
ALTER TABLE game_stages ADD COLUMN IF NOT EXISTS required_power INTEGER;

-- next_stage_id 컬럼 추가
ALTER TABLE game_stages ADD COLUMN IF NOT EXISTS next_stage_id BIGINT;

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

-- user_game_data 테이블에 current_stage_id 필드 추가 (이미 있는 경우 주석 처리)
ALTER TABLE user_game_data
ADD COLUMN IF NOT EXISTS current_stage_id BIGINT REFERENCES game_stages(id);

-- 기본 데이터 삽입
-- 월드 데이터
INSERT INTO game_worlds (id, name, description, sequence)
VALUES 
  ('beginners', '초심자의 대륙', '모험가들이 처음 시작하는 대륙입니다.', 1),
  ('midlands', '중간 대륙', '중급 모험가들이 도전하는 대륙입니다.', 2)
ON CONFLICT (id) DO NOTHING;

-- 지역 데이터
INSERT INTO game_regions (id, name, description, world_id, sequence)
VALUES 
  ('forest', '고블린 숲', '고블린들이 서식하는 울창한 숲입니다.', 'beginners', 1),
  ('cave', '박쥐 동굴', '박쥐와 거미들이 서식하는 어두운 동굴입니다.', 'beginners', 2),
  ('plains', '늑대 평원', '늑대 무리가 지배하는 넓은 평원입니다.', 'beginners', 3)
ON CONFLICT (id) DO NOTHING;

-- 이전 함수 삭제 (혹시 있다면)
DROP FUNCTION IF EXISTS insert_stage_data();
DROP FUNCTION IF EXISTS insert_stage_data_v2();

-- 지역 ID 매핑 (텍스트 -> 숫자)
-- forest = 1, cave = 2, plains = 3
-- beginners = 1, midlands = 2

-- ID가 IDENTITY 컬럼(GENERATED ALWAYS)인 경우 처리 방식 1:
-- OVERRIDING SYSTEM VALUE를 사용하여 ID 직접 지정

-- 고블린 숲 스테이지 데이터 (1-3)
INSERT INTO game_stages 
  (id, name, description, region_id, world_id, level_requirement, stage_order, is_boss_stage)
OVERRIDING SYSTEM VALUE
VALUES 
  (1::BIGINT, '고블린 숲 입구'::TEXT, '고블린 숲의 입구 지역입니다.'::TEXT, 1, 1, 1, 1, FALSE),
  (2::BIGINT, '고블린 숲 깊은 곳'::TEXT, '고블린 숲의 깊은 곳입니다.'::TEXT, 1, 1, 2, 2, FALSE),
  (3::BIGINT, '고블린 족장의 영역'::TEXT, '고블린 족장이 있는 지역입니다.'::TEXT, 1, 1, 3, 3, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 박쥐 동굴 스테이지 데이터 (4-6)
INSERT INTO game_stages 
  (id, name, description, region_id, world_id, level_requirement, stage_order, is_boss_stage)
OVERRIDING SYSTEM VALUE
VALUES 
  (4::BIGINT, '동굴 입구'::TEXT, '박쥐 동굴의 입구 지역입니다.'::TEXT, 2, 1, 4, 1, FALSE),
  (5::BIGINT, '동굴 중심부'::TEXT, '박쥐 동굴의 중심부입니다.'::TEXT, 2, 1, 5, 2, FALSE),
  (6::BIGINT, '거대 거미의 둥지'::TEXT, '거대 거미가 있는 지역입니다.'::TEXT, 2, 1, 6, 3, TRUE)
ON CONFLICT (id) DO NOTHING;

-- INSERT 실패하면 대체 방식으로 진행 - ID 컬럼 제외
DO $$
BEGIN
  -- 기존 데이터가 있는지 확인
  IF NOT EXISTS (SELECT 1 FROM game_stages WHERE id = 1) THEN
    -- 방식 2: ID 컬럼 제외하고 삽입 (자동 생성된 ID 사용)
    INSERT INTO game_stages 
      (name, description, region_id, world_id, level_requirement, stage_order, is_boss_stage, sequence)
    VALUES 
      ('고블린 숲 입구', '고블린 숲의 입구 지역입니다.', 1, 1, 1, 1, FALSE, 1),
      ('고블린 숲 깊은 곳', '고블린 숲의 깊은 곳입니다.', 1, 1, 2, 2, FALSE, 2),
      ('고블린 족장의 영역', '고블린 족장이 있는 지역입니다.', 1, 1, 3, 3, TRUE, 3),
      ('동굴 입구', '박쥐 동굴의 입구 지역입니다.', 2, 1, 4, 1, FALSE, 1),
      ('동굴 중심부', '박쥐 동굴의 중심부입니다.', 2, 1, 5, 2, FALSE, 2),
      ('거대 거미의 둥지', '거대 거미가 있는 지역입니다.', 2, 1, 6, 3, TRUE, 3);
    
    -- 이 경우 id가 자동 생성되므로, 나중에 생성된 id 값 확인 필요
    RAISE NOTICE '자동 ID 생성 방식으로 스테이지 데이터가 삽입되었습니다.';
  END IF;
END $$;

-- sequence 추가 (이미 추가된 경우 아래 업데이트는 무시)
UPDATE game_stages SET sequence = 1 WHERE id = 1 AND sequence = 0;
UPDATE game_stages SET sequence = 2 WHERE id = 2 AND sequence = 0;
UPDATE game_stages SET sequence = 3 WHERE id = 3 AND sequence = 0;
UPDATE game_stages SET sequence = 1 WHERE id = 4 AND sequence = 0;
UPDATE game_stages SET sequence = 2 WHERE id = 5 AND sequence = 0;
UPDATE game_stages SET sequence = 3 WHERE id = 6 AND sequence = 0;

-- 스테이지 1 추가 데이터 업데이트
UPDATE game_stages SET 
  normal_monsters = '["goblin_scout"]'::jsonb,
  required_monster_count = 5,
  background_url = '/backgrounds/forest_entrance.jpg'
WHERE name = '고블린 숲 입구';

-- 스테이지 2 추가 데이터 업데이트
UPDATE game_stages SET 
  normal_monsters = '["goblin_scout", "goblin_warrior"]'::jsonb,
  required_monster_count = 8,
  background_url = '/backgrounds/forest_deep.jpg'
WHERE name = '고블린 숲 깊은 곳';

-- 스테이지 3 추가 데이터 업데이트
UPDATE game_stages SET 
  normal_monsters = '["goblin_warrior"]'::jsonb,
  required_monster_count = 10,
  background_url = '/backgrounds/forest_chief.jpg'
WHERE name = '고블린 족장의 영역';

-- 스테이지 4 추가 데이터 업데이트
UPDATE game_stages SET 
  normal_monsters = '["bat"]'::jsonb,
  required_monster_count = 8,
  background_url = '/backgrounds/cave_entrance.jpg'
WHERE name = '동굴 입구';

-- 스테이지 5 추가 데이터 업데이트
UPDATE game_stages SET 
  normal_monsters = '["bat", "spider"]'::jsonb,
  required_monster_count = 10,
  background_url = '/backgrounds/cave_center.jpg'
WHERE name = '동굴 중심부';

-- 스테이지 6 추가 데이터 업데이트
UPDATE game_stages SET 
  normal_monsters = '["spider"]'::jsonb,
  required_monster_count = 12,
  background_url = '/backgrounds/cave_spider.jpg'
WHERE name = '거대 거미의 둥지';

-- 스테이지 ID 조회를 위한 임시 테이블 생성 (next_stage_id 매핑용)
CREATE TEMPORARY TABLE IF NOT EXISTS temp_stage_mapping (
  name TEXT PRIMARY KEY,
  id BIGINT NOT NULL
);

-- 스테이지 이름과 ID 매핑
INSERT INTO temp_stage_mapping (name, id)
SELECT name, id FROM game_stages
ON CONFLICT (name) DO UPDATE SET id = EXCLUDED.id;

-- next_stage_id 업데이트 (ID 기반으로 처리하는 경우)
DO $$
DECLARE
  id1 BIGINT;
  id2 BIGINT;
  id3 BIGINT;
  id4 BIGINT;
  id5 BIGINT;
  id6 BIGINT;
BEGIN
  -- 각 스테이지의 ID 조회
  SELECT id INTO id1 FROM game_stages WHERE name = '고블린 숲 입구'; 
  SELECT id INTO id2 FROM game_stages WHERE name = '고블린 숲 깊은 곳';
  SELECT id INTO id3 FROM game_stages WHERE name = '고블린 족장의 영역';
  SELECT id INTO id4 FROM game_stages WHERE name = '동굴 입구';
  SELECT id INTO id5 FROM game_stages WHERE name = '동굴 중심부';
  SELECT id INTO id6 FROM game_stages WHERE name = '거대 거미의 둥지';

  -- 다음 스테이지 설정
  IF id1 IS NOT NULL AND id2 IS NOT NULL THEN
    UPDATE game_stages SET next_stage_id = id2 WHERE id = id1;
  END IF;
  
  IF id2 IS NOT NULL AND id3 IS NOT NULL THEN
    UPDATE game_stages SET next_stage_id = id3 WHERE id = id2;
  END IF;
  
  IF id3 IS NOT NULL AND id4 IS NOT NULL THEN
    UPDATE game_stages SET next_stage_id = id4 WHERE id = id3;
  END IF;
  
  IF id4 IS NOT NULL AND id5 IS NOT NULL THEN
    UPDATE game_stages SET next_stage_id = id5 WHERE id = id4;
  END IF;
  
  IF id5 IS NOT NULL AND id6 IS NOT NULL THEN
    UPDATE game_stages SET next_stage_id = id6 WHERE id = id5;
  END IF;
END $$;

-- 임시 테이블 삭제
DROP TABLE IF EXISTS temp_stage_mapping;

-- game_regions 테이블의 unlock_condition_stage_id 외래 키 추가
-- 이 시점에서는 game_stages 테이블에 필요한 모든 데이터가 삽입됨
ALTER TABLE game_regions
DROP CONSTRAINT IF EXISTS fk_regions_stage_id;

ALTER TABLE game_regions
ADD CONSTRAINT fk_regions_stage_id
FOREIGN KEY (unlock_condition_stage_id) 
REFERENCES game_stages(id);

-- game_stages 테이블의 next_stage_id 외래 키 추가
ALTER TABLE game_stages
DROP CONSTRAINT IF EXISTS fk_stages_next_stage_id;

ALTER TABLE game_stages
ADD CONSTRAINT fk_stages_next_stage_id
FOREIGN KEY (next_stage_id) 
REFERENCES game_stages(id);

-- 지역 해금 조건 업데이트 (외래 키 제약조건 추가 후 실행)
DO $$
DECLARE
  cave_unlock_id BIGINT;
  plains_unlock_id BIGINT;
BEGIN
  -- 스테이지 ID 조회
  SELECT id INTO cave_unlock_id FROM game_stages WHERE name = '고블린 족장의 영역';
  SELECT id INTO plains_unlock_id FROM game_stages WHERE name = '거대 거미의 둥지';
  
  -- 해금 조건 업데이트
  IF cave_unlock_id IS NOT NULL THEN
    UPDATE game_regions SET unlock_condition_stage_id = cave_unlock_id WHERE id = 'cave';
  END IF;
  
  IF plains_unlock_id IS NOT NULL THEN
    UPDATE game_regions SET unlock_condition_stage_id = plains_unlock_id WHERE id = 'plains';
  END IF;
END $$;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_game_stages_region_id ON game_stages(region_id);
CREATE INDEX IF NOT EXISTS idx_game_stages_world_id ON game_stages(world_id);
CREATE INDEX IF NOT EXISTS idx_game_regions_world_id ON game_regions(world_id);
CREATE INDEX IF NOT EXISTS idx_user_cleared_stages_user_id ON user_cleared_stages(user_id);
CREATE INDEX IF NOT EXISTS idx_user_unlocked_adventure_zones_user_id ON user_unlocked_adventure_zones(user_id); 