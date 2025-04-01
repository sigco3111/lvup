---

## **기능명세서: 23. 비주얼/연출 강화**

**개발 우선순위:** Phase 4 (심화 콘텐츠 및 운영 도구) - 난이도: 보통

### **프론트엔드 기능명세서**

1.  **화면 레이아웃 및 디자인 명세 (개선 방향)**:
    *   **직업별 외형 변화 디테일**:
        *   **목표:** 전직 시 단순히 아이콘 변경을 넘어, 메인 게임 화면(`BattleScene.tsx`)의 캐릭터 외형(스프라이트, 3D 모델 등)이 해당 직업에 맞게 변경되도록 구현.
        *   **구현 방식 제안:** 직업별 고유 모델/스프라이트 리소스 로드 및 교체 로직 구현. CSS 클래스 또는 상태 기반으로 애니메이션(Idle, Attack 등) 전환.
        *   **관련 컴포넌트:** `app/dashboard/BattleScene.tsx`, 캐릭터 모델/스프라이트 렌더링 컴포넌트.
    *   **고등급 장비/강화 이펙트**:
        *   **목표:** '전설', '신화' 등급 아이템 및 특정 강화 레벨(예: +10, +15) 달성 시 시각적인 특별함 부여.
        *   **구현 방식 제안:**
            *   아이템 아이콘: 테두리 애니메이션(빛나는 효과 등) 추가. (CSS, SVG 애니메이션)
            *   캐릭터 장착 시: 해당 장비 부위에 은은한 파티클 이펙트 또는 오라(Aura) 효과 추가. (파티클 라이브러리: `react-tsparticles` 등 또는 WebGL 기반 구현)
        *   **관련 컴포넌트:** `app/inventory/InventoryItemCard.tsx`, `app/character/EquipmentSlot.tsx`, `app/dashboard/BattleScene.tsx`.
    *   **스킬 이펙트 강화**:
        *   **목표:** 기존 스킬 효과를 더 화려하고 직관적으로 개선하여 타격감과 보는 재미 증대.
        *   **구현 방식 제안:** 스킬 종류/속성/등급에 따라 차별화된 파티클, 폭발, 잔상, 화면 흔들림 등의 효과 추가. 스킬 시전 및 적중 시 애니메이션 보강. (파티클 라이브러리, CSS 애니메이션, 필요시 Canvas/WebGL 활용)
        *   **관련 컴포넌트:** `app/dashboard/BattleScene.tsx`, 스킬 이펙트 처리 관련 모듈.
    *   **월드별 테마 시각적 차별화**:
        *   **목표:** 각 월드/지역(메인 스테이지, 모험 지역) 진입 시 배경 이미지 변경 외에, 해당 지역의 고유한 분위기를 느낄 수 있도록 시각 요소 강화.
        *   **구현 방식 제안:**
            *   UI 테마: 지역 테마에 맞는 일부 UI 색상 팔레트 변경 (TailwindCSS 테마 기능 활용).
            *   환경 효과: 배경에 날씨 효과(비, 눈), 환경 파티클(반딧불, 먼지 등) 추가.
            *   몬스터 디자인: 지역 테마에 맞는 몬스터 외형 적용.
        *   **관련 컴포넌트:** `app/dashboard/BattleScene.tsx`, `app/dashboard/StageInfo.tsx`, 전역 스타일 (`styles/globals.css`), 레이아웃 컴포넌트 (`app/layout.tsx` 등).
    *   **ShadCN 컴포넌트 활용:** 이 기능은 게임 내 시각 효과 중심으로, ShadCN 컴포넌트 직접 활용보다는 TailwindCSS 스타일링, CSS 애니메이션, 외부 라이브러리(파티클, 애니메이션) 활용이 주가 됨. 다만, UI 테마 변경 시 ShadCN의 테마 기능을 활용할 수 있음.

2.  **사용자 흐름 및 상호작용**:
    *   사용자는 별도 조작 없이, 게임 플레이 중 강화된 비주얼/연출을 자연스럽게 경험.
        *   전직 시 캐릭터 외형 변화 확인.
        *   고등급/고강화 장비 착용 시 특별한 이펙트 확인.
        *   전투 중 강화된 스킬 이펙트 경험.
        *   다른 월드/지역 이동 시 변화된 시각적 테마 경험.

3.  **API 연동**:
    *   **데이터 로드 필요성:** 강화된 비주얼 표현을 위해 필요한 데이터(예: 직업별 외형 리소스 경로, 장비/스킬 이펙트 타입/리소스 경로, 월드별 테마 정보)를 백엔드로부터 로드해야 할 수 있음. (기존 `game_jobs`, `game_items`, `game_skills`, `game_worlds` 데이터에 관련 필드 추가 또는 별도 API).

4.  **테스트 항목**:
    *   직업 변경 시 캐릭터 외형이 올바르게 변경되는지 확인.
    *   고등급/고강화 장비 착용 시 지정된 시각 효과(아이콘, 인게임)가 표시되는지 확인.
    *   각 스킬 사용 시 개선된 이펙트가 정상적으로 출력되는지 확인.
    *   월드/지역 이동 시 배경, UI 테마, 환경 효과 등이 의도대로 변경되는지 확인.
    *   **성능 테스트:** 추가된 시각 효과로 인해 프레임 드랍 등 성능 저하가 발생하는지 확인 및 최적화.
    *   다양한 환경(브라우저, 기기)에서 시각 효과가 일관되게 표시되는지 확인.

---

### **백엔드 기능명세서**

1.  **API 정의**:
    *   **기존 데이터 제공 API 확장 (필요시)**:
        *   게임 상태, 아이템, 스킬, 직업, 월드/지역 정보를 반환하는 기존 API (`/api/game-state`, 관련 Server Component 데이터 로직 등) 응답에 시각 효과 관련 필드 추가.
            *   `game_jobs`: `visual_resource_id` (or `sprite_path`, `model_path`)
            *   `game_items`: `grade_effect_id`, `enhancement_effects` (JSONB, 예: `{"10": "glow_blue", "15": "aura_gold"}`)
            *   `game_skills`: `effect_resource_id` (or `particle_effect_name`)
            *   `game_worlds`/`game_regions`: `theme_name`, `environment_effect_id`
        *   이러한 정보는 클라이언트 측 리소스 매핑에 사용될 수 있음.

2.  **데이터베이스 설계 및 연동**:
    *   **기존 테이블 필드 추가 (필요시)**:
        *   `game_jobs`: `visual_resource_id` (text, nullable).
        *   `game_items`: `grade_effect_id` (text, nullable), `enhancement_effects` (jsonb, nullable).
        *   `game_skills`: `effect_resource_id` (text, nullable).
        *   `game_worlds`/`game_regions`: `theme_name` (text, nullable), `environment_effect_id` (text, nullable).
    *   **(선택적) `game_visual_effects` 테이블**: 시각 효과 리소스(파티클 설정, 애니메이션 이름 등)를 중앙에서 관리할 경우 신규 테이블 정의 가능.
    *   **연동 로직:** 백엔드는 주로 관련 데이터를 저장하고 API를 통해 제공하는 역할을 함. 실제 시각 효과 렌더링 로직은 프론트엔드에 집중됨.

3.  **테스트 항목**:
    *   확장된 API가 시각 효과 관련 데이터(리소스 ID, 테마 이름 등)를 정확하게 반환하는지 확인.
    *   DB에 추가된 관련 필드 및 데이터가 올바르게 저장되고 조회되는지 확인.
    *   (선택적) `game_visual_effects` 테이블 설계 및 데이터 정합성 확인.

---
