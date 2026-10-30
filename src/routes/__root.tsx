import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ir para o início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error instanceof Error ? error : new Error(String(error)), { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Ocorreu um erro ao carregar a página
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo deu errado. Tente recarregar ou voltar ao início.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Ir para o início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Salão Santa Felicidade" },
      { name: "description", content: "Gestão de eventos, reservas, contratos e disponibilidade do Salão Santa Felicidade." },
      { name: "application-name", content: "Salão Santa Felicidade" },
      { property: "og:title", content: "Salão Santa Felicidade" },
      { property: "og:description", content: "Consulte disponibilidade e gerencie reservas e eventos do Salão Santa Felicidade." },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "canonical", href: "https://salaodefestaapp.lovable.app" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Toaster />
        <Scripts />
      </body>
    </html>
  );
}

import { usePermissions } from "@/hooks/use-permissions";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthCheckWrapper>
        <Outlet />
      </AuthCheckWrapper>
    </QueryClientProvider>
  );
}

function AuthCheckWrapper({ children }: { children: ReactNode }) {
  const { session, isLoading, isMaster, isCustomer, isCommon, timeoutReached } = usePermissions();
  const navigate = useNavigate();
  const [pathname, setPathname] = useState(() => (
    typeof window !== "undefined" ? window.location.pathname : ""
  ));

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPathname(window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const currentPath = typeof window !== "undefined" ? window.location.pathname : pathname;
      const isLoginRoute = currentPath.startsWith("/login");
      const isPublicRoute = currentPath.startsWith("/agendamentos") || currentPath.startsWith("/auth");
      
      if (!session && !isLoginRoute && !isPublicRoute) {
        navigate({ to: "/login" });
      } else if (session && isLoginRoute) {
        if (isCustomer || isCommon) {
          navigate({ to: "/meus-contratos" });
        } else if (isMaster) {
          navigate({ to: "/dashboard" });
        } else {
          navigate({ to: "/meus-contratos" });
        }
      }
    }
  }, [session, isLoading, isCustomer, isCommon, isMaster, pathname, navigate]);

  if (isLoading && !timeoutReached) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3 text-center px-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">Carregando informações da sua conta...</p>
        </div>
      </div>
    );
  }

  if (timeoutReached) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4 text-center px-4 max-w-md">
          <div className="rounded-full bg-destructive/10 p-3 text-destructive">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold">Tempo limite esgotado</h2>
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar as informações da sua conta a tempo. Verifique sua conexão ou entre novamente.
          </p>
          <button
            onClick={async () => {
              try {
                await supabase.auth.signOut({ scope: 'local' });
              } catch {}
              navigate({ to: "/login" });
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Entrar novamente
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
