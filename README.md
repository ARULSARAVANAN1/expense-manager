# Expense & Finance Manager

A full-stack expense and finance management application built while learning React and Node.js.

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- React Router

### Backend
- Node.js
- Express
- TypeScript

### Database
- PostgreSQL
- Prisma

## Features

- User registration and login
- JWT authentication
- Expense tracking
- Income tracking
- Categories
- Accounts
- Budgets
- Reports
- Dashboard

## Project Structure

```text
client/
server/
```

## UI

The application uses a light green theme with white cards, mint surfaces, and
dark green primary actions for readable contrast. Shared buttons include
consistent rounded corners, spacing, hover/pressed feedback, visible keyboard
focus, and disabled states. Destructive actions stay red; income/expense
semantics and category-specific colors remain distinct.
Login and signup share decorative expense illustrations with gentle floating
motion and pointer parallax. Decorations never intercept form interaction,
are hidden from assistive technology, simplify on mobile, and respect reduced
motion preferences. Illustrations are decorative, not actual financial data.

## Google sign-in setup

The login page integrates Google Identity Services via `@react-oauth/google`.
Email/password login remains available. Without configuration, a disabled
Google sign-in placeholder explains that setup is required.

1. In Google Cloud, configure the OAuth consent screen and create an OAuth
   client of type **Web application**. Add the exact frontend origin (for
   example `http://localhost:5173`) to Authorized JavaScript origins. Add test
   users if the consent screen is in testing mode.
2. Set `VITE_GOOGLE_CLIENT_ID=your-public-client-id.apps.googleusercontent.com`
   in your local Vite environment and restart the dev server. This public
   client ID is safe for the frontend; never put client secrets in Vite variables.
3. Implement `POST /auth/google` on the existing API base URL. The frontend
   sends `{ "credential": "<Google ID token>" }`. The proposed success response
   matches email login:
   `{ "success": true, "data": { "token": "<app JWT>", "user": { "id": "...", "name": "...", "email": "..." } } }`.
   Return a non-2xx response with `{ "message": "..." }` for failures.
4. On the backend, use Google's official authentication library to verify the
   token signature, expiry, issuer, and audience against your Google client ID.
   Require a verified email, identify Google accounts by their stable `sub`,
   and create or locate the app user. Do not silently link an existing
   password account solely by email; require an authenticated linking flow.
   Issue the app's normal JWT so `/auth/me` and existing protected routes work.
5. Apply normal login rate limiting and configure CORS for your frontend origins.
   Use HTTPS in production and update Google origins to the deployed URL.

The frontend never treats a decoded Google token as an app session; only the
backend-issued app token is stored through the existing authentication flow.
Backend implementation and real Google credentials are not included here.

The finance workspace uses shared inline SVG icons with semantic colors: green
for income, red for destructive actions, blue for primary actions, and distinct
category colors. Category management includes an icon picker and live preview;
existing custom category icons remain supported. Hover and focus feedback
respects the device's reduced-motion preference. All currency values use INR.
Financial text uses consistent semantic colors: income is green and expenses
are red. Remaining budgets and spending changes reflect their financial impact;
budget usage is green below 80%, amber from 80%, and red at or above the limit.
Labels and status text remain visible so meaning does not rely on color alone.

The app shell includes color-coded navigation, a sticky topbar with quick expense
entry, and a compact account identity. On mobile, navigation opens as a drawer
with keyboard focus containment, Escape/backdrop dismissal, and scroll locking.
A skip link provides direct keyboard access to page content.

All date and month selection uses the free, MIT-licensed `react-datepicker`
calendar, including filters, transaction forms, budgets, and the dashboard.
Expense analysis supports a daily view for a chosen month and a monthly view
for a chosen year; selecting a point or bar filters the transaction list.

Recurring expenses are user-scoped local schedules, not bank payments or a
server scheduler. Opening the signed-in app creates due monthly expenses and
catches up missed months through today. Billing dates on the 29th–31st clamp
to the last valid day of shorter months. Optional end months are inclusive.
Generated transactions use stable per-schedule/month IDs and a persisted
completion cursor to avoid duplicates and preserve edits/deletions. Schedule
changes affect future entries only; deleting a schedule keeps existing expenses.
Accounts/categories referenced by schedules cannot be deleted.

The profile page is accessible from both account identities and navigation.
It shows the current account, without an account-switching action.
Email is non-editable, the display name can be drafted, and password fields appear
only after selecting Change password. Profile saving
and password changes are explicitly disabled until their backend routes,
request/response contracts, validation rules, and session behavior are supplied.
Passwords are never simulated or persisted in local storage.
The preferred-currency selector is intended for backend userinfo persistence
and remains unsavable until the update endpoint and currency field are provided.
It is a preference only: existing amounts continue to display in INR without
conversion. No local-storage substitute is used for this preference.
User information appears first, followed by compact name and currency cards.
One shared Save profile action is reserved for the single user-update endpoint;
password changes use a separate action and endpoint.

The header account control highlights on hover and opens profile/logout options.
It supports keyboard and touch interaction, outside-click dismissal, and Escape
to close and return focus to the account control.

The dashboard is month-focused: compact summary cards appear first, followed by
searchable, expandable recent expense transactions, then daily spending and
category charts. Daily spending uses a smooth gradient area chart with INR
tooltips and day selection to open matching expenses. The month picker updates
every section. Income remains a
summary metric rather than an income-versus-expenses chart.