-- 사용자 리소스(골드, 경험치) 업데이트 함수
-- 원자적 업데이트를 보장하여 동시성 문제를 방지합니다.

CREATE OR REPLACE FUNCTION update_user_resources(
  p_user_id uuid,         -- 사용자 ID
  p_gold_delta bigint,    -- 골드 변경량 (증가: 양수, 감소: 음수)
  p_exp_delta bigint      -- 경험치 변경량 (증가: 양수, 감소: 음수)
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- 함수를 생성한 사용자(보통 postgres)의 권한으로 실행
AS $$
BEGIN
  -- 사용자 게임 데이터 업데이트
  UPDATE public.user_game_data
  SET
    gold = GREATEST(0, gold + p_gold_delta),  -- 골드는 0 미만이 될 수 없음
    experience = experience + p_exp_delta,    -- 경험치 업데이트
    updated_at = now()                        -- 업데이트 시간 기록
  WHERE user_id = p_user_id;
  
  -- 해당 사용자 ID가 없는 경우 레코드 생성
  IF NOT FOUND THEN
    INSERT INTO public.user_game_data (
      user_id, 
      gold, 
      experience, 
      created_at, 
      updated_at
    ) VALUES (
      p_user_id, 
      GREATEST(0, p_gold_delta),
      GREATEST(0, p_exp_delta),
      now(),
      now()
    );
  END IF;
END;
$$;

-- 실행 권한 부여
GRANT EXECUTE ON FUNCTION update_user_resources(uuid, bigint, bigint) TO authenticated;

-- 사용 예시:
-- SELECT update_user_resources('사용자ID', 100, 50); -- 골드 100, 경험치 50 증가
-- SELECT update_user_resources('사용자ID', -50, 0);  -- 골드 50 감소, 경험치 변화 없음 