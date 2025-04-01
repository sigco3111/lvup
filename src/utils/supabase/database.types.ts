/**
 * Supabase 데이터베이스 스키마에 대한 TypeScript 타입 정의
 * 실제 데이터베이스 구조에 따라 확장 필요
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          nickname: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nickname?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nickname?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // 게임 레벨 요구사항 테이블
      game_level_requirements: {
        Row: {
          level: number
          required_exp: number
          stat_increase: {
            strength: number
            dexterity: number
            intelligence: number
            vitality: number
          }
        }
        Insert: {
          level: number
          required_exp: number
          stat_increase?: {
            strength: number
            dexterity: number
            intelligence: number
            vitality: number
          }
        }
        Update: {
          level?: number
          required_exp?: number
          stat_increase?: {
            strength: number
            dexterity: number
            intelligence: number
            vitality: number
          }
        }
      }
      // 직업 테이블
      game_jobs: {
        Row: {
          id: number
          name: string
          description: string | null
          tier: number
          parent_job_id: number | null
          required_level: number
          stats_per_level: {
            strength: number
            dexterity: number
            intelligence: number
            vitality: number
          }
          base_stats: {
            strength: number
            dexterity: number
            intelligence: number
            vitality: number
            hp: number
            mp: number
          }
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          tier?: number
          parent_job_id?: number | null
          required_level?: number
          stats_per_level?: {
            strength: number
            dexterity: number
            intelligence: number
            vitality: number
          }
          base_stats?: {
            strength: number
            dexterity: number
            intelligence: number
            vitality: number
            hp: number
            mp: number
          }
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          tier?: number
          parent_job_id?: number | null
          required_level?: number
          stats_per_level?: {
            strength: number
            dexterity: number
            intelligence: number
            vitality: number
          }
          base_stats?: {
            strength: number
            dexterity: number
            intelligence: number
            vitality: number
            hp: number
            mp: number
          }
        }
      }
      // 사용자 캐릭터 테이블
      user_characters: {
        Row: {
          id: string
          user_id: string
          job_id: number
          level: number
          experience: number
          strength: number
          dexterity: number
          intelligence: number
          vitality: number
          max_hp: number
          max_mp: number
          current_hp: number
          current_mp: number
          physical_attack: number
          magical_attack: number
          physical_defense: number
          magical_defense: number
          critical_rate: number
          critical_damage: number
          skill_points: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          job_id: number
          level?: number
          experience?: number
          strength?: number
          dexterity?: number
          intelligence?: number
          vitality?: number
          max_hp?: number
          max_mp?: number
          current_hp?: number
          current_mp?: number
          physical_attack?: number
          magical_attack?: number
          physical_defense?: number
          magical_defense?: number
          critical_rate?: number
          critical_damage?: number
          skill_points?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          job_id?: number
          level?: number
          experience?: number
          strength?: number
          dexterity?: number
          intelligence?: number
          vitality?: number
          max_hp?: number
          max_mp?: number
          current_hp?: number
          current_mp?: number
          physical_attack?: number
          magical_attack?: number
          physical_defense?: number
          magical_defense?: number
          critical_rate?: number
          critical_damage?: number
          skill_points?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Functions: {
      // 경험치 처리 함수
      process_experience_gain: {
        Args: {
          p_user_id: string
          p_exp_gain: number
        }
        Returns: {
          level_up: boolean
          levels_gained: number
          current_level: number
          current_exp: number
          stats: {
            strength: number
            dexterity: number
            intelligence: number
            vitality: number
            max_hp: number
            max_mp: number
            physical_attack: number
            magical_attack: number
            physical_defense: number
            magical_defense: number
          }
          next_level_exp: number
          skill_points: number
        }
      }
      // 캐릭터 생성 함수
      create_new_character: {
        Args: {
          p_user_id: string
          p_job_id: number
        }
        Returns: string
      }
    }
  }
} 