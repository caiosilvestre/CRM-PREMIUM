// Generated via `mcp__claude_ai_Supabase__generate_typescript_types` against
// the live "CRM PREMIUM" Supabase project (equivalent to
// `supabase gen types typescript --linked`). Regenerate the `Database`
// section below when the schema changes; the friendly aliases underneath are
// hand-maintained on top of it and mirror supabase/migrations/*.sql.

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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          acao: string
          autor_id: string | null
          criado_em: string
          detalhe: Json | null
          id: string
          referencia_id: string | null
          referencia_tipo: string | null
        }
        Insert: {
          acao: string
          autor_id?: string | null
          criado_em?: string
          detalhe?: Json | null
          id?: string
          referencia_id?: string | null
          referencia_tipo?: string | null
        }
        Update: {
          acao?: string
          autor_id?: string | null
          criado_em?: string
          detalhe?: Json | null
          id?: string
          referencia_id?: string | null
          referencia_tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      approvals: {
        Row: {
          criado_em: string
          decidido_em: string | null
          decidido_por: string | null
          exclusivo_admin: boolean
          id: string
          motivo: string | null
          motivo_decisao: string | null
          referencia_id: string
          solicitante_id: string | null
          status: Database["public"]["Enums"]["approval_status"]
          tipo: Database["public"]["Enums"]["approval_type"]
        }
        Insert: {
          criado_em?: string
          decidido_em?: string | null
          decidido_por?: string | null
          exclusivo_admin?: boolean
          id?: string
          motivo?: string | null
          motivo_decisao?: string | null
          referencia_id: string
          solicitante_id?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          tipo: Database["public"]["Enums"]["approval_type"]
        }
        Update: {
          criado_em?: string
          decidido_em?: string | null
          decidido_por?: string | null
          exclusivo_admin?: boolean
          id?: string
          motivo?: string | null
          motivo_decisao?: string | null
          referencia_id?: string
          solicitante_id?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          tipo?: Database["public"]["Enums"]["approval_type"]
        }
        Relationships: [
          {
            foreignKeyName: "approvals_decidido_por_fkey"
            columns: ["decidido_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_solicitante_id_fkey"
            columns: ["solicitante_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          arquivo_url: string | null
          assinado_em: string | null
          atualizado_em: string
          campos: Json
          campos_customizados: Json
          criado_em: string
          criado_por: string | null
          id: string
          lead_id: string
          quote_id: string | null
          status_assinatura: Database["public"]["Enums"]["contract_signature_status"]
          template_id: string | null
        }
        Insert: {
          arquivo_url?: string | null
          assinado_em?: string | null
          atualizado_em?: string
          campos?: Json
          campos_customizados?: Json
          criado_em?: string
          criado_por?: string | null
          id?: string
          lead_id: string
          quote_id?: string | null
          status_assinatura?: Database["public"]["Enums"]["contract_signature_status"]
          template_id?: string | null
        }
        Update: {
          arquivo_url?: string | null
          assinado_em?: string | null
          atualizado_em?: string
          campos?: Json
          campos_customizados?: Json
          criado_em?: string
          criado_por?: string | null
          id?: string
          lead_id?: string
          quote_id?: string | null
          status_assinatura?: Database["public"]["Enums"]["contract_signature_status"]
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          assumida_por: string | null
          canal: string
          criado_em: string
          id: string
          lead_id: string
          modo: Database["public"]["Enums"]["conversation_mode"]
          ultima_mensagem_em: string | null
        }
        Insert: {
          assumida_por?: string | null
          canal?: string
          criado_em?: string
          id?: string
          lead_id: string
          modo?: Database["public"]["Enums"]["conversation_mode"]
          ultima_mensagem_em?: string | null
        }
        Update: {
          assumida_por?: string | null
          canal?: string
          criado_em?: string
          id?: string
          lead_id?: string
          modo?: Database["public"]["Enums"]["conversation_mode"]
          ultima_mensagem_em?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_assumida_por_fkey"
            columns: ["assumida_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_field_definitions: {
        Row: {
          ativo: boolean
          atualizado_em: string
          chave: string
          criado_em: string
          entidade: Database["public"]["Enums"]["custom_field_entity"]
          id: string
          opcoes: Json
          ordem: number
          rotulo: string
          usar_em_relatorios: boolean
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          chave: string
          criado_em?: string
          entidade: Database["public"]["Enums"]["custom_field_entity"]
          id?: string
          opcoes?: Json
          ordem?: number
          rotulo: string
          usar_em_relatorios?: boolean
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          chave?: string
          criado_em?: string
          entidade?: Database["public"]["Enums"]["custom_field_entity"]
          id?: string
          opcoes?: Json
          ordem?: number
          rotulo?: string
          usar_em_relatorios?: boolean
        }
        Relationships: []
      }
      finance_sync_log: {
        Row: {
          contract_id: string
          criado_em: string
          id: string
          payload: Json | null
          provider: string
          status: Database["public"]["Enums"]["finance_sync_status"]
        }
        Insert: {
          contract_id: string
          criado_em?: string
          id?: string
          payload?: Json | null
          provider?: string
          status?: Database["public"]["Enums"]["finance_sync_status"]
        }
        Update: {
          contract_id?: string
          criado_em?: string
          id?: string
          payload?: Json | null
          provider?: string
          status?: Database["public"]["Enums"]["finance_sync_status"]
        }
        Relationships: [
          {
            foreignKeyName: "finance_sync_log_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      followups: {
        Row: {
          concluido_em: string | null
          criado_em: string
          data: string
          descricao: string
          id: string
          lead_id: string
          responsavel_id: string | null
          status: Database["public"]["Enums"]["followup_status"]
        }
        Insert: {
          concluido_em?: string | null
          criado_em?: string
          data: string
          descricao: string
          id?: string
          lead_id: string
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["followup_status"]
        }
        Update: {
          concluido_em?: string | null
          criado_em?: string
          data?: string
          descricao?: string
          id?: string
          lead_id?: string
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["followup_status"]
        }
        Relationships: [
          {
            foreignKeyName: "followups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followups_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          atualizado_em: string
          campos_customizados: Json
          contato_email: string | null
          contato_telefone: string | null
          criado_em: string
          empresa: string | null
          etapa_atualizada_em: string
          etapa_funil: Database["public"]["Enums"]["funnel_stage"]
          id: string
          motivo_perda: string | null
          motivo_perda_detalhe: string | null
          nome: string
          origem: Database["public"]["Enums"]["lead_origin"]
          proxima_acao_data: string | null
          proxima_acao_descricao: string | null
          proxima_acao_responsavel_id: string | null
          responsavel_id: string | null
          valor_estimado: number | null
        }
        Insert: {
          atualizado_em?: string
          campos_customizados?: Json
          contato_email?: string | null
          contato_telefone?: string | null
          criado_em?: string
          empresa?: string | null
          etapa_atualizada_em?: string
          etapa_funil?: Database["public"]["Enums"]["funnel_stage"]
          id?: string
          motivo_perda?: string | null
          motivo_perda_detalhe?: string | null
          nome: string
          origem?: Database["public"]["Enums"]["lead_origin"]
          proxima_acao_data?: string | null
          proxima_acao_descricao?: string | null
          proxima_acao_responsavel_id?: string | null
          responsavel_id?: string | null
          valor_estimado?: number | null
        }
        Update: {
          atualizado_em?: string
          campos_customizados?: Json
          contato_email?: string | null
          contato_telefone?: string | null
          criado_em?: string
          empresa?: string | null
          etapa_atualizada_em?: string
          etapa_funil?: Database["public"]["Enums"]["funnel_stage"]
          id?: string
          motivo_perda?: string | null
          motivo_perda_detalhe?: string | null
          nome?: string
          origem?: Database["public"]["Enums"]["lead_origin"]
          proxima_acao_data?: string | null
          proxima_acao_descricao?: string | null
          proxima_acao_responsavel_id?: string | null
          responsavel_id?: string | null
          valor_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_proxima_acao_responsavel_id_fkey"
            columns: ["proxima_acao_responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          autor_id: string | null
          conversation_id: string
          criado_em: string
          id: string
          remetente: Database["public"]["Enums"]["message_sender"]
          texto: string
        }
        Insert: {
          autor_id?: string | null
          conversation_id: string
          criado_em?: string
          id?: string
          remetente: Database["public"]["Enums"]["message_sender"]
          texto: string
        }
        Update: {
          autor_id?: string | null
          conversation_id?: string
          criado_em?: string
          id?: string
          remetente?: Database["public"]["Enums"]["message_sender"]
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_rules: {
        Row: {
          ativo: boolean
          atualizado_em: string
          id: string
          preco: number
          servico: string
          unidade: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          id?: string
          preco: number
          servico: string
          unidade: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          id?: string
          preco?: number
          servico?: string
          unidade?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          atualizado_em: string
          criado_em: string
          email: string
          id: string
          limite_aprovacao_orcamento: number
          nome: string
          perfil: Database["public"]["Enums"]["user_role"]
          pode_aprovar_contrato: boolean
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          email: string
          id: string
          limite_aprovacao_orcamento?: number
          nome: string
          perfil?: Database["public"]["Enums"]["user_role"]
          pode_aprovar_contrato?: boolean
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          email?: string
          id?: string
          limite_aprovacao_orcamento?: number
          nome?: string
          perfil?: Database["public"]["Enums"]["user_role"]
          pode_aprovar_contrato?: boolean
        }
        Relationships: []
      }
      quotes: {
        Row: {
          atualizado_em: string
          campos_customizados: Json
          condicoes: string | null
          criado_em: string
          criado_por: string | null
          id: string
          itens: Json
          lead_id: string
          status: Database["public"]["Enums"]["quote_status"]
          template_id: string | null
          valor_total: number
          versao: number
        }
        Insert: {
          atualizado_em?: string
          campos_customizados?: Json
          condicoes?: string | null
          criado_em?: string
          criado_por?: string | null
          id?: string
          itens?: Json
          lead_id: string
          status?: Database["public"]["Enums"]["quote_status"]
          template_id?: string | null
          valor_total?: number
          versao?: number
        }
        Update: {
          atualizado_em?: string
          campos_customizados?: Json
          condicoes?: string | null
          criado_em?: string
          criado_por?: string | null
          id?: string
          itens?: Json
          lead_id?: string
          status?: Database["public"]["Enums"]["quote_status"]
          template_id?: string | null
          valor_total?: number
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotes_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          atualizado_em: string
          chave: string
          valor: Json
        }
        Insert: {
          atualizado_em?: string
          chave: string
          valor: Json
        }
        Update: {
          atualizado_em?: string
          chave?: string
          valor?: Json
        }
        Relationships: []
      }
      templates: {
        Row: {
          atualizado_em: string
          campos_customizados: Json
          conteudo: string
          criado_por: string | null
          id: string
          nome: string
          tipo: Database["public"]["Enums"]["template_type"]
          versao: number
        }
        Insert: {
          atualizado_em?: string
          campos_customizados?: Json
          conteudo: string
          criado_por?: string | null
          id?: string
          nome: string
          tipo: Database["public"]["Enums"]["template_type"]
          versao?: number
        }
        Update: {
          atualizado_em?: string
          campos_customizados?: Json
          conteudo?: string
          criado_por?: string | null
          id?: string
          nome?: string
          tipo?: Database["public"]["Enums"]["template_type"]
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "templates_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      approval_status:
        | "pendente"
        | "aprovado"
        | "aprovado_com_ajuste"
        | "reprovado"
      approval_type: "orcamento" | "contrato"
      contract_signature_status:
        | "rascunho"
        | "aguardando_aprovacao"
        | "aprovado"
        | "aguardando_assinatura"
        | "assinado"
      conversation_mode: "ia" | "humano"
      custom_field_entity: "lead" | "orcamento" | "contrato" | "modelo"
      finance_sync_status: "pendente_integracao" | "sincronizado" | "erro"
      followup_status: "pendente" | "concluido" | "atrasado"
      funnel_stage:
        | "novo_lead"
        | "qualificacao"
        | "orcamento_em_elaboracao"
        | "orcamento_aguardando_aprovacao"
        | "orcamento_enviado"
        | "negociacao"
        | "contrato_em_elaboracao"
        | "contrato_aguardando_aprovacao"
        | "aguardando_assinatura"
        | "fechado"
        | "perdido"
      lead_origin: "whatsapp" | "indicacao" | "site" | "outro"
      message_sender: "cliente" | "ia" | "humano"
      quote_status:
        | "rascunho"
        | "aguardando_aprovacao"
        | "aprovado"
        | "aprovado_com_ajuste"
        | "reprovado"
        | "enviado"
      template_type: "orcamento" | "contrato"
      user_role: "admin" | "comercial_financeiro"
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
      approval_status: [
        "pendente",
        "aprovado",
        "aprovado_com_ajuste",
        "reprovado",
      ],
      approval_type: ["orcamento", "contrato"],
      contract_signature_status: [
        "rascunho",
        "aguardando_aprovacao",
        "aprovado",
        "aguardando_assinatura",
        "assinado",
      ],
      conversation_mode: ["ia", "humano"],
      custom_field_entity: ["lead", "orcamento", "contrato", "modelo"],
      finance_sync_status: ["pendente_integracao", "sincronizado", "erro"],
      followup_status: ["pendente", "concluido", "atrasado"],
      funnel_stage: [
        "novo_lead",
        "qualificacao",
        "orcamento_em_elaboracao",
        "orcamento_aguardando_aprovacao",
        "orcamento_enviado",
        "negociacao",
        "contrato_em_elaboracao",
        "contrato_aguardando_aprovacao",
        "aguardando_assinatura",
        "fechado",
        "perdido",
      ],
      lead_origin: ["whatsapp", "indicacao", "site", "outro"],
      message_sender: ["cliente", "ia", "humano"],
      quote_status: [
        "rascunho",
        "aguardando_aprovacao",
        "aprovado",
        "aprovado_com_ajuste",
        "reprovado",
        "enviado",
      ],
      template_type: ["orcamento", "contrato"],
      user_role: ["admin", "comercial_financeiro"],
    },
  },
} as const

// ---------------------------------------------------------------------------
// Friendly aliases used across the app — thin wrappers over the generated
// types above, narrowing the jsonb columns (itens/campos/detalhe/payload/
// campos_customizados/opcoes) to the actual shapes this app writes into them
// instead of the generic `Json`.
// ---------------------------------------------------------------------------

export type UserRole = Database["public"]["Enums"]["user_role"];
export type FunnelStage = Database["public"]["Enums"]["funnel_stage"];
export type LeadOrigin = Database["public"]["Enums"]["lead_origin"];
export type ConversationMode = Database["public"]["Enums"]["conversation_mode"];
export type MessageSender = Database["public"]["Enums"]["message_sender"];
export type QuoteStatus = Database["public"]["Enums"]["quote_status"];
export type ContractSignatureStatus = Database["public"]["Enums"]["contract_signature_status"];
export type ApprovalType = Database["public"]["Enums"]["approval_type"];
export type ApprovalStatus = Database["public"]["Enums"]["approval_status"];
export type FollowupStatus = Database["public"]["Enums"]["followup_status"];
export type TemplateType = Database["public"]["Enums"]["template_type"];
export type FinanceSyncStatus = Database["public"]["Enums"]["finance_sync_status"];
export type CustomFieldEntity = Database["public"]["Enums"]["custom_field_entity"];

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ConversationRow = Database["public"]["Tables"]["conversations"]["Row"];
export type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
export type PricingRuleRow = Database["public"]["Tables"]["pricing_rules"]["Row"];
export type ApprovalRow = Database["public"]["Tables"]["approvals"]["Row"];
export type FollowupRow = Database["public"]["Tables"]["followups"]["Row"];
export type SettingsRow = Database["public"]["Tables"]["settings"]["Row"];

// Custom field values are always a chave -> valor map, one entry per active
// definition for that entity (e.g. { tipo_servico: "recorrente" }).
export type CustomFieldValues = Record<string, string>;

export type LeadRow = Omit<Database["public"]["Tables"]["leads"]["Row"], "campos_customizados"> & {
  campos_customizados: CustomFieldValues;
};

export interface QuoteItem {
  descricao: string;
  quantidade: number;
  unidade: string;
  valor_unitario: number;
  valor_total: number;
}

export type QuoteRow = Omit<Database["public"]["Tables"]["quotes"]["Row"], "itens" | "campos_customizados"> & {
  itens: QuoteItem[];
  campos_customizados: CustomFieldValues;
};

export type ContractRow = Omit<
  Database["public"]["Tables"]["contracts"]["Row"],
  "campos" | "campos_customizados"
> & {
  campos: Record<string, unknown>;
  campos_customizados: CustomFieldValues;
};

export type TemplateRow = Omit<Database["public"]["Tables"]["templates"]["Row"], "campos_customizados"> & {
  campos_customizados: CustomFieldValues;
};

export type ActivityLogRow = Omit<Database["public"]["Tables"]["activity_log"]["Row"], "detalhe"> & {
  detalhe: Record<string, unknown> | null;
};

export type FinanceSyncLogRow = Omit<Database["public"]["Tables"]["finance_sync_log"]["Row"], "payload"> & {
  payload: Record<string, unknown> | null;
};

export interface CustomFieldOption {
  valor: string;
  rotulo: string;
}

export type CustomFieldDefinitionRow = Omit<
  Database["public"]["Tables"]["custom_field_definitions"]["Row"],
  "opcoes"
> & {
  opcoes: CustomFieldOption[];
};
