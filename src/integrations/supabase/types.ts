export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      annotation_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      annotation_documents: {
        Row: {
          category_id: string
          created_at: string
          document_type: string
          file_name: string
          file_path: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          document_type?: string
          file_name: string
          file_path: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          document_type?: string
          file_name?: string
          file_path?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "annotation_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      annotation_questions: {
        Row: {
          correct_answer: number
          created_at: string
          document_id: string
          explanation: string | null
          id: string
          options: Json
          question: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          correct_answer: number
          created_at?: string
          document_id: string
          explanation?: string | null
          id?: string
          options: Json
          question: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          correct_answer?: number
          created_at?: string
          document_id?: string
          explanation?: string | null
          id?: string
          options?: Json
          question?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "annotation_questions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      block_review_sessions: {
        Row: {
          block_id: string
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean
          lesson_id: string
          review_round: number
          review_type: string
          scheduled_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          block_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          lesson_id: string
          review_round: number
          review_type: string
          scheduled_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          block_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          lesson_id?: string
          review_round?: number
          review_type?: string
          scheduled_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "block_review_sessions_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "review_blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      content_share_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          recipient_id: string
          responded_at: string | null
          sender_id: string
          shared_content_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          recipient_id: string
          responded_at?: string | null
          sender_id: string
          shared_content_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          recipient_id?: string
          responded_at?: string | null
          sender_id?: string
          shared_content_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_share_requests_shared_content_id_fkey"
            columns: ["shared_content_id"]
            isOneToOne: false
            referencedRelation: "shared_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_recipient_id"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_sender_id"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      daily_schedule: {
        Row: {
          adjusted_duration_minutes: number
          completed_at: string | null
          created_at: string
          date: string
          hour: number
          id: string
          is_completed: boolean
          lesson_id: string
          original_duration_minutes: number
          playback_speed: number
          updated_at: string
          user_id: string
        }
        Insert: {
          adjusted_duration_minutes: number
          completed_at?: string | null
          created_at?: string
          date: string
          hour: number
          id?: string
          is_completed?: boolean
          lesson_id: string
          original_duration_minutes: number
          playback_speed?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          adjusted_duration_minutes?: number
          completed_at?: string | null
          created_at?: string
          date?: string
          hour?: number
          id?: string
          is_completed?: boolean
          lesson_id?: string
          original_duration_minutes?: number
          playback_speed?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      estatisticas_estudo: {
        Row: {
          data: string
          id: string
          questoes_corretas: number | null
          questoes_resolvidas: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          data?: string
          id?: string
          questoes_corretas?: number | null
          questoes_resolvidas?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          data?: string
          id?: string
          questoes_corretas?: number | null
          questoes_resolvidas?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exercise_progress: {
        Row: {
          answers: Json
          current_question_index: number
          id: string
          is_finished: boolean
          lesson_id: string
          results: Json
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          current_question_index?: number
          id?: string
          is_finished?: boolean
          lesson_id: string
          results?: Json
          started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          current_question_index?: number
          id?: string
          is_finished?: boolean
          lesson_id?: string
          results?: Json
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feed_events: {
        Row: {
          created_at: string
          event_type: Database["public"]["Enums"]["feed_event_type"]
          id: number
          metadata: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: Database["public"]["Enums"]["feed_event_type"]
          id?: number
          metadata?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: Database["public"]["Enums"]["feed_event_type"]
          id?: number
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      flashcards: {
        Row: {
          acertos: number | null
          created_at: string
          dificuldade: string
          id: string
          materia: string
          pergunta: string
          resposta: string
          revisoes: number | null
          user_id: string
        }
        Insert: {
          acertos?: number | null
          created_at?: string
          dificuldade: string
          id?: string
          materia: string
          pergunta: string
          resposta: string
          revisoes?: number | null
          user_id: string
        }
        Update: {
          acertos?: number | null
          created_at?: string
          dificuldade?: string
          id?: string
          materia?: string
          pergunta?: string
          resposta?: string
          revisoes?: number | null
          user_id?: string
        }
        Relationships: []
      }
      friend_requests: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          sender_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          sender_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string
          id: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: []
      }
      group_members: {
        Row: {
          created_at: string
          group_id: string
          role: Database["public"]["Enums"]["group_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          role?: Database["public"]["Enums"]["group_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          role?: Database["public"]["Enums"]["group_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          image_url: string | null
          is_public: boolean
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_public?: boolean
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_public?: boolean
          name?: string
        }
        Relationships: []
      }
      imported_content_tracking: {
        Row: {
          id: string
          imported_at: string
          imported_item_type: string
          new_item_id: string
          original_item_id: string
          original_shared_content_id: string
          user_id: string
        }
        Insert: {
          id?: string
          imported_at?: string
          imported_item_type: string
          new_item_id: string
          original_item_id: string
          original_shared_content_id: string
          user_id: string
        }
        Update: {
          id?: string
          imported_at?: string
          imported_item_type?: string
          new_item_id?: string
          original_item_id?: string
          original_shared_content_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "imported_content_tracking_original_shared_content_id_fkey"
            columns: ["original_shared_content_id"]
            isOneToOne: false
            referencedRelation: "shared_content"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_categories: {
        Row: {
          created_at: string
          id: string
          is_archived: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_archived?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_archived?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lesson_documents: {
        Row: {
          created_at: string
          document_type: string
          file_name: string
          file_path: string
          id: string
          lesson_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_type?: string
          file_name: string
          file_path: string
          id?: string
          lesson_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string
          file_path?: string
          id?: string
          lesson_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lesson_flashcards: {
        Row: {
          created_at: string
          dica: string | null
          frente: string
          id: string
          lesson_id: string
          updated_at: string
          user_id: string
          verso: string
        }
        Insert: {
          created_at?: string
          dica?: string | null
          frente: string
          id?: string
          lesson_id: string
          updated_at?: string
          user_id: string
          verso: string
        }
        Update: {
          created_at?: string
          dica?: string | null
          frente?: string
          id?: string
          lesson_id?: string
          updated_at?: string
          user_id?: string
          verso?: string
        }
        Relationships: []
      }
      lesson_html_files: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          lesson_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          lesson_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          lesson_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_html_files_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          lesson_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          lesson_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          lesson_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lesson_performances: {
        Row: {
          accuracy_percentage: number
          created_at: string
          id: string
          incorrect_questions: string | null
          lesson_id: string
          notes: string | null
          questions_correct: number
          questions_incorrect: number
          total_questions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          accuracy_percentage?: number
          created_at?: string
          id?: string
          incorrect_questions?: string | null
          lesson_id: string
          notes?: string | null
          questions_correct?: number
          questions_incorrect?: number
          total_questions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          accuracy_percentage?: number
          created_at?: string
          id?: string
          incorrect_questions?: string | null
          lesson_id?: string
          notes?: string | null
          questions_correct?: number
          questions_incorrect?: number
          total_questions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lesson_reviews: {
        Row: {
          created_at: string
          ease_factor: number
          id: string
          interval_days: number
          last_reviewed_at: string
          lesson_id: string
          next_review_date: string
          rating: number
          repetition: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          last_reviewed_at?: string
          lesson_id: string
          next_review_date: string
          rating: number
          repetition?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          last_reviewed_at?: string
          lesson_id?: string
          next_review_date?: string
          rating?: number
          repetition?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_reviews_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_transcriptions: {
        Row: {
          created_at: string
          end_time: number
          id: string
          lesson_id: string
          start_time: number
          text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_time: number
          id?: string
          lesson_id: string
          start_time: number
          text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_time?: number
          id?: string
          lesson_id?: string
          start_time?: number
          text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          audio_file_path: string | null
          category_id: string
          created_at: string
          duration_minutes: number
          html_file_path: string | null
          id: string
          name: string
          rated_at: string | null
          rating: number | null
          summary: string | null
          updated_at: string
          user_id: string
          watched: boolean
          watched_at: string | null
          website_url: string | null
        }
        Insert: {
          audio_file_path?: string | null
          category_id: string
          created_at?: string
          duration_minutes: number
          html_file_path?: string | null
          id?: string
          name: string
          rated_at?: string | null
          rating?: number | null
          summary?: string | null
          updated_at?: string
          user_id: string
          watched?: boolean
          watched_at?: string | null
          website_url?: string | null
        }
        Update: {
          audio_file_path?: string | null
          category_id?: string
          created_at?: string
          duration_minutes?: number
          html_file_path?: string | null
          id?: string
          name?: string
          rated_at?: string | null
          rating?: number | null
          summary?: string | null
          updated_at?: string
          user_id?: string
          watched?: boolean
          watched_at?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "lesson_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          last_seen: string | null
          nickname: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          last_seen?: string | null
          nickname?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          last_seen?: string | null
          nickname?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      questao_tentativas: {
        Row: {
          acertou: boolean
          created_at: string
          id: string
          questao_id: string
          resposta_selecionada: number
          tempo_gasto: number
          user_id: string
        }
        Insert: {
          acertou: boolean
          created_at?: string
          id?: string
          questao_id: string
          resposta_selecionada: number
          tempo_gasto: number
          user_id: string
        }
        Update: {
          acertou?: boolean
          created_at?: string
          id?: string
          questao_id?: string
          resposta_selecionada?: number
          tempo_gasto?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questao_tentativas_questao_id_fkey"
            columns: ["questao_id"]
            isOneToOne: false
            referencedRelation: "questoes"
            referencedColumns: ["id"]
          },
        ]
      }
      question_attempts: {
        Row: {
          completed_at: string
          id: string
          is_correct: boolean
          question_id: string
          selected_answer: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          is_correct: boolean
          question_id: string
          selected_answer: number
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          selected_answer?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "annotation_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      question_ratings: {
        Row: {
          comment: string | null
          created_at: string
          difficulty_rating: number
          id: string
          question_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          difficulty_rating: number
          id?: string
          question_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          difficulty_rating?: number
          id?: string
          question_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      questoes: {
        Row: {
          acertou: boolean | null
          alternativas: Json
          ano: number
          assunto: string
          banca: string
          cargo: string | null
          created_at: string
          dificuldade: string
          enunciado: string
          explicacao: string | null
          favorita: boolean | null
          id: string
          materia: string
          orgao: string | null
          prova: string | null
          respondida: boolean | null
          resposta_correta: number
          tags: Json | null
          tempo_resposta: number | null
          tentativas: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          acertou?: boolean | null
          alternativas: Json
          ano: number
          assunto: string
          banca: string
          cargo?: string | null
          created_at?: string
          dificuldade: string
          enunciado: string
          explicacao?: string | null
          favorita?: boolean | null
          id?: string
          materia: string
          orgao?: string | null
          prova?: string | null
          respondida?: boolean | null
          resposta_correta: number
          tags?: Json | null
          tempo_resposta?: number | null
          tentativas?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          acertou?: boolean | null
          alternativas?: Json
          ano?: number
          assunto?: string
          banca?: string
          cargo?: string | null
          created_at?: string
          dificuldade?: string
          enunciado?: string
          explicacao?: string | null
          favorita?: boolean | null
          id?: string
          materia?: string
          orgao?: string | null
          prova?: string | null
          respondida?: boolean | null
          resposta_correta?: number
          tags?: Json | null
          tempo_resposta?: number | null
          tentativas?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      review_blocks: {
        Row: {
          block_name: string
          block_number: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          block_name: string
          block_number: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          block_name?: string
          block_number?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shared_content: {
        Row: {
          content_type: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          owner_id: string
          title: string
          updated_at: string
        }
        Insert: {
          content_type?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          owner_id: string
          title: string
          updated_at?: string
        }
        Update: {
          content_type?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          owner_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      shared_content_items: {
        Row: {
          created_at: string
          id: string
          item_data: Json
          item_id: string
          item_type: string
          shared_content_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_data: Json
          item_id: string
          item_type: string
          shared_content_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_data?: Json
          item_id?: string
          item_type?: string
          shared_content_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_content_items_shared_content_id_fkey"
            columns: ["shared_content_id"]
            isOneToOne: false
            referencedRelation: "shared_content"
            referencedColumns: ["id"]
          },
        ]
      }
      study_block_list: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: []
      }
      study_entry_requests: {
        Row: {
          created_at: string
          id: string
          requester_id: string
          responded_at: string | null
          room_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          requester_id: string
          responded_at?: string | null
          room_id: string
          status: string
        }
        Update: {
          created_at?: string
          id?: string
          requester_id?: string
          responded_at?: string | null
          room_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_entry_requests_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "study_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      study_goals: {
        Row: {
          category_ids: Json
          created_at: string
          daily_hours: number
          daily_schedule: Json | null
          end_date: string
          id: string
          is_active: boolean
          start_date: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_ids: Json
          created_at?: string
          daily_hours: number
          daily_schedule?: Json | null
          end_date: string
          id?: string
          is_active?: boolean
          start_date: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_ids?: Json
          created_at?: string
          daily_hours?: number
          daily_schedule?: Json | null
          end_date?: string
          id?: string
          is_active?: boolean
          start_date?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      study_room_events: {
        Row: {
          created_at: string
          event_id: string
          id: number
          payload: Json | null
          room_id: string
          type: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: number
          payload?: Json | null
          room_id: string
          type: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: number
          payload?: Json | null
          room_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_room_events_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "study_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      study_room_participants: {
        Row: {
          id: string
          is_active: boolean
          joined_at: string
          left_at: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          joined_at?: string
          left_at?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          is_active?: boolean
          joined_at?: string
          left_at?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: []
      }
      study_room_timers: {
        Row: {
          accumulated_ms: number
          event_id: string
          room_id: string
          started_at: string | null
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accumulated_ms?: number
          event_id: string
          room_id: string
          started_at?: string | null
          state: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accumulated_ms?: number
          event_id?: string
          room_id?: string
          started_at?: string | null
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_room_timers_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "study_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      study_rooms: {
        Row: {
          capacity: number
          created_at: string
          created_by: string
          deleted_at: string | null
          id: string
          name: string
          visibility: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          created_by: string
          deleted_at?: string | null
          id?: string
          name?: string
          visibility?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          id?: string
          name?: string
          visibility?: string
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          created_at: string
          id: string
          is_completed: boolean
          notes: string | null
          resource_id: string
          resource_title: string
          study_date: string
          study_type: Database["public"]["Enums"]["study_type"]
          time_spent_minutes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_completed?: boolean
          notes?: string | null
          resource_id: string
          resource_title: string
          study_date?: string
          study_type: Database["public"]["Enums"]["study_type"]
          time_spent_minutes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_completed?: boolean
          notes?: string | null
          resource_id?: string
          resource_title?: string
          study_date?: string
          study_type?: Database["public"]["Enums"]["study_type"]
          time_spent_minutes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      study_trails: {
        Row: {
          admin_id: string
          created_at: string
          description: string | null
          id: string
          is_private: boolean
          name: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_private?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_private?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      study_type_reviews: {
        Row: {
          completed_at: string
          created_at: string
          id: string
          lesson_id: string
          review_type: string
          study_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          id?: string
          lesson_id: string
          review_type: string
          study_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          id?: string
          lesson_id?: string
          review_type?: string
          study_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trail_content: {
        Row: {
          added_by: string
          content_id: string
          content_type: string
          created_at: string
          id: string
          title: string
          trail_id: string
        }
        Insert: {
          added_by: string
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          title: string
          trail_id: string
        }
        Update: {
          added_by?: string
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          title?: string
          trail_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trail_content_trail_id_fkey"
            columns: ["trail_id"]
            isOneToOne: false
            referencedRelation: "study_trails"
            referencedColumns: ["id"]
          },
        ]
      }
      trail_invitations: {
        Row: {
          created_at: string
          id: string
          invitee_id: string
          inviter_id: string
          status: string
          trail_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          invitee_id: string
          inviter_id: string
          status?: string
          trail_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          invitee_id?: string
          inviter_id?: string
          status?: string
          trail_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trail_invitations_trail_id_fkey"
            columns: ["trail_id"]
            isOneToOne: false
            referencedRelation: "study_trails"
            referencedColumns: ["id"]
          },
        ]
      }
      trail_members: {
        Row: {
          id: string
          joined_at: string
          role: string
          status: string
          trail_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string
          status?: string
          trail_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
          status?: string
          trail_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trail_members_trail_id_fkey"
            columns: ["trail_id"]
            isOneToOne: false
            referencedRelation: "study_trails"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clone_content_rpc: {
        Args: { p_shared_content_id: string }
        Returns: undefined
      }
      clone_shared_content: {
        Args: { p_recipient_id: string; p_shared_content_id: string }
        Returns: undefined
      }
      force_leave_all_rooms: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      is_group_member: {
        Args: { group_id_to_check: string; user_id_to_check: string }
        Returns: boolean
      }
      is_trail_member: {
        Args: { check_trail_id: string; check_user_id: string }
        Returns: boolean
      }
      leave_study_room: {
        Args: { p_room_id: string }
        Returns: undefined
      }
      log_feed_event: {
        Args: { p_event_type: string; p_metadata: Json }
        Returns: undefined
      }
    }
    Enums: {
      feed_event_type:
        | "lesson_completed"
        | "quiz_completed"
        | "study_session_started"
        | "goal_achieved"
        | "friendship_formed"
      group_role: "admin" | "member"
      study_type: "livro" | "questao" | "audio" | "website" | "flashcard"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      feed_event_type: [
        "lesson_completed",
        "quiz_completed",
        "study_session_started",
        "goal_achieved",
        "friendship_formed",
      ],
      group_role: ["admin", "member"],
      study_type: ["livro", "questao", "audio", "website", "flashcard"],
    },
  },
} as const
