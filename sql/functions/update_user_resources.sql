-- 사용자 자원(골드, 경험치) 업데이트 함수
-- 
-- 사용자의 골드, 경험치를 업데이트하는 함수입니다.
-- p_user_id: 사용자 ID
-- p_gold_delta: 증가/감소할 골드량 (양수: 증가, 음수: 감소)
-- p_exp_delta: 증가/감소할 경험치량 (양수: 증가, 음수: 감소)

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