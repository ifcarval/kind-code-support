# Plan: Advanced Dashboards & Analytics Integration

Implement advanced analytics views integration, charts, and new dashboard components based on Phase 6 requirements.

## 1. Security & Infrastructure
- Finalize security hardening for functions by revoking all non-essential execution privileges.
- Verify view access for authenticated users.

## 2. Frontend: Data Layer
- Expand `useDashboardStats` hook to fetch data from:
  - `monthly_revenue_history` (12 months)
  - `billing_status_distribution`
  - `top_clients_revenue`
  - `profitable_services`
  - `delinquent_clients`
  - `advanced_dashboard_stats`
  - `upcoming_due_dates`

## 3. Frontend: UI Components
- **Charts**:
  - Line Chart for Monthly Revenue History (Projected vs Received).
  - Pie Chart for Billing Status Distribution.
  - Bar Chart for Top Clients / Services.
- **Metric Cards**:
  - Average Ticket (Ticket Médio).
  - Delinquency Rate (Taxa de Inadimplência).
  - Total Overdue Amount.
- **Lists/Tables**:
  - Upcoming due dates section.
  - Delinquent clients summary.

## 4. Layout Improvements
- Make the Sidebar collapsible.
- Ensure responsive design for charts and tables.

## Technical Details
- Uses `recharts` for data visualization.
- Multi-tenant data isolation via existing RLS on views.
- `security_invoker` views ensure users only see their company's data.
