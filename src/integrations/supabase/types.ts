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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          rt_number: Database["public"]["Enums"]["rt_type"] | null
          wilayah: Database["public"]["Enums"]["wilayah_type"]
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          rt_number?: Database["public"]["Enums"]["rt_type"] | null
          wilayah?: Database["public"]["Enums"]["wilayah_type"]
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          rt_number?: Database["public"]["Enums"]["rt_type"] | null
          wilayah?: Database["public"]["Enums"]["wilayah_type"]
        }
        Relationships: []
      }
      report_comments: {
        Row: {
          created_at: string
          id: string
          message: string
          report_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          report_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          report_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_comments_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          alamat: string | null
          created_at: string
          deskripsi: string
          foto_url: string | null
          id: string
          kategori: Database["public"]["Enums"]["report_kategori"]
          nama_pelapor: string | null
          rt_tujuan: Database["public"]["Enums"]["rt_type"]
          status: Database["public"]["Enums"]["report_status"]
          tanggapan_admin: string | null
          tanggapan_at: string | null
          tanggapan_by: string | null
          title: string | null
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          alamat?: string | null
          created_at?: string
          deskripsi: string
          foto_url?: string | null
          id?: string
          kategori: Database["public"]["Enums"]["report_kategori"]
          nama_pelapor?: string | null
          rt_tujuan: Database["public"]["Enums"]["rt_type"]
          status?: Database["public"]["Enums"]["report_status"]
          tanggapan_admin?: string | null
          tanggapan_at?: string | null
          tanggapan_by?: string | null
          title?: string | null
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          alamat?: string | null
          created_at?: string
          deskripsi?: string
          foto_url?: string | null
          id?: string
          kategori?: Database["public"]["Enums"]["report_kategori"]
          nama_pelapor?: string | null
          rt_tujuan?: Database["public"]["Enums"]["rt_type"]
          status?: Database["public"]["Enums"]["report_status"]
          tanggapan_admin?: string | null
          tanggapan_at?: string | null
          tanggapan_by?: string | null
          title?: string | null
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_report: {
        Args: { _report_id: string; _user_id: string }
        Returns: boolean
      }
      get_user_wilayah: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["wilayah_type"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin_rw" | "admin_rt" | "warga"
      report_kategori: "Keamanan" | "Sampah" | "Infrastruktur" | "Lainnya"
      report_status: "Menunggu" | "Diproses" | "Selesai"
      rt_type: "RT01" | "RT02" | "RT03" | "RT04" | "RT05"
      wilayah_type: "RT01" | "RT02" | "RT03" | "RT04" | "RT05" | "RW04"
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
      app_role: ["admin_rw", "admin_rt", "warga"],
      report_kategori: ["Keamanan", "Sampah", "Infrastruktur", "Lainnya"],
      report_status: ["Menunggu", "Diproses", "Selesai"],
      rt_type: ["RT01", "RT02", "RT03", "RT04", "RT05"],
      wilayah_type: ["RT01", "RT02", "RT03", "RT04", "RT05", "RW04"],
    },
  },
} as const
