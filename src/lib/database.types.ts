export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      project: {
        Row: {
          id: string
          title: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      thread: {
        Row: {
          id: string
          project_id: string
          name: string
          color: string
          sort_order: number
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          color?: string
          sort_order?: number
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          color?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: 'thread_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'project'
            referencedColumns: ['id']
          }
        ]
      }
      episode: {
        Row: {
          id: string
          project_id: string
          number: number
          title: string
          thematic_link: string
          notes: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          number: number
          title?: string
          thematic_link?: string
          notes?: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          number?: number
          title?: string
          thematic_link?: string
          notes?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'episode_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'project'
            referencedColumns: ['id']
          }
        ]
      }
      arc_cell: {
        Row: {
          id: string
          episode_id: string
          thread_id: string
          content: string
          updated_at: string
        }
        Insert: {
          id?: string
          episode_id: string
          thread_id: string
          content?: string
          updated_at?: string
        }
        Update: {
          id?: string
          episode_id?: string
          thread_id?: string
          content?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'arc_cell_episode_id_fkey'
            columns: ['episode_id']
            isOneToOne: false
            referencedRelation: 'episode'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'arc_cell_thread_id_fkey'
            columns: ['thread_id']
            isOneToOne: false
            referencedRelation: 'thread'
            referencedColumns: ['id']
          }
        ]
      }
      beat: {
        Row: {
          id: string
          episode_id: string
          thread_id: string
          label: 'Opening' | 'Beat' | 'Climax' | 'Closing'
          text: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          episode_id: string
          thread_id: string
          label?: 'Opening' | 'Beat' | 'Climax' | 'Closing'
          text?: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          episode_id?: string
          thread_id?: string
          label?: 'Opening' | 'Beat' | 'Climax' | 'Closing'
          text?: string
          sort_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'beat_episode_id_fkey'
            columns: ['episode_id']
            isOneToOne: false
            referencedRelation: 'episode'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'beat_thread_id_fkey'
            columns: ['thread_id']
            isOneToOne: false
            referencedRelation: 'thread'
            referencedColumns: ['id']
          }
        ]
      }
      character: {
        Row: {
          id: string
          project_id: string
          name: string
          color: string
          arc_summary: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          color?: string
          arc_summary?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          color?: string
          arc_summary?: string
        }
        Relationships: [
          {
            foreignKeyName: 'character_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'project'
            referencedColumns: ['id']
          }
        ]
      }
      beat_character: {
        Row: {
          beat_id: string
          character_id: string
        }
        Insert: {
          beat_id: string
          character_id: string
        }
        Update: {
          beat_id?: string
          character_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'beat_character_beat_id_fkey'
            columns: ['beat_id']
            isOneToOne: false
            referencedRelation: 'beat'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'beat_character_character_id_fkey'
            columns: ['character_id']
            isOneToOne: false
            referencedRelation: 'character'
            referencedColumns: ['id']
          }
        ]
      }
      character_note: {
        Row: {
          id: string
          character_id: string
          beat_id: string
          content: string
          updated_at: string
        }
        Insert: {
          id?: string
          character_id: string
          beat_id: string
          content?: string
          updated_at?: string
        }
        Update: {
          id?: string
          character_id?: string
          beat_id?: string
          content?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'character_note_character_id_fkey'
            columns: ['character_id']
            isOneToOne: false
            referencedRelation: 'character'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'character_note_beat_id_fkey'
            columns: ['beat_id']
            isOneToOne: false
            referencedRelation: 'beat'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
