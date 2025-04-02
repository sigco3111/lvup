/**
 * 스테이지 시스템 관련 타입 정의
 * 
 * 스테이지, 지역, 월드 관련 데이터 타입을 정의합니다.
 */

// 스테이지 데이터 타입
export interface Stage {
  id: number;            // 스테이지 ID (예: 1, 3)
  name: string;          // 스테이지 이름
  regionId: string;      // 속한 지역 ID (FK)
  worldId: string;       // 속한 월드 ID (FK)
  sequence: number;      // 지역 내 순서
  nextStageId: number | null; // 다음 스테이지 ID (FK, nullable)
  isBossStage: boolean;  // 보스 스테이지 여부
  bossMonster?: string;  // 보스 몬스터 ID (FK, nullable)
  normalMonsters: string[]; // 일반 몬스터 ID 목록
  requiredMonsterCount: number; // 목표 몬스터 처치 수
  backgroundUrl: string; // 배경 이미지 URL
  requiredPower?: number; // 권장 전투력 (nullable)
  description?: string;  // 스테이지 설명
  goldReward?: number;   // 골드 보상
  expReward?: number;    // 경험치 보상
  itemDropRate?: number; // 아이템 드롭율
}

// 지역 데이터 타입
export interface Region {
  id: string;            // 지역 ID
  name: string;          // 지역 이름
  worldId: string;       // 속한 월드 ID (FK)
  unlockConditionStageId?: number; // 해금 조건 스테이지 ID (FK, nullable)
  relatedAdventureZoneId?: string; // 관련 모험 지역 ID (FK, nullable)
}

// 월드 데이터 타입
export interface World {
  id: string;            // 월드 ID
  name: string;          // 월드 이름
}

// 스테이지 진행 상태 타입
export interface StageProgress {
  currentStageId: number;         // 현재 스테이지 ID
  killedMonsterCount: number;     // 현재 처치한 몬스터 수
  isBossAvailable: boolean;       // 보스 도전 가능 여부
  isBossBattle: boolean;          // 현재 보스 전투 중 여부
  clearedStages: number[];        // 클리어한 스테이지 ID 목록
  isCleared?: boolean;            // 현재 스테이지 클리어 여부
  requiredKillCount?: number;     // 필요 처치 수
}

// 스테이지 클리어 데이터 타입
export interface ClearStageData {
  stageId: number;      // 클리어한 스테이지 ID
  isBossClear: boolean; // 보스 클리어 여부
}

// 스테이지 클리어 결과 타입
export interface ClearStageResult {
  success: boolean;           // 성공 여부
  message?: string;           // 메시지 (에러 시)
  nextStageId?: number;       // 다음 스테이지 ID
  unlockedRegionId?: string;  // 해금된 지역 ID (보스 클리어 시)
} 