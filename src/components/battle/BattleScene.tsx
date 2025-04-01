'use client';

import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { createClient } from '@/utils/supabase/client';

// 전투 관련 타입 정의
interface Monster {
  id: string;
  name: string;
  level: number;
  maxHp: number;
  currentHp: number;
  attack: number;
  defense: number;
  exp: number;
  gold: number;
}

interface Character {
  id: string;
  name: string;
  level: number;
  maxHp: number;
  currentHp: number;
  attack: number;
  defense: number;
  attackSpeed: number;
}

interface BattleState {
  isInBattle: boolean;
  currentMonster: Monster | null;
  lastDamageDealt: number | null;
  lastDamageReceived: number | null;
}

/**
 * 전투 장면을 표시하는 컴포넌트
 * 자동 전투 로직과 시각적 표현을 담당
 */
export default function BattleScene() {
  const supabase = createClient();
  const [character, setCharacter] = useState<Character | null>(null);
  const [battleState, setBattleState] = useState<BattleState>({
    isInBattle: false,
    currentMonster: null,
    lastDamageDealt: null,
    lastDamageReceived: null,
  });
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // 캐릭터 정보 로드
  useEffect(() => {
    async function loadCharacterData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: characterData, error } = await supabase
          .from('user_characters')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        if (characterData) {
          // 수정: 모든 숫자 데이터에 Number() 적용하여 타입 보장
          setCharacter({
            id: characterData.id,
            name: characterData.name,
            level: Number(characterData.level),
            maxHp: Number(characterData.max_hp),
            currentHp: Number(characterData.max_hp), // 초기에는 최대 체력으로 설정
            attack: Number(characterData.physical_attack || characterData.attack),
            defense: Number(characterData.physical_defense || characterData.defense),
            attackSpeed: Number(characterData.attack_speed || 1),
          });
          
          // 데이터 로드 완료 플래그 설정
          setIsDataLoaded(true);
        }
      } catch (error) {
        console.error('캐릭터 데이터 로드 실패:', error);
      }
    }

    loadCharacterData();
  }, []);

  // 몬스터 생성 함수
  const spawnMonster = async () => {
    try {
      // 현재 스테이지에 맞는 모든 몬스터 정보 로드
      const { data: monstersData, error } = await supabase
        .from('game_monsters')
        .select('*')
        .eq('stage_id', 1) // TODO: 실제 현재 스테이지 ID로 변경 필요
        .order('is_boss', { ascending: true }); // 일반 몬스터 먼저, 보스 나중에

      if (error) throw error;

      if (!monstersData || monstersData.length === 0) {
        console.error('스테이지에 등록된 몬스터가 없습니다.');
        return;
      }

      // 이전 몬스터와 다른 몬스터 선택 (가능한 경우)
      let selectedMonster = monstersData[0]; // 기본값
      
      if (monstersData.length > 1) {
        // 현재 몬스터 ID 가져오기 (있는 경우)
        const currentMonsterId = battleState.currentMonster?.id;
        
        // 현재 몬스터와 다른 몬스터들 필터링
        const availableMonsters = monstersData.filter(monster => 
          monster.id !== currentMonsterId
        );
        
        // 필터링된 몬스터가 있으면 랜덤으로 선택, 없으면 전체 목록에서 랜덤 선택
        const monsters = availableMonsters.length > 0 ? availableMonsters : monstersData;
        const randomIndex = Math.floor(Math.random() * monsters.length);
        selectedMonster = monsters[randomIndex];
        
        // 디버깅
        console.log('새 몬스터 생성:', {
          이전몬스터ID: currentMonsterId,
          가능한몬스터수: monsters.length,
          선택된몬스터: selectedMonster.name
        });
      }

      // 선택된 몬스터로 상태 업데이트
      setBattleState(prev => ({
        ...prev,
        isInBattle: true,
        currentMonster: {
          id: selectedMonster.id,
          name: selectedMonster.name,
          level: Number(selectedMonster.level),
          maxHp: Number(selectedMonster.max_hp),
          currentHp: Number(selectedMonster.max_hp),
          attack: Number(selectedMonster.attack),
          defense: Number(selectedMonster.defense),
          exp: Number(selectedMonster.exp),
          gold: Number(selectedMonster.gold),
        },
      }));
    } catch (error) {
      console.error('몬스터 생성 실패:', error);
    }
  };

  // 데미지 계산 함수
  const calculateDamage = (attacker: { attack: number }, defender: { defense: number }) => {
    const baseDamage = Math.max(attacker.attack - defender.defense, 1);
    const variance = Math.random() * 0.2 - 0.1; // -10% ~ +10% 변동
    return Math.round(baseDamage * (1 + variance)); // 반올림하여 정수로 반환
  };

  // 전투 진행 함수
  const progressBattle = () => {
    if (!character || !battleState.currentMonster || !battleState.isInBattle) return;

    // 추가: 유효성 검사 추가
    if (isNaN(character.currentHp) || isNaN(battleState.currentMonster.currentHp)) {
      console.error('유효하지 않은 HP 값: ', {
        characterHp: character.currentHp,
        monsterHp: battleState.currentMonster.currentHp
      });
      
      // HP 값 초기화 시도
      setCharacter(prev => prev ? {
        ...prev,
        currentHp: prev.maxHp || 100 // 기본값 설정
      } : null);
      
      setBattleState(prev => ({
        ...prev,
        currentMonster: prev.currentMonster ? {
          ...prev.currentMonster,
          currentHp: prev.currentMonster.maxHp || 50 // 기본값 설정
        } : null
      }));
      
      return; // 계산 중단
    }

    // 캐릭터의 공격
    const damageToMonster = calculateDamage(character, battleState.currentMonster);
    const updatedMonsterHp = Math.max(Math.round(battleState.currentMonster.currentHp - damageToMonster), 0);

    // 몬스터의 반격
    const damageToCharacter = calculateDamage(battleState.currentMonster, character);
    const updatedCharacterHp = Math.max(Math.round(character.currentHp - damageToCharacter), 0);

    // 상태 업데이트
    setCharacter(prev => prev ? { ...prev, currentHp: updatedCharacterHp } : null);
    setBattleState(prev => ({
      ...prev,
      currentMonster: prev.currentMonster ? {
        ...prev.currentMonster,
        currentHp: updatedMonsterHp,
      } : null,
      lastDamageDealt: damageToMonster, // 이미 정수임
      lastDamageReceived: damageToCharacter, // 이미 정수임
    }));

    // 몬스터 처치 확인
    if (updatedMonsterHp <= 0) {
      handleMonsterDefeat();
    }

    // 캐릭터 사망 확인 (현재는 부활 처리)
    if (updatedCharacterHp <= 0) {
      handleCharacterDefeat();
    }
  };

  // 몬스터 처치 처리
  const handleMonsterDefeat = async () => {
    if (!character || !battleState.currentMonster) return;

    try {
      // 처치된 몬스터 정보 임시 저장 (디버깅용)
      const defeatedMonster = {
        id: battleState.currentMonster.id,
        name: battleState.currentMonster.name,
        exp: battleState.currentMonster.exp,
        gold: battleState.currentMonster.gold
      };
      
      console.log('몬스터 처치:', defeatedMonster);

      // 전투 상태 초기화 (몬스터 처치됨 표시)
      setBattleState(prev => ({
        ...prev,
        isInBattle: false,
        currentMonster: null
      }));

      // 경험치와 골드 획득 처리
      const { error } = await supabase.rpc('gain_experience', {
        p_character_id: character.id,
        p_exp_amount: Number(defeatedMonster.exp),
        p_gold_amount: Number(defeatedMonster.gold),
      });

      if (error) {
        console.error('보상 획득 실패:', error);
        throw error;
      }

      // 새로운 몬스터 생성 (약간의 지연 추가로 상태 업데이트 보장)
      setTimeout(() => {
        spawnMonster();
      }, 300);
      
    } catch (error) {
      console.error('몬스터 처치 보상 처리 실패:', error);
      // 에러가 발생해도 새 몬스터는 생성해야 함
      setTimeout(() => {
        spawnMonster();
      }, 300);
    }
  };

  // 캐릭터 사망 처리 (현재는 즉시 부활)
  const handleCharacterDefeat = () => {
    if (!character) return;
    setCharacter(prev => prev ? { ...prev, currentHp: Number(prev.maxHp) } : null);
  };

  // 자동 전투 타이머 - 수정: 의존성 배열에 isDataLoaded 추가
  useEffect(() => {
    // 데이터가 완전히 로드된 후에만 전투 시작
    if (!isDataLoaded) return;
    
    // 캐릭터는 있지만 전투 중이 아니거나 몬스터가 없는 경우 새 몬스터 생성
    if (character && (!battleState.isInBattle || !battleState.currentMonster)) {
      console.log('새 전투 시작: 몬스터 생성 필요');
      spawnMonster();
      return;
    }
    
    // 전투 중일 때만 타이머 설정
    if (character && battleState.isInBattle && battleState.currentMonster) {
      // 추가 디버깅
      console.log('전투 진행 중: ', {
        몬스터: battleState.currentMonster.name,
        몬스터HP: `${battleState.currentMonster.currentHp}/${battleState.currentMonster.maxHp}`,
        캐릭터HP: `${character.currentHp}/${character.maxHp}`
      });

      const battleInterval = setInterval(() => {
        progressBattle();
      }, 1000 / (Number(character.attackSpeed) || 1)); // 공격 속도에 따른 타이머 설정

      return () => clearInterval(battleInterval);
    }
  }, [character, battleState.isInBattle, battleState.currentMonster, isDataLoaded]);

  if (!character || !battleState.currentMonster) {
    return <div className="flex items-center justify-center h-64">전투 준비 중...</div>;
  }

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      {/* 전투 장면 */}
      <div className="mb-4 p-4 bg-gray-700 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          {/* 캐릭터 정보 */}
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-2">{character.name} Lv.{character.level}</h3>
            <div className="space-y-2">
              <Progress 
                value={(character.currentHp / character.maxHp) * 100} 
                className="h-2 bg-gray-900"
              />
              <p className="text-sm text-gray-300">
                HP: {Math.round(character.currentHp)}/{Math.round(character.maxHp)}
              </p>
            </div>
          </div>

          {/* VS 표시 */}
          <div className="mx-4 text-2xl font-bold text-yellow-500">VS</div>

          {/* 몬스터 정보 */}
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-2">
              {battleState.currentMonster.name} Lv.{battleState.currentMonster.level}
            </h3>
            <div className="space-y-2">
              <Progress 
                value={(battleState.currentMonster.currentHp / battleState.currentMonster.maxHp) * 100}
                className="h-2 bg-gray-900"
              />
              <p className="text-sm text-gray-300">
                HP: {Math.round(battleState.currentMonster.currentHp)}/{Math.round(battleState.currentMonster.maxHp)}
              </p>
            </div>
          </div>
        </div>

        {/* 데미지 표시 */}
        <div className="mt-4 flex justify-center space-x-4 text-sm">
          {battleState.lastDamageDealt !== null && (
            <span className="text-green-400 px-2 py-1 rounded bg-gray-900 font-medium inline-block">
              데미지: {Math.round(Number(battleState.lastDamageDealt))}
            </span>
          )}
          {battleState.lastDamageReceived !== null && (
            <span className="text-red-400 px-2 py-1 rounded bg-gray-900 font-medium inline-block">
              피해: {Math.round(Number(battleState.lastDamageReceived))}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}