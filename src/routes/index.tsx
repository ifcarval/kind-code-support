import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Novo Projeto
        </h1>
        <p className="text-muted-foreground">
          Projeto limpo e pronto para a criação do seu novo aplicativo.
        </p>
      </div>
    </div>
  );
}
