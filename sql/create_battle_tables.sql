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