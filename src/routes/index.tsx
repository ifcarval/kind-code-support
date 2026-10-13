import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

import { AppLayout } from "@/components/AppLayout";
import { Dashboard } from "@/components/Dashboard";

function IndexPage() {
  return (
    <AppLayout>
      <Dashboard />
    </AppLayout>
  );
}
