import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const processContractFile = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ 
    fileUrl: z.string(),
    fileName: z.string() 
  }).parse(data))
  .handler(async ({ data }) => {
    // Nota: Em um ambiente real, baixaríamos o arquivo do Supabase Storage
    // e enviaríamos para a IA. Para este MVP, simularemos a extração de dados
    // baseada no nome do arquivo ou conteúdo simulado, integrando com o AI Gateway.
    
    // Simulação de processamento por IA (aqui entraríamos com o ai_gateway)
    // Para o demo, retornaremos dados fictícios que o usuário poderá revisar.
    
    console.log("Processando contrato:", data.fileName);
    
    // Simular delay de processamento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: true,
      extractedData: {
        clientName: "Cliente Extraído da IA",
        cpfCnpj: "12.345.678/0001-90",
        serviceName: "Social Media",
        monthlyValue: 1250.00,
        dueDay: 10,
        startDate: new Date().toISOString().split('T')[0]
      }
    };
  });
