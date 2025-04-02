-- user_game_data 테이블이 없으면 생성하는 스크립트
CREATE TABLE IF NOT EXISTS user_game_data (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  gold INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- current_stage_id 필드가 없으면 추가 (BIGINT 타입으로 수정)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'user_game_data' 
    AND column_name = 'current_stage_id'
  ) THEN
    ALTER TABLE user_game_data 
    ADD COLUMN current_stage_id BIGINT REFERENCES game_stages(id);
  END IF;
END $$;

-- 기존 레코드 중 current_stage_id가 NULL인 경우 기본값(1)으로 설정
UPDATE user_game_data
SET current_stage_id = 1
WHERE current_stage_id IS NULL AND EXISTS (SELECT 1 FROM game_stages WHERE id = 1);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_game_data_user_id ON user_game_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_game_data_current_stage_id ON user_game_data(current_stage_id); 