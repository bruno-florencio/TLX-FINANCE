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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      categorias: {
        Row: {
          cor: string | null
          created_at: string
          id: string
          nome: string
          tipo: string
          updated_at: string
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          cor?: string | null
          created_at?: string
          id?: string
          nome: string
          tipo: string
          updated_at?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          cor?: string | null
          created_at?: string
          id?: string
          nome?: string
          tipo?: string
          updated_at?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categorias_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      centros_custo: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          nome: string
          updated_at: string
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "centros_custo_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          contato: string | null
          created_at: string | null
          id: string
          nome: string
          workspace_id: string
        }
        Insert: {
          contato?: string | null
          created_at?: string | null
          id?: string
          nome: string
          workspace_id: string
        }
        Update: {
          contato?: string | null
          created_at?: string | null
          id?: string
          nome?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      conciliacoes: {
        Row: {
          created_at: string | null
          extrato_id: string | null
          id: string
          lancamento_id: string | null
        }
        Insert: {
          created_at?: string | null
          extrato_id?: string | null
          id?: string
          lancamento_id?: string | null
        }
        Update: {
          created_at?: string | null
          extrato_id?: string | null
          id?: string
          lancamento_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conciliacoes_extrato_id_fkey"
            columns: ["extrato_id"]
            isOneToOne: false
            referencedRelation: "extratos_bancarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conciliacoes_lancamento_id_fkey"
            columns: ["lancamento_id"]
            isOneToOne: false
            referencedRelation: "lancamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes: {
        Row: {
          created_at: string | null
          fuso_horario: string | null
          moeda: string | null
          notificacoes: boolean | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          fuso_horario?: string | null
          moeda?: string | null
          notificacoes?: boolean | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          fuso_horario?: string | null
          moeda?: string | null
          notificacoes?: boolean | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_bancarias: {
        Row: {
          agencia: string | null
          ativo: boolean
          banco: string | null
          bandeira: string | null
          cor: string | null
          created_at: string
          id: string
          limite: number | null
          nome: string
          numero_conta: string | null
          saldo_atual: number
          saldo_inicial: number
          tipo: string
          updated_at: string
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          agencia?: string | null
          ativo?: boolean
          banco?: string | null
          bandeira?: string | null
          cor?: string | null
          created_at?: string
          id?: string
          limite?: number | null
          nome: string
          numero_conta?: string | null
          saldo_atual?: number
          saldo_inicial?: number
          tipo: string
          updated_at?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          agencia?: string | null
          ativo?: boolean
          banco?: string | null
          bandeira?: string | null
          cor?: string | null
          created_at?: string
          id?: string
          limite?: number | null
          nome?: string
          numero_conta?: string | null
          saldo_atual?: number
          saldo_inicial?: number
          tipo?: string
          updated_at?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      extratos_bancarios: {
        Row: {
          conciliado: boolean | null
          conta_id: string | null
          created_at: string | null
          data: string
          descricao: string | null
          documento: string | null
          id: string
          valor: number
          workspace_id: string | null
        }
        Insert: {
          conciliado?: boolean | null
          conta_id?: string | null
          created_at?: string | null
          data: string
          descricao?: string | null
          documento?: string | null
          id?: string
          valor: number
          workspace_id?: string | null
        }
        Update: {
          conciliado?: boolean | null
          conta_id?: string | null
          created_at?: string | null
          data?: string
          descricao?: string | null
          documento?: string | null
          id?: string
          valor?: number
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "extratos_bancarios_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extratos_bancarios_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          ativo: boolean
          created_at: string
          documento: string | null
          email: string | null
          endereco: string | null
          id: string
          nome: string
          telefone: string | null
          tipo_documento: string | null
          updated_at: string
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          documento?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          telefone?: string | null
          tipo_documento?: string | null
          updated_at?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          documento?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          tipo_documento?: string | null
          updated_at?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fornecedores_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      lancamentos: {
        Row: {
          categoria_id: string | null
          centro_custo_id: string | null
          conta_id: string | null
          created_at: string
          data_pagamento: string | null
          data_vencimento: string
          descricao: string
          fornecedor_id: string | null
          id: string
          numero_documento: string | null
          observacoes: string | null
          parcela_atual: number | null
          recorrente: boolean
          status: string
          tipo: string
          total_parcelas: number | null
          updated_at: string
          user_id: string | null
          valor: number
          workspace_id: string | null
        }
        Insert: {
          categoria_id?: string | null
          centro_custo_id?: string | null
          conta_id?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento: string
          descricao: string
          fornecedor_id?: string | null
          id?: string
          numero_documento?: string | null
          observacoes?: string | null
          parcela_atual?: number | null
          recorrente?: boolean
          status?: string
          tipo: string
          total_parcelas?: number | null
          updated_at?: string
          user_id?: string | null
          valor: number
          workspace_id?: string | null
        }
        Update: {
          categoria_id?: string | null
          centro_custo_id?: string | null
          conta_id?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string
          fornecedor_id?: string | null
          id?: string
          numero_documento?: string | null
          observacoes?: string | null
          parcela_atual?: number | null
          recorrente?: boolean
          status?: string
          tipo?: string
          total_parcelas?: number | null
          updated_at?: string
          user_id?: string | null
          valor?: number
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "centros_custo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_auditoria: {
        Row: {
          created_at: string | null
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          operacao: string
          registro_id: string | null
          tabela: string
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          operacao: string
          registro_id?: string | null
          tabela: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          operacao?: string
          registro_id?: string | null
          tabela?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_auditoria_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos: {
        Row: {
          conta_id: string | null
          created_at: string | null
          data_pagamento: string
          id: string
          lancamento_id: string | null
          metodo: string | null
          valor: number
          workspace_id: string | null
        }
        Insert: {
          conta_id?: string | null
          created_at?: string | null
          data_pagamento: string
          id?: string
          lancamento_id?: string | null
          metodo?: string | null
          valor: number
          workspace_id?: string | null
        }
        Update: {
          conta_id?: string | null
          created_at?: string | null
          data_pagamento?: string
          id?: string
          lancamento_id?: string | null
          metodo?: string | null
          valor?: number
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_lancamento_id_fkey"
            columns: ["lancamento_id"]
            isOneToOne: false
            referencedRelation: "lancamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      recebimentos: {
        Row: {
          conta_id: string | null
          created_at: string | null
          data_recebimento: string
          id: string
          lancamento_id: string | null
          metodo: string | null
          valor: number
          workspace_id: string | null
        }
        Insert: {
          conta_id?: string | null
          created_at?: string | null
          data_recebimento: string
          id?: string
          lancamento_id?: string | null
          metodo?: string | null
          valor: number
          workspace_id?: string | null
        }
        Update: {
          conta_id?: string | null
          created_at?: string | null
          data_recebimento?: string
          id?: string
          lancamento_id?: string | null
          metodo?: string | null
          valor?: number
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recebimentos_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recebimentos_lancamento_id_fkey"
            columns: ["lancamento_id"]
            isOneToOne: false
            referencedRelation: "lancamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recebimentos_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      transferencias: {
        Row: {
          conta_destino_id: string
          conta_origem_id: string
          created_at: string
          data_transferencia: string
          descricao: string | null
          id: string
          updated_at: string
          user_id: string | null
          valor: number
          workspace_id: string | null
        }
        Insert: {
          conta_destino_id: string
          conta_origem_id: string
          created_at?: string
          data_transferencia?: string
          descricao?: string | null
          id?: string
          updated_at?: string
          user_id?: string | null
          valor: number
          workspace_id?: string | null
        }
        Update: {
          conta_destino_id?: string
          conta_origem_id?: string
          created_at?: string
          data_transferencia?: string
          descricao?: string | null
          id?: string
          updated_at?: string
          user_id?: string | null
          valor?: number
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transferencias_conta_destino_id_fkey"
            columns: ["conta_destino_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencias_conta_origem_id_fkey"
            columns: ["conta_origem_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencias_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_invites: {
        Row: {
          accepted: boolean | null
          created_at: string | null
          email: string | null
          id: string
          invited_by: string | null
          role: string | null
          workspace_id: string | null
        }
        Insert: {
          accepted?: boolean | null
          created_at?: string | null
          email?: string | null
          id?: string
          invited_by?: string | null
          role?: string | null
          workspace_id?: string | null
        }
        Update: {
          accepted?: boolean | null
          created_at?: string | null
          email?: string | null
          id?: string
          invited_by?: string | null
          role?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invites_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_users: {
        Row: {
          created_at: string | null
          id: string
          role: string | null
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspace_users_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string | null
          id: string
          nome: string
          owner_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
          owner_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
          owner_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      fn_atualizar_atraso: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
