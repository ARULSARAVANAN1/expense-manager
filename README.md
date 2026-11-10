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
- Financial goals and contribution history

## Project Structure

```text
client/
server/
```

## UI

The application supports Light, Dark, and System appearance from the topbar
account menu and the login/signup appearance selector. System appearance follows
OS changes live. The preference persists across refreshes and synchronizes across
tabs; a synchronous initialization script sets the root `data-theme` before the
app renders to avoid a flash of the wrong theme.

All UI colors, typography, spacing, radii, and shadows come from semantic CSS
custom properties in `src/styles/variables.css`; shared typography and controls
live in `src/styles/global.css`. Use these tokens rather than component-local
color literals. `ThemeProvider` owns appearance state and `useTheme()` exposes it
without per-page theme state. Inter uses system fallbacks, and financial amounts
use tabular numerals. Standard category colors are shared by charts and category
icons across Dashboard and Reports; custom categories retain their chosen color.
Shared buttons include hover/pressed feedback, visible keyboard focus, and
disabled states. Destructive actions stay red; income/expense semantics remain
distinct in both themes. Dark surfaces use thin borders and minimal shadows.
Login and signup share decorative expense illustrations with gentle floating
motion and pointer parallax. Decorations never intercept form interaction,
are hidden from assistive technology, simplify on mobile, and respect reduced
motion preferences. Illustrations are decorative, not actual financial data.

## Google sign-in setup

The frontend uses the documented API at `http://localhost:3000/api` by default.
Set `VITE_API_BASE_URL` when the backend runs at a different origin or base path,
then restart Vite. Finance records are loaded from and saved to the API; only the
application session token and appearance preference are kept in local storage.

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
3. The API exposes `POST /auth/google` at the configured API base URL. The
   frontend sends `{ "credential": "<Google ID token>" }`. Its success response
   matches email login:
   `{ "success": true, "data": { "token": "<app JWT>", "user": { "id": "...", "name": "...", "email": "..." } } }`.
   API errors are shown to the user.
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
Real Google credentials are not included here.

The finance workspace uses shared inline SVG icons with semantic colors: green
for income, red for destructive actions, indigo for primary actions, and distinct
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

Quick expense accepts text or a bill image (PNG, JPG, and other image formats)
up to 2 MB (2,097,152 bytes), with optional text details. Empty files and
non-image files are rejected before upload. Text-only requests continue to use
JSON at `POST /expenses/parse`; image requests use the same endpoint with
`multipart/form-data`, an `image` file field, and an optional `text` field.
Both return the existing expense draft and clarification response for review;
nothing is saved automatically. The backend must also validate image content
and enforce the size limit.
The AI-assisted composer includes keyboard/touch-accessible information
tooltips, image drag-and-drop, and an attachment card with a local thumbnail,
file size, replace, and remove actions. Selecting a file does not upload it;
Create draft sends it for parsing. Invalid replacements keep the current bill.

All date and month selection uses the free, MIT-licensed `react-datepicker`
calendar, including filters, transaction forms, budgets, and the dashboard.
Expense analysis supports a daily view for a chosen month and a monthly view
for a chosen year; selecting a point or bar filters the transaction list.

The API currently does not expose recurring-expense or shared-expense routes.
Those pages explain the limitation and do not save finance data in browser
storage.

Financial goals use the authenticated `/goals` API for listing, creation,
editing, deletion, pause/resume, and contribution history. Goal and contribution
lists load every page using `page` and `limit` with top-level `pagination`.
API category, priority, status, and progress-status enums are mapped to UI labels.
Starting savings are sent as `initialSavedAmount` only when creating a goal;
later balance changes are recorded through contributions. Goal amounts and
progress are refreshed from the server after contributions, never calculated
as a replacement for persisted data. Existing browser-only sample goals are
not imported or used as a fallback. The what-if planner and current plan
suggestions remain local estimates, not AI-generated API recommendations.

The profile page is accessible from both account identities and navigation.
It shows the current account, without an account-switching action.
Email is non-editable; display name and preferred currency are saved through the
profile API, and password changes use the separate password endpoint. Passwords
are never persisted in browser storage. Preferred currency is a preference only:
existing amounts continue to display in INR without conversion.
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
The dashboard initially shows an AI invitation card without requesting a summary.
Selecting **Generate insights** requests `POST /summaries/monthly` with
`{ "month": "YYYY-MM" }` for the selected month and starts the AI loader.
Changing the month or user resets the card to the invitation state.
Its monthly insights card displays the API's
`card.greeting`, `card.introduction`, and `card.insights`, with distinct trend,
saving, and progress icons. It loads independently of finance records, offers
retry on errors, and cancels outdated requests when the month or user changes.
While waiting, an animated AI indicator and insight skeletons keep the card
structured; polite status messages acknowledge longer waits without claiming
measured progress. Animations respect reduced-motion preferences.
AI-generated insights are labeled and do not replace the recorded summary totals.
The Balance summary shows selected-month recorded income minus expenses,
green when positive and red when negative. It is separate from the
safe-to-spend estimate, which also reserves budget and recurring commitments.