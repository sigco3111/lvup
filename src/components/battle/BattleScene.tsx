'use client';

import { useEffect, useState, useCallback } from 'react';
import { Progress } from '@/components/ui/progress';
import { createClient } from '@/utils/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { recordLoot, LootData } from '@/actions/game';
import { LogItem } from '@/components/dashboard/BattleLog';
import { useStage } from '@/components/stage/StageContext';
import { useNotification } from '@/components/common/Notifications';
import { Button } from '@/components/ui/button';
import { Character } from '@/types/character';

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
  itemDropChance?: number; // 아이템 드롭 확률
}

interface BattleStateType {
  isInBattle: boolean;
  currentMonster: Monster | null;
  lastDamageDealt: number | null;
  lastDamageReceived: number | null;
  battleTurn: number;
  isAutoMode: boolean;
}

interface BattleSceneProps {
  onLogUpdate?: (log: {
    id: string;
    type: string;
    message: string;
    timestamp: Date;
    value?: number;
  }) => void;
  onGoldChange?: (gold: number) => void;
  onExperienceGained?: (exp: number) => void;
  showInventory?: boolean;
}

/**
 * 전투 장면을 표시하는 컴포넌트
 * 자동 전투 로직과 시각적 표현을 담당
 */
export default function BattleScene({ onLogUpdate, onGoldChange, onExperienceGained, showInventory }: BattleSceneProps) {
  const supabase = createClient();
  const { currentStage, stageProgress, incrementKilledMonsterCount, setBossBattleState } = useStage();
  const { addNotification } = useNotification();
  const [character, setCharacter] = useState<Character | null>(null);
  const [battleState, setBattleState] = useState<BattleStateType>({
    isInBattle: false,
    currentMonster: null,
    lastDamageDealt: null,
    lastDamageReceived: null,
    battleTurn: 0,
    isAutoMode: false
  });
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [gameData, setGameData] = useState<{ gold: number }>({ gold: 0 });
  const [battleTimer, setBattleTimer] = useState(0); // 전투 타이머 
  
  // 캐릭터 정보 로드
  useEffect(() => {
    async function loadCharacterData() {
      try {
        // 사용자 인증 정보 가져오기 (getUser 사용)
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.error('사용자 인증 오류:', authError);
          return;
        }

        // 캐릭터 정보 로드
        const { data: characterData, error } = await supabase
          .from('user_characters')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        // 게임 데이터(골드 등) 로드
        const { data: gameData, error: gameDataError } = await supabase
          .from('user_game_data')
          .select('gold, current_stage_id')
          .eq('user_id', user.id)
          .maybeSingle(); // single() 대신 maybeSingle() 사용
          
        if (gameDataError) {
          console.error('게임 데이터 로드 실패:', gameDataError);
        } else {
          // 게임 데이터가 없는 경우 새로 생성
          if (!gameData) {
            try {
              // 기본 스테이지 ID 가져오기
              const { data: firstStage } = await supabase
                .from('game_stages')
                .select('id')
                .order('sequence', { ascending: true })
                .limit(1)
                .single();
                
              const defaultStageId = firstStage ? firstStage.id : 1; // 기본값 설정
              
              // 새로운 게임 데이터 생성
              const { data: newGameData, error: insertError } = await supabase
                .from('user_game_data')
                .insert({
                  user_id: user.id,
                  gold: 0,
                  current_stage_id: defaultStageId,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
                .select()
                .single();
              
              if (insertError) {
                console.error('게임 데이터 생성 실패:', insertError);
              } else {
                setGameData({ gold: newGameData.gold || 0 });
                if (onGoldChange) onGoldChange(newGameData.gold || 0);
              }
            } catch (insertError) {
              console.error('게임 데이터 생성 중 오류:', insertError);
            }
          } else {
            // 기존 게임 데이터 사용
            setGameData({ gold: gameData.gold || 0 });
            // 부모 컴포넌트에 골드 정보 전달
            if (onGoldChange) onGoldChange(gameData.gold || 0);
          }
        }

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
  }, [onGoldChange]);

  // 몬스터 생성 함수
  const spawnMonster = async () => {
    try {
      if (!character) return;
      
      // 현재 스테이지 정보가 없으면 기본 몬스터 생성
      if (!currentStage) {
        // 스테이지 정보가 없는 경우 기본 몬스터 생성 (기존 로직)
        const { data: monstersData, error } = await supabase
          .from('game_monsters')
          .select('*')
          .eq('stage_id', 1) // 기본 스테이지 ID
          .order('is_boss', { ascending: true }); // 일반 몬스터 먼저, 보스 나중에

        if (error || !monstersData || monstersData.length === 0) {
          console.error('몬스터 데이터 로드 실패:', error);
          return;
        }

        // 랜덤 몬스터 선택
        const randomIndex = Math.floor(Math.random() * monstersData.length);
        const selectedMonster = monstersData[randomIndex];
        
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
            itemDropChance: Number(selectedMonster.item_drop_chance || 0.05), // 기본 5%
          },
        }));
        
        return;
      }
      
      // 스테이지 정보가 있으면 스테이지에 맞는 몬스터 생성
      const isBossStage = currentStage.isBossStage;
      const isBossBattle = stageProgress.isBossBattle;
      
      console.log('스테이지 정보:', { isBossStage, isBossBattle, currentStage });
      
      // 보스 전투 모드인 경우 보스 몬스터 생성
      if (isBossStage && isBossBattle) {
        console.log('보스 전투 모드 활성화됨');
        
        // 보스 몬스터 정보 로드 또는 생성
        let bossMonster: Monster;
        
        if (currentStage.bossMonster) {
          // 보스 몬스터 정보 로드
          const { data: bossData, error: bossError } = await supabase
            .from('game_monsters')
            .select('*')
            .eq('id', currentStage.bossMonster)
            .single();
            
          if (bossError || !bossData) {
            console.error('보스 몬스터 정보 로드 실패:', bossError);
            // 보스 몬스터 정보가 없으면 임시 보스 생성
            bossMonster = {
              id: 'boss-' + Date.now(),
              name: `${currentStage.name} 보스`,
              level: character.level + 3,
              maxHp: character.maxHp * 5,
              currentHp: character.maxHp * 5,
              attack: character.attack * 1.5,
              defense: character.defense * 1.2,
              exp: character.level * 100,
              gold: character.level * 200,
              itemDropChance: 0.8 // 높은 아이템 드롭률
            };
          } else {
            // 보스 몬스터 데이터 사용
            bossMonster = {
              id: bossData.id,
              name: bossData.name,
              level: Number(bossData.level),
              maxHp: Number(bossData.max_hp),
              currentHp: Number(bossData.max_hp),
              attack: Number(bossData.attack),
              defense: Number(bossData.defense),
              exp: Number(bossData.exp),
              gold: Number(bossData.gold),
              itemDropChance: Number(bossData.item_drop_chance || 0.2)
            };
          }
        } else {
          // 보스 몬스터 ID가 없으면 임시 보스 생성
          bossMonster = {
            id: 'boss-' + Date.now(),
            name: `${currentStage.name} 보스`,
            level: character.level + 3,
            maxHp: character.maxHp * 5,
            currentHp: character.maxHp * 5,
            attack: character.attack * 1.5,
            defense: character.defense * 1.2,
            exp: character.level * 100,
            gold: character.level * 200,
            itemDropChance: 0.8 // 높은 아이템 드롭률
          };
        }
        
        // 보스 몬스터로 상태 업데이트
        setBattleState(prev => ({
          ...prev,
          isInBattle: true,
          currentMonster: bossMonster
        }));
        
        // 보스 출현 로그 추가
        if (onLogUpdate) {
          onLogUpdate({
            id: uuidv4(),
            type: 'battle',
            message: `🔥 보스 ${bossMonster.name}이(가) 출현했습니다! 🔥`,
            timestamp: new Date()
          });
        }
        
        return;
      }
      
      // 일반 몬스터 정보 로드 또는 생성 (스테이지 정보 기반)
      if (currentStage.normalMonsters && currentStage.normalMonsters.length > 0) {
        console.log('일반 몬스터 생성');
        
        // 스테이지에 정의된 몬스터 수 확인
        const monsterCount = currentStage.normalMonsters.length;
        
        // 몬스터 ID가 있는지 확인
        if (monsterCount > 0) {
          // 몬스터 ID가 있으면 DB에서 몬스터 정보 조회
          const { data: monstersData, error } = await supabase
            .from('game_monsters')
            .select('*')
            .in('id', currentStage.normalMonsters.map(m => m.id));
            
          if (error || !monstersData || monstersData.length === 0) {
            console.error('스테이지 몬스터 정보 로드 실패:', error);
            // 임시 몬스터 생성
            createDefaultMonster();
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
              itemDropChance: Number(selectedMonster.item_drop_chance || 0.05), // 기본 5%
            },
          }));
          
          return;
        }
      }
      
      // 스테이지에 몬스터 정보가 없거나 조회 실패시 기본 몬스터 생성
      createDefaultMonster();
    } catch (error) {
      console.error('몬스터 생성 실패:', error);
      // 오류 발생 시 기본 몬스터 생성
      createDefaultMonster();
    }
  };
  
  // 기본 몬스터 생성 함수
  const createDefaultMonster = () => {
    if (!character) return;
    
    // 기본 몬스터 생성
    const defaultMonster: Monster = {
      id: 'default-monster-' + Date.now(),
      name: '고블린',
      level: Math.max(1, character.level - 1),
      maxHp: 50 + character.level * 10,
      currentHp: 50 + character.level * 10,
      attack: 5 + character.level * 2,
      defense: 2 + character.level,
      exp: 15 + character.level * 5,
      gold: 10 + character.level * 3,
      itemDropChance: 0.05
    };
    
    // 몬스터 상태 업데이트
    setBattleState(prev => ({
      ...prev,
      isInBattle: true,
      currentMonster: defaultMonster
    }));
    
    // 몬스터 등장 로그
    if (onLogUpdate) {
      onLogUpdate({
        id: uuidv4(),
        type: 'battle',
        message: `${defaultMonster.name}이(가) 나타났습니다!`,
        timestamp: new Date()
      });
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

  // 몬스터 처치 처리 함수 완전히 재작성
  const handleMonsterDefeat = async () => {
    if (!character || !battleState.currentMonster) return;
    
    const { currentMonster } = battleState;
    
    // 현재 골드 값 가져오기
    const currentGold = gameData.gold || 0;
    
    // 획득한 골드, 경험치 계산
    const goldGained = currentMonster.gold;
    const expGained = currentMonster.exp;
    
    // 새로운 골드 값 계산
    const newGold = currentGold + goldGained;
    
    // 1. 즉시 UI 업데이트
    // ----------------
    // 골드 UI 즉시 업데이트
    setGameData(prev => ({ ...prev, gold: newGold }));
    
    // 2. 로그 메시지 추가
    // ----------------
    if (onLogUpdate) {
      // 몬스터 처치 로그
      onLogUpdate({
        id: uuidv4(),
        type: 'battle',
        message: `${currentMonster.name}을(를) 처치했습니다!`,
        timestamp: new Date()
      });
      
      // 골드 획득 로그
      onLogUpdate({
        id: uuidv4(),
        type: 'gold',
        message: `${goldGained} 골드를 획득했습니다!`,
        timestamp: new Date()
      });
      
      // 경험치 획득 로그
      onLogUpdate({
        id: uuidv4(),
        type: 'exp',
        message: `${expGained} 경험치를 획득했습니다!`,
        timestamp: new Date()
      });
    }
    
    // 3. 부모 컴포넌트에 변경 알림
    // -----------------------
    // 골드 변경 알림 (부모 컴포넌트)
    if (onGoldChange) {
      onGoldChange(newGold);
    }
    
    // 4. 서버에 저장 요청 (비동기)
    // -----------------------
    // 서버에 데이터 저장 (비동기로 백그라운드에서 진행)
    const savePromise = (async () => {
      try {
        // 아이템 드롭 처리
        let droppedItem = null;
        const itemDropped = Math.random() < (currentMonster.itemDropChance || 0.05);
        
        if (itemDropped) {
          // 아이템 로드 및 처리 로직...
          const { data: itemsData } = await supabase
            .from('game_items')
            .select('*')
            .lte('required_level', character.level)
            .limit(10);
            
          if (itemsData && itemsData.length > 0) {
            const randomItemIndex = Math.floor(Math.random() * itemsData.length);
            const selectedItem = itemsData[randomItemIndex];
            
            droppedItem = {
              itemId: selectedItem.id,
              quantity: 1
            };
            
            // 아이템 획득 로그
            if (onLogUpdate) {
              onLogUpdate({
                id: uuidv4(),
                type: 'battle',
                message: `${selectedItem.name}을(를) 획득했습니다!`,
                timestamp: new Date()
              });
            }
          }
        }
        
        // 서버에 전송할 데이터 구성
        const lootData: LootData = {
          gold: goldGained,
          exp: expGained,
          items: droppedItem ? [droppedItem] : undefined
        };
        
        // 서버에 저장 요청
        await recordLoot(lootData);
        
        console.log('전투 보상 서버 저장 완료');
      } catch (error) {
        console.error('전투 보상 서버 저장 실패:', error);
      }
    })();
    
    // 5. 무시해도 되는 비동기 작업 - 진행 중에 계속 진행
    
    // 보스 몬스터 처리
    const isBoss = currentStage?.isBossStage && stageProgress.isBossBattle;
    if (isBoss) {
      // 보스 전투 모드 종료
      setBossBattleState(false);
      
      // 보스 처치 로그 추가
      if (onLogUpdate) {
        onLogUpdate({
          id: uuidv4(),
          type: 'battle',
          message: `🏆 보스 ${currentMonster.name}을(를) 처치했습니다! 🏆`,
          timestamp: new Date()
        });
      }
    } else {
      // 일반 몬스터인 경우 스테이지 진행도 업데이트
      incrementKilledMonsterCount();
    }
    
    // 전투 상태 초기화
    setBattleState(prev => ({
      ...prev,
      isInBattle: false,
      currentMonster: null,
      lastDamageDealt: null,
      lastDamageReceived: null,
    }));
    
    // 몬스터 처치 후 약간의 지연시간 (1초)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 새 몬스터 생성
    spawnMonster();
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

  // 자동 전투 토글
  const toggleAutoFight = useCallback(() => {
    setBattleState(prev => ({
      ...prev,
      isAutoMode: !prev.isAutoMode
    }));
  }, []);

  // 자동 전투 관리
  useEffect(() => {
    if (battleState.isAutoMode && character && !battleState.isInBattle) {
      // 자동 전투 모드인데 전투 중이 아니면 새 몬스터 생성
      const timer = setTimeout(() => {
        spawnMonster();
      }, 1000);
      return () => clearTimeout(timer);
    }
    
    if (battleState.isAutoMode && battleState.isInBattle) {
      // 자동 전투 모드이고 전투 중이면 자동 공격
      const interval = setInterval(() => {
        progressBattle();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [battleState.isAutoMode, battleState.isInBattle, character]);

  // 전투 타이머
  useEffect(() => {
    if (battleState.isInBattle) {
      const timer = setInterval(() => {
        setBattleTimer(prev => prev + 1);
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [battleState.isInBattle]);

  // 보스 전투 처리 기능 추가
  useEffect(() => {
    // 보스 전투 상태가 변경되면 새 몬스터 소환
    if (stageProgress.isBossBattle && currentStage?.isBossStage) {
      console.log('보스 전투 시작 감지');
      spawnMonster();
    }
  }, [stageProgress.isBossBattle, currentStage]);

  if (!character) {
    return <div className="flex items-center justify-center h-64">캐릭터 정보를 불러오는 중...</div>;
  }

  if (!battleState.currentMonster) {
    return <div className="flex items-center justify-center h-64">전투 준비 중...</div>;
  }

  // 체력 바 퍼센트 계산
  const healthPercent = Math.floor((battleState.currentMonster.currentHp / battleState.currentMonster.maxHp) * 100);
  
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
              {battleState.currentMonster.name} 
              {battleState.currentMonster.itemDropChance && battleState.currentMonster.itemDropChance > 0.5 && <span className="text-red-600 ml-1">👑</span>}
            </h3>
            <div className="space-y-2">
              <Progress 
                value={healthPercent}
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
              데미지: {Math.round(battleState.lastDamageDealt)}
            </span>
          )}
          {battleState.lastDamageReceived !== null && (
            <span className="text-red-400 px-2 py-1 rounded bg-gray-900 font-medium inline-block">
              피해: {Math.round(battleState.lastDamageReceived)}
            </span>
          )}
        </div>
      </div>
      
      {/* 전투 정보 */}
      <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
        <div className="bg-gray-700 p-2 rounded">
          <p className="text-gray-300">골드: <span className="text-yellow-400">{gameData.gold}</span></p>
        </div>
        <div className="bg-gray-700 p-2 rounded">
          <p className="text-gray-300">
            보상: 
            <span className="text-yellow-400 ml-1">{battleState.currentMonster.gold} 골드</span>, 
            <span className="text-blue-400 ml-1">{battleState.currentMonster.exp} 경험치</span>
          </p>
        </div>
      </div>
      
      {/* 전투 컨트롤 */}
      <div className="flex space-x-2">
        <button
          onClick={spawnMonster}
          disabled={battleState.isInBattle}
          className={`flex-1 py-2 px-4 rounded font-medium ${
            battleState.isInBattle 
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          새 전투
        </button>
        
        <button
          onClick={progressBattle}
          disabled={!battleState.isInBattle}
          className={`flex-1 py-2 px-4 rounded font-medium ${
            !battleState.isInBattle 
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
            : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          공격
        </button>
        
        <button
          onClick={toggleAutoFight}
          className={`flex-1 py-2 px-4 rounded font-medium ${
            battleState.isAutoMode 
            ? 'bg-red-600 text-white hover:bg-red-700' 
            : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {battleState.isAutoMode ? '자동전투 중지' : '자동전투'}
        </button>
      </div>
      
      {/* 보스 도전 버튼 (단순 테스트용) */}
      {currentStage && !stageProgress.isBossBattle && stageProgress.isBossAvailable && (
        <div className="mt-3">
          <button
            onClick={() => setBossBattleState(true)}
            className="bg-red-700 text-white w-full py-2 px-4 rounded font-medium hover:bg-red-800"
          >
            보스 도전
          </button>
        </div>
      )}
    </div>
  );
}