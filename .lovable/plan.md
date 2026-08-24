# Plan: Lifetime Access for Igor and Admin Area

This plan implements lifetime access rules for the user `igor.felipe76@gmail.com` and creates a new Administrative Area for managing users, subscriptions, and trials.

## User Experience

- **Lifetime User (Igor)**:
  - Automatic "Owner" role with "Lifetime" subscription status.
  - No trial banners, no payment screens, no blocking.
  - Monthly fee shown as R$ 0.00.
  - Full access to all modules including a new "Admin Area".
- **Admin Area**:
  - Accessible only to the Lifetime Administrator.
  - Table view of all users with their profile, company, trial status, and subscription details.
  - Ability to manage system-wide settings.

## Technical Details

### Database Changes (Migration)

1. **New Table `app_admins`**:
   - Stores user IDs that have system-wide administrative access.
   - Seed `igor.felipe76@gmail.com`'s ID into this table.
2. **Database Function `public.is_lifetime_admin(user_id uuid)`**:
   - Returns boolean if user is in `app_admins` or has specific email.
3. **RLS Policy Updates**:
   - Ensure policies allow Lifetime Admin to read all data in `profiles` and `companies`.

### Frontend Logic

1. **`use-profile.ts`**:
   - Add `isLifetimeAdmin` boolean.
   - Detect lifetime status from company data.
2. **`AppLayout.tsx`**:
   - Add "Área Admin" to sidebar for Lifetime Admin.
   - Update `navItems` logic.
3. **`Dashboard.tsx`**:
   - Hide trial banner if company status is 'vitalicia'.
4. **New Route `src/routes/admin/users.tsx`**:
   - Table displaying all users, emails, roles, trial end dates, and subscription status.
5. **Route Guards**:
   - Update access checks to account for lifetime status (bypassing trial/payment checks).

### Automation Logic

1. **Billing Edge Function (Update)**:
   - Skip invoice generation or set amount to 0 for companies with `subscription_status = 'vitalicia'`.

## Implementation Steps

1. **Database Migration**:
   - Add `app_admins` table.
   - Create `is_lifetime_admin` function.
   - Set Igor's company status to 'vitalicia' and trial_ends_at to null.
2. **Hook Updates**:
   - Update `useProfile` to include `isLifetimeAdmin`.
3. **Layout & Navigation**:
   - Update `AppLayout` to show Admin menu.
4. **Admin Route**:
   - Create `src/routes/admin/users.tsx`.
5. **Logic Guards**:
   - Refactor Dashboard and Billing views to respect lifetime status.
