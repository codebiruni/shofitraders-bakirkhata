# Borrow Ledger (Shofi Traders বাকির খাতা)

## Stack
- Next.js **16.3.2** App Router + TypeScript, MongoDB driver (no ODM), next-auth **v4** (credentials: env `AUTH_USERNAME`, `AUTH_PASSWORD_HASH` bcrypt, `NEXTAUTH_SECRET`), react-hot-toast, daisyui v5 + tailwind v4, dayjs.
- Icons: `@phosphor-icons/react/dist/ssr` (SSR variants work in server + client components). All icon files live at `dist/ssr/<Name>.d.ts`.
- All UI copy is **Bengali (bn)**. Reuse `ledger-card`, `table`, `EmptyState`, `ConfirmDialog`, `ToastProvider` patterns.

## Hard rules for this repo
- `AGENTS.md` (auto-managed by `next dev`) requires reading `node_modules/next/dist/docs/` before writing code. Next 16 renamed the `middleware` convention to **`proxy`** — `src/middleware.ts` still works (shows as "Proxy (Middleware)") but logs a deprecation warning; migrate with `npx @next/codemod@canary middleware-to-proxy .`.
- Next 16: `cookies()`/`headers()` are async; `searchParams`/`params` are Promises. next-auth 4.24.15 `getServerSession` already awaits them, so it is safe in RSC/actions (verified: resolves to `null` unauthenticated, never throws).
- Next 16 data-security guide: **re-verify auth inside every server action** (actions are reachable via direct POST); pages/middleware checks are not enough.

## Data model
- `borrowers._id` is a **hex string** (`new ObjectId().toHexString()`), not an ObjectId → server→client props serialize fine.
- Collections: `borrowers`, `transactions`, `invoices`. Queries live in `src/lib/queries.ts` (DB access), mutations in `src/app/actions/*`.
- Server actions return `ActionResult<T>` = `{ok:true,data}` | `{ok:false,error}`; validate input with zod schemas in `src/lib/validators.ts`.

## SMS
- `src/lib/sms.ts` wraps the Sonali SMS gateway (`SMS_API_URL`/`SMS_API_KEY`/`SMS_SECRET_KEY`/`SMS_CALLER_ID`), `normalizePhone` → `8801…`.
- Credentials belong **only** in untracked `.env.local`. `.env.example` IS committed and explicitly un-ignored (`!.env.example`) — never write real values there (a previous session leaked a live key/secret into it; reverted).

## Verification (no test runner installed)
- `npx tsc --noEmit`, `npx eslint <paths>`, `npm run build`. Full `npm run lint` has a **pre-existing error** at `src/components/invoices/InvoiceList.tsx:56` (`no-explicit-any`) plus unrelated warnings.
- A dev server is often already running on :3000 (logs at `.next/dev/logs/next-development.log`); a second `next dev` refuses to start.
- Middleware protects everything except `login|api/auth|_next/static|_next/image|favicon.ico`; unauthenticated page requests 307 → `/login`.
- Login credentials are unknown (env-based, hashed) → authenticated UI cannot be visually verified without them. Never send real SMS during testing.

## Delivered feature: bulk SMS page
- `/messages` (`src/app/messages/page.tsx`, `loading.tsx`) lists **all** customers with phone status; `MessageComposer` (client) has the textarea, SMS-part counter and confirm dialog; `sendBulkMessage` (`src/app/actions/messages.ts`) sends **sequentially** (150 ms gap) to customers with a non-blank phone only. Nav entries in `Sidebar.tsx` + `MobileNav.tsx`.
- Known follow-ups: no send history/log, serverless timeout risk for very large customer lists, `sendSms` treats any HTTP 2xx as delivered (gateway error bodies would be misreported), duplicate phone numbers receive duplicate SMS.

## Working agreements
- Work in the workspace, keep edits focused, preserve unrelated changes, verify before claiming success. Don't commit/push unless asked. `delegate_task` subagents returned no text in this environment — unreliable, prefer doing the work directly.
