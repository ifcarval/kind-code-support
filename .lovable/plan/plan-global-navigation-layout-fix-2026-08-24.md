# Plan: Global Navigation Layout Fix

Fix the system's navigation layout to ensure the sidebar remains fixed and visible across all pages, avoiding isolated screens for different modules.

## User Review Required

> [!IMPORTANT]
> The sidebar will be moved from individual routes to a global layout component to ensure persistence and consistent state (like collapse/expand) across all sections of the app.

- **Sidebar persistence**: The sidebar will no longer "disappear" or reset when switching between Dashboard, Clients, Services, etc.
- **Layout Consistency**: All pages will share a unified structure: Sidebar on the left, Header + Scrollable Content on the right.

## Proposed Changes

### New Components
#### [NEW] `src/components/AppLayout.tsx`
- Create a unified layout component that includes the sidebar and main content area.
- Logic for sidebar collapse/expand.
- Navigation links for all modules (Dashboard, Faturamento, Clientes, Catálogo, Serviços Contratados, Configurações).
- Profile/Sign out logic moved here.

### Refactoring Routes
#### `src/routes/_authenticated.tsx` (or `src/routes/_authenticated/route.tsx`)
- If not already present, create a pathless layout route to wrap all protected pages with `AppLayout`.

#### `src/routes/index.tsx`
- Extract the `Dashboard` component's sidebar and header logic into `AppLayout`.
- Update `IndexPage` to only render the auth check; if authenticated, render the dashboard content within `AppLayout`.

#### `src/routes/clients.tsx`, `src/routes/services.tsx`, `src/routes/contracted-services.tsx`, `src/routes/billing.tsx`, `src/routes/settings.tsx`
- Remove redundant sidebar/layout logic from these files.
- Ensure they only render their specific content, which will be injected into `AppLayout` via `<Outlet />`.

### Database & Hooks
- No changes required.

## Technical Details

1. **Pathless Layout**: Use TanStack Router's pathless layout (e.g., `_authenticated`) to wrap all routes that require the sidebar.
2. **State Management**: The sidebar's collapsed state can be managed in `AppLayout` or a simple state hook if we want it to persist across reloads (e.g., localStorage).
3. **Responsive Design**: Maintain the mobile-friendly behavior (collapsible sidebar).

```text
Global Layout Structure:
+---------------------------------------+
| Sidebar | Header                      |
| (Fixed) | (Breadcrumbs/User)          |
|         +-----------------------------+
|         |                             |
|         | Content (Outlet)            |
|         | (Scrollable)                |
|         |                             |
+---------+-----------------------------+
```
