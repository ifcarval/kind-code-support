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
      client_services: {
        Row: {
          client_id: string
          company_id: string
          created_at: string | null
          data_fim: string | null
          data_inicio: string
          descricao: string | null
          dia_vencimento: number | null
          id: string
          nome_servico: string
          observacoes: string | null
          renovacao_automatica: boolean | null
          service_id: string
          status: Database["public"]["Enums"]["client_service_status"] | null
          tipo_cobranca: Database["public"]["Enums"]["billing_type"]
          updated_at: string | null
          valor_mensal: number
        }
        Insert: {
          client_id: string
          company_id: string
          created_at?: string | null
          data_fim?: string | null
          data_inicio: string
          descricao?: string | null
          dia_vencimento?: number | null
          id?: string
          nome_servico: string
          observacoes?: string | null
          renovacao_automatica?: boolean | null
          service_id: string
          status?: Database["public"]["Enums"]["client_service_status"] | null
          tipo_cobranca: Database["public"]["Enums"]["billing_type"]
          updated_at?: string | null
          valor_mensal: number
        }
        Update: {
          client_id?: string
          company_id?: string
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string
          descricao?: string | null
          dia_vencimento?: number | null
          id?: string
          nome_servico?: string
          observacoes?: string | null
          renovacao_automatica?: boolean | null
          service_id?: string
          status?: Database["public"]["Enums"]["client_service_status"] | null
          tipo_cobranca?: Database["public"]["Enums"]["billing_type"]
          updated_at?: string | null
          valor_mensal?: number
        }
        Relationships: [
          {
            foreignKeyName: "client_services_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "advanced_dashboard_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "client_services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "client_services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "monthly_revenue_history"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "client_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          cep: string | null
          cidade: string | null
          company_id: string
          contato_principal: string | null
          cpf_cnpj: string | null
          created_at: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome_fantasia: string | null
          nome_razao_social: string
          observacoes: string | null
          status: Database["public"]["Enums"]["client_status"] | null
          telefone: string | null
          telefone_secundario: string | null
          tipo_pessoa: string | null
          updated_at: string | null
        }
        Insert: {
          cep?: string | null
          cidade?: string | null
          company_id: string
          contato_principal?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome_fantasia?: string | null
          nome_razao_social: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["client_status"] | null
          telefone?: string | null
          telefone_secundario?: string | null
          tipo_pessoa?: string | null
          updated_at?: string | null
        }
        Update: {
          cep?: string | null
          cidade?: string | null
          company_id?: string
          contato_principal?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome_fantasia?: string | null
          nome_razao_social?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["client_status"] | null
          telefone?: string | null
          telefone_secundario?: string | null
          tipo_pessoa?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "advanced_dashboard_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "monthly_revenue_history"
            referencedColumns: ["company_id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          auto_reminders_enabled: boolean | null
          cnpj: string | null
          created_at: string | null
          currency: string | null
          date_format: string | null
          due_day_default: number | null
          email: string | null
          endereco: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string | null
          whatsapp_enabled: boolean | null
        }
        Insert: {
          address?: string | null
          auto_reminders_enabled?: boolean | null
          cnpj?: string | null
          created_at?: string | null
          currency?: string | null
          date_format?: string | null
          due_day_default?: number | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string | null
          whatsapp_enabled?: boolean | null
        }
        Update: {
          address?: string | null
          auto_reminders_enabled?: boolean | null
          cnpj?: string | null
          created_at?: string | null
          currency?: string | null
          date_format?: string | null
          due_day_default?: number | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string | null
          whatsapp_enabled?: boolean | null
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string | null
          descricao: string
          id: string
          invoice_id: string
          quantidade: number | null
          valor_total: number
          valor_unitario: number
        }
        Insert: {
          created_at?: string | null
          descricao: string
          id?: string
          invoice_id: string
          quantidade?: number | null
          valor_total: number
          valor_unitario: number
        }
        Update: {
          created_at?: string | null
          descricao?: string
          id?: string
          invoice_id?: string
          quantidade?: number | null
          valor_total?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_id: string
          client_service_id: string | null
          company_id: string
          competencia: string
          comprovante_url: string | null
          created_at: string | null
          data_emissao: string | null
          data_pagamento: string | null
          data_vencimento: string
          desconto: number | null
          descricao: string | null
          forma_pagamento: Database["public"]["Enums"]["payment_method"] | null
          id: string
          juros: number | null
          last_reminder_sent_at: string | null
          multa: number | null
          numero_fatura: string
          observacoes: string | null
          status: Database["public"]["Enums"]["invoice_status"] | null
          updated_at: string | null
          valor_final: number
          valor_original: number
        }
        Insert: {
          client_id: string
          client_service_id?: string | null
          company_id: string
          competencia: string
          comprovante_url?: string | null
          created_at?: string | null
          data_emissao?: string | null
          data_pagamento?: string | null
          data_vencimento: string
          desconto?: number | null
          descricao?: string | null
          forma_pagamento?: Database["public"]["Enums"]["payment_method"] | null
          id?: string
          juros?: number | null
          last_reminder_sent_at?: string | null
          multa?: number | null
          numero_fatura: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          updated_at?: string | null
          valor_final: number
          valor_original: number
        }
        Update: {
          client_id?: string
          client_service_id?: string | null
          company_id?: string
          competencia?: string
          comprovante_url?: string | null
          created_at?: string | null
          data_emissao?: string | null
          data_pagamento?: string | null
          data_vencimento?: string
          desconto?: number | null
          descricao?: string | null
          forma_pagamento?: Database["public"]["Enums"]["payment_method"] | null
          id?: string
          juros?: number | null
          last_reminder_sent_at?: string | null
          multa?: number | null
          numero_fatura?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          updated_at?: string | null
          valor_final?: number
          valor_original?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_service_id_fkey"
            columns: ["client_service_id"]
            isOneToOne: false
            referencedRelation: "client_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "advanced_dashboard_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "monthly_revenue_history"
            referencedColumns: ["company_id"]
          },
        ]
      }
      message_templates: {
        Row: {
          company_id: string
          content: string
          created_at: string
          days_offset: number
          id: string
          name: string
          trigger_type: Database["public"]["Enums"]["reminder_trigger_type"]
          updated_at: string
        }
        Insert: {
          company_id: string
          content: string
          created_at?: string
          days_offset?: number
          id?: string
          name: string
          trigger_type?: Database["public"]["Enums"]["reminder_trigger_type"]
          updated_at?: string
        }
        Update: {
          company_id?: string
          content?: string
          created_at?: string
          days_offset?: number
          id?: string
          name?: string
          trigger_type?: Database["public"]["Enums"]["reminder_trigger_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "advanced_dashboard_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "message_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "message_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "monthly_revenue_history"
            referencedColumns: ["company_id"]
          },
        ]
      }
      payments: {
        Row: {
          company_id: string
          created_at: string | null
          data_pagamento: string | null
          forma_pagamento: Database["public"]["Enums"]["payment_method"]
          id: string
          invoice_id: string
          observacoes: string | null
          referencia_pagamento: string | null
          valor_pago: number
        }
        Insert: {
          company_id: string
          created_at?: string | null
          data_pagamento?: string | null
          forma_pagamento: Database["public"]["Enums"]["payment_method"]
          id?: string
          invoice_id: string
          observacoes?: string | null
          referencia_pagamento?: string | null
          valor_pago: number
        }
        Update: {
          company_id?: string
          created_at?: string | null
          data_pagamento?: string | null
          forma_pagamento?: Database["public"]["Enums"]["payment_method"]
          id?: string
          invoice_id?: string
          observacoes?: string | null
          referencia_pagamento?: string | null
          valor_pago?: number
        }
        Relationships: [
          {
            foreignKeyName: "payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "advanced_dashboard_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "monthly_revenue_history"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cargo: string | null
          company_id: string | null
          created_at: string | null
          email: string
          empresa: string | null
          full_name: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          cargo?: string | null
          company_id?: string | null
          created_at?: string | null
          email: string
          empresa?: string | null
          full_name?: string | null
          id: string
          nome: string
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          cargo?: string | null
          company_id?: string | null
          created_at?: string | null
          email?: string
          empresa?: string | null
          full_name?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "advanced_dashboard_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "monthly_revenue_history"
            referencedColumns: ["company_id"]
          },
        ]
      }
      services: {
        Row: {
          ativo: boolean | null
          categoria: string | null
          company_id: string
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          recorrente: boolean | null
          tipo_cobranca: Database["public"]["Enums"]["billing_type"] | null
          updated_at: string | null
          valor_padrao: number | null
        }
        Insert: {
          ativo?: boolean | null
          categoria?: string | null
          company_id: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          recorrente?: boolean | null
          tipo_cobranca?: Database["public"]["Enums"]["billing_type"] | null
          updated_at?: string | null
          valor_padrao?: number | null
        }
        Update: {
          ativo?: boolean | null
          categoria?: string | null
          company_id?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          recorrente?: boolean | null
          tipo_cobranca?: Database["public"]["Enums"]["billing_type"] | null
          updated_at?: string | null
          valor_padrao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "advanced_dashboard_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "monthly_revenue_history"
            referencedColumns: ["company_id"]
          },
        ]
      }
    }
    Views: {
      advanced_dashboard_stats: {
        Row: {
          average_ticket: number | null
          company_id: string | null
          delinquency_rate: number | null
          total_clients: number | null
          total_overdue_amount: number | null
          total_services: number | null
        }
        Insert: {
          average_ticket?: never
          company_id?: string | null
          delinquency_rate?: never
          total_clients?: never
          total_overdue_amount?: never
          total_services?: never
        }
        Update: {
          average_ticket?: never
          company_id?: string | null
          delinquency_rate?: never
          total_clients?: never
          total_overdue_amount?: never
          total_services?: never
        }
        Relationships: []
      }
      billing_status_distribution: {
        Row: {
          company_id: string | null
          count: number | null
          status: Database["public"]["Enums"]["invoice_status"] | null
          total_amount: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "advanced_dashboard_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "monthly_revenue_history"
            referencedColumns: ["company_id"]
          },
        ]
      }
      dashboard_stats: {
        Row: {
          active_clients: number | null
          active_services: number | null
          company_id: string | null
          monthly_revenue_projected: number | null
          monthly_revenue_received: number | null
        }
        Insert: {
          active_clients?: never
          active_services?: never
          company_id?: string | null
          monthly_revenue_projected?: never
          monthly_revenue_received?: never
        }
        Update: {
          active_clients?: never
          active_services?: never
          company_id?: string | null
          monthly_revenue_projected?: never
          monthly_revenue_received?: never
        }
        Relationships: []
      }
      delinquent_clients: {
        Row: {
          client_name: string | null
          company_id: string | null
          overdue_count: number | null
          total_overdue: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "advanced_dashboard_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "monthly_revenue_history"
            referencedColumns: ["company_id"]
          },
        ]
      }
      monthly_billing_history: {
        Row: {
          company_id: string | null
          competencia: string | null
          invoice_count: number | null
          total_paid: number | null
          total_projected: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "advanced_dashboard_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "monthly_revenue_history"
            referencedColumns: ["company_id"]
          },
        ]
      }
      monthly_revenue_history: {
        Row: {
          company_id: string | null
          month: string | null
          projected: number | null
          received: number | null
        }
        Relationships: []
      }
      profitable_services: {
        Row: {
          active_contracts: number | null
          company_id: string | null
          monthly_revenue: number | null
          service_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "advanced_dashboard_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "monthly_revenue_history"
            referencedColumns: ["company_id"]
          },
        ]
      }
      top_clients_revenue: {
        Row: {
          client_name: string | null
          company_id: string | null
          invoice_count: number | null
          total_projected: number | null
          total_received: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "advanced_dashboard_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "monthly_revenue_history"
            referencedColumns: ["company_id"]
          },
        ]
      }
      upcoming_due_dates: {
        Row: {
          client_name: string | null
          company_id: string | null
          data_vencimento: string | null
          days_until: number | null
          status: Database["public"]["Enums"]["invoice_status"] | null
          valor_final: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "advanced_dashboard_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "monthly_revenue_history"
            referencedColumns: ["company_id"]
          },
        ]
      }
    }
    Functions: {
      generate_manual_invoice_from_contract: {
        Args: { _contract_id: string }
        Returns: string
      }
      generate_monthly_invoices:
        | { Args: { _target_month: string }; Returns: number }
        | { Args: { p_company_id?: string }; Returns: number }
    }
    Enums: {
      billing_type:
        | "mensal"
        | "trimestral"
        | "semestral"
        | "anual"
        | "avulsa"
        | "personalizada"
      client_service_status: "ativo" | "pausado" | "cancelado" | "finalizado"
      client_status: "ativo" | "inativo" | "bloqueado"
      invoice_status:
        | "rascunho"
        | "pendente"
        | "vencida"
        | "paga"
        | "cancelada"
        | "renegociada"
      payment_method:
        | "pix"
        | "boleto"
        | "cartao"
        | "transferencia"
        | "dinheiro"
        | "outro"
      reminder_trigger_type: "due_soon" | "overdue" | "manual"
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
      billing_type: [
        "mensal",
        "trimestral",
        "semestral",
        "anual",
        "avulsa",
        "personalizada",
      ],
      client_service_status: ["ativo", "pausado", "cancelado", "finalizado"],
      client_status: ["ativo", "inativo", "bloqueado"],
      invoice_status: [
        "rascunho",
        "pendente",
        "vencida",
        "paga",
        "cancelada",
        "renegociada",
      ],
      payment_method: [
        "pix",
        "boleto",
        "cartao",
        "transferencia",
        "dinheiro",
        "outro",
      ],
      reminder_trigger_type: ["due_soon", "overdue", "manual"],
    },
  },
} as const
