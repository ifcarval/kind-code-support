import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header Simples */}
      <header className="border-b bg-card px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Gestão de Serviços</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Demonstração Backend</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-12">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Status Section */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Infraestrutura Pronta</h2>
              <p className="text-lg text-muted-foreground">
                O backend do sistema de gestão e cobranças foi implementado com sucesso seguindo todas as especificações.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <div className="text-sm font-medium text-muted-foreground">Banco de Dados</div>
                <div className="mt-1 text-2xl font-bold text-green-600">Ativo</div>
                <div className="mt-1 text-xs text-muted-foreground">PostgreSQL + RLS</div>
              </div>
              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <div className="text-sm font-medium text-muted-foreground">Automação</div>
                <div className="mt-1 text-2xl font-bold text-green-600">Configurada</div>
                <div className="mt-1 text-xs text-muted-foreground">Cobranças Recorrentes</div>
              </div>
            </div>

            <div className="space-y-4 rounded-xl border bg-card p-6 shadow-md">
              <h3 className="font-semibold text-foreground">O que foi construído:</h3>
              <ul className="space-y-3">
                {[
                  "Estrutura multi-empresa com isolamento total via RLS",
                  "Gestão completa de Clientes, Serviços e Contratos",
                  "Motor de faturamento automático mensal",
                  "Sistema de pagamentos (integrais e parciais)",
                  "Dados de exemplo semeados para demonstração",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1 rounded-full bg-green-100 p-1">
                      <svg className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action/Next Steps Section */}
          <div className="flex flex-col justify-center space-y-8 rounded-2xl bg-muted/50 p-8">
            <div className="space-y-4 text-center">
              <div className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                Próxima Fase: Interface
              </div>
              <h3 className="text-2xl font-bold text-foreground">Pronto para a Interface</h3>
              <p className="text-muted-foreground">
                Toda a lógica de negócios e segurança está agora operando no Lovable Cloud. 
                Podemos começar a construir as telas de Dashboard e Gestão.
              </p>
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Próximos passos recomendados:
              </div>
              <div className="grid gap-2">
                <button className="flex w-full items-center justify-between rounded-lg border bg-card px-4 py-3 text-left transition-hover hover:bg-accent/50">
                  <div className="font-medium">Construir o Dashboard</div>
                  <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button className="flex w-full items-center justify-between rounded-lg border bg-card px-4 py-3 text-left transition-hover hover:bg-accent/50">
                  <div className="font-medium">Criar Gestão de Clientes</div>
                  <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card py-6 text-center text-sm text-muted-foreground">
        © 2026 Sistema de Gestão e Cobrança • Backend v1.0
      </footer>
    </div>
  );
}
