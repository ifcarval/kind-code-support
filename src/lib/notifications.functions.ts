import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const sendReminder = createServerFn({ method: "POST" })
  .inputValidator((data) => 
    z.object({ 
      invoiceId: z.string(), 
      templateId: z.string() 
    }).parse(data)
  )
  .handler(async ({ data }) => {
    // 1. Buscar fatura e detalhes do cliente
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select(`
        *,
        client:clients(*)
      `)
      .eq("id", data.invoiceId)
      .single();

    if (invoiceError || !invoice) {
      throw new Error("Fatura não encontrada");
    }

    // 2. Buscar template
    const { data: template, error: templateError } = await supabase
      .from("message_templates")
      .select("*")
      .eq("id", data.templateId)
      .single();

    if (templateError || !template) {
      throw new Error("Template não encontrado");
    }

    // 3. Processar variáveis do template
    let content = template.content;
    const replacements: Record<string, string> = {
      "{cliente}": invoice.client?.nome_razao_social || "Cliente",
      "{valor}": new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(invoice.valor_final),
      "{vencimento}": new Date(invoice.data_vencimento).toLocaleDateString("pt-BR"),
      "{numero}": invoice.numero_fatura || "S/N",
    };

    Object.keys(replacements).forEach((tag) => {
      const value = replacements[tag] || "";
      content = content.split(tag).join(value);
    });

    // 4. Simular envio (em um cenário real, chamaria API do WhatsApp ou E-mail)
    console.log(`[REMINDER SENT] To: ${invoice.client?.nome_razao_social}, Content: ${content}`);

    // 5. Atualizar data do último envio
    await supabase
      .from("invoices")
      .update({ last_reminder_sent_at: new Date().toISOString() })
      .eq("id", data.invoiceId);

    return { 
      success: true, 
      message: "Lembrete enviado com sucesso!",
      processedContent: content 
    };
  });
