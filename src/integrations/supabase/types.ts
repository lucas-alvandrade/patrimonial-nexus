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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ambiente_bens: {
        Row: {
          ambiente_id: number | null
          bem_id: number | null
          created_at: string
          data_registro: string | null
          id: number
          updated_at: string
          usuario_id: number | null
        }
        Insert: {
          ambiente_id?: number | null
          bem_id?: number | null
          created_at?: string
          data_registro?: string | null
          id?: never
          updated_at?: string
          usuario_id?: number | null
        }
        Update: {
          ambiente_id?: number | null
          bem_id?: number | null
          created_at?: string
          data_registro?: string | null
          id?: never
          updated_at?: string
          usuario_id?: number | null
        }
        Relationships: []
      }
      ambientes: {
        Row: {
          bloco: string | null
          created_at: string
          descricao: string | null
          id: number
          nome: string
          updated_at: string
        }
        Insert: {
          bloco?: string | null
          created_at?: string
          descricao?: string | null
          id?: never
          nome: string
          updated_at?: string
        }
        Update: {
          bloco?: string | null
          created_at?: string
          descricao?: string | null
          id?: never
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      bens: {
        Row: {
          carga_atual: string | null
          condicao: string
          created_at: string
          descricao: string | null
          id: number
          numero_patrimonio: string
          setor_responsavel: string | null
          updated_at: string
          valor: number | null
        }
        Insert: {
          carga_atual?: string | null
          condicao: string
          created_at?: string
          descricao?: string | null
          id?: never
          numero_patrimonio: string
          setor_responsavel?: string | null
          updated_at?: string
          valor?: number | null
        }
        Update: {
          carga_atual?: string | null
          condicao?: string
          created_at?: string
          descricao?: string | null
          id?: never
          numero_patrimonio?: string
          setor_responsavel?: string | null
          updated_at?: string
          valor?: number | null
        }
        Relationships: []
      }
      grupos: {
        Row: {
          created_at: string
          id: number
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: never
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: never
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      grupos_usuarios: {
        Row: {
          created_at: string
          grupo_id: number
          id: number
          usuario_id: number
        }
        Insert: {
          created_at?: string
          grupo_id: number
          id?: never
          usuario_id: number
        }
        Update: {
          created_at?: string
          grupo_id?: number
          id?: never
          usuario_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "grupos_usuarios_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grupos_usuarios_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      inventario_itens: {
        Row: {
          created_at: string
          descricao: string
          duplicado: string | null
          id: number
          inventariante: string | null
          inventario_id: number
          patrimonio: string
          situacao: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao: string
          duplicado?: string | null
          id?: number
          inventariante?: string | null
          inventario_id: number
          patrimonio: string
          situacao: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string
          duplicado?: string | null
          id?: number
          inventariante?: string | null
          inventario_id?: number
          patrimonio?: string
          situacao?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventario_itens_inventario_id_fkey"
            columns: ["inventario_id"]
            isOneToOne: false
            referencedRelation: "inventarios"
            referencedColumns: ["id"]
          },
        ]
      }
      inventarios: {
        Row: {
          ambiente_id: number
          concluido_em: string | null
          concluido_por: number | null
          created_at: string
          id: number
          status: Database["public"]["Enums"]["status_inventario"]
          updated_at: string
          usuario_responsavel: number | null
        }
        Insert: {
          ambiente_id: number
          concluido_em?: string | null
          concluido_por?: number | null
          created_at?: string
          id?: number
          status?: Database["public"]["Enums"]["status_inventario"]
          updated_at?: string
          usuario_responsavel?: number | null
        }
        Update: {
          ambiente_id?: number
          concluido_em?: string | null
          concluido_por?: number | null
          created_at?: string
          id?: number
          status?: Database["public"]["Enums"]["status_inventario"]
          updated_at?: string
          usuario_responsavel?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventarios_ambiente_id_fkey"
            columns: ["ambiente_id"]
            isOneToOne: true
            referencedRelation: "ambientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventarios_concluido_por_fkey"
            columns: ["concluido_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventarios_usuario_responsavel_fkey"
            columns: ["usuario_responsavel"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      patrimonio: {
        Row: {
          condicao: string
          created_at: string
          descricao: string | null
          id: number
          localizacao: string
          numero_patrimonio: string
          updated_at: string
        }
        Insert: {
          condicao: string
          created_at?: string
          descricao?: string | null
          id?: never
          localizacao: string
          numero_patrimonio: string
          updated_at?: string
        }
        Update: {
          condicao?: string
          created_at?: string
          descricao?: string | null
          id?: never
          localizacao?: string
          numero_patrimonio?: string
          updated_at?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          created_at: string
          email: string | null
          id: number
          ldap_id: string | null
          nome: string
          role: Database["public"]["Enums"]["user_role"]
          senha: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: never
          ldap_id?: string | null
          nome: string
          role?: Database["public"]["Enums"]["user_role"]
          senha?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: never
          ldap_id?: string | null
          nome?: string
          role?: Database["public"]["Enums"]["user_role"]
          senha?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      status_inventario: "nao_iniciado" | "em_andamento" | "concluido"
      user_role: "admin" | "user"
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
      status_inventario: ["nao_iniciado", "em_andamento", "concluido"],
      user_role: ["admin", "user"],
    },
  },
} as const
