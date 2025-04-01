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
    }
  }
} 