/** Typed schema for the Supabase client. Mirrors supabase/migrations. */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      scan_history: {
        Row: {
          id: string;
          user_id: string;
          image_path: string;
          predicted_disease: string;
          confidence: number;
          early_blight_probability: number;
          late_blight_probability: number;
          scanned_at: string;
          model_name: string | null;
          model_version: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          image_path: string;
          predicted_disease: string;
          confidence: number;
          early_blight_probability: number;
          late_blight_probability: number;
          scanned_at?: string;
          model_name?: string | null;
          model_version?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          image_path?: string;
          predicted_disease?: string;
          confidence?: number;
          early_blight_probability?: number;
          late_blight_probability?: number;
          scanned_at?: string;
          model_name?: string | null;
          model_version?: string | null;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
