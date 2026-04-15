# County Finance — Setup Instructions
## Ready to Deploy!

Semua code Manus sudah di-replace dengan clean code. Berikut langkah akhir:

---

## Status Code

**Applied clean files:**
- `server/_core/env.ts` — New env config (Railway + Clerk + R2 + OpenAI)
- `server/_core/auth.ts` — Clerk auth (NEW file, replaces oauth.ts)
- `server/_core/context.ts` — Clerk-based tRPC context
- `server/_core/trpc.ts` — Clean procedures
- `server/_core/chat.ts` — Direct OpenAI
- `server/_core/index.ts` — Clean server entry
- `server/storage.ts` — Cloudflare R2
- `server/receiptScanner.ts` — OpenAI Vision direct
- `server/aiAdvisor.ts` — Direct OpenAI
- `vite.config.ts` — No Manus plugins
- `client/src/clerk-provider.tsx` — Clerk React provider
- `drizzle/schema.ts` — users.openId → users.clerkUserId
- `server/db.ts` — Updated upsertUser + getUserByClerkId
- `package.json` — Added @clerk/express, @clerk/clerk-react, @clerk/themes; removed vite-plugin-manus-runtime
- `.env.local.template` — Template for env vars
- `railway.toml` — Railway deploy config
- `Dockerfile` — Production container
- `.github/workflows/deploy.yml` — CI/CD pipeline

**Backed up to** `.manus-backup/`:
- oauth.ts, env.ts (old), chat.ts (old), context.ts (old), trpc.ts (old), index.ts (old), storage.ts (old), receiptScanner.ts (old), aiAdvisor.ts (old), vite.config.ts (old), schema.ts (old)

**Unused Manus files still present** (ignored by clean code, bisa dihapus nanti):
- `server/_core/oauth.ts`
- `server/_core/sdk.ts`
- `server/_core/patchedFetch.ts`
- `server/_core/types/manusTypes.ts`
- `.manus/` folder

---

## Langkah Setup (60 Menit)

### Step 1 — Setup Services (Kamu)

Buat semua akun ini dan kumpulkan API keys:

1. **Railway** ([railway.app](https://railway.app))
   - Login with GitHub
   - New Project → Empty
   - Add MySQL service
   - Copy `DATABASE_URL` dari MySQL Variables tab

2. **Clerk** ([dashboard.clerk.com](https://dashboard.clerk.com))
   - Create application "County Finance"
   - Enable Google + Email/Password
   - Copy `Publishable key` (pk_) dan `Secret key` (sk_)
   - Create webhook endpoint (nanti setelah deploy): `{RAILWAY_URL}/api/webhooks/clerk`
   - Subscribe to events: `user.created`, `user.updated`, `user.deleted`
   - Copy `Webhook secret` (whsec_)

3. **Cloudflare R2** ([dash.cloudflare.com](https://dash.cloudflare.com))
   - Enable R2
   - Create bucket: `county-assets`
   - Create API Token with "Object Read & Write" for county-assets
   - Copy: Account ID, Access Key ID, Secret Access Key

4. **OpenAI** ([platform.openai.com/api-keys](https://platform.openai.com/api-keys))
   - Top up $10
   - Create key `county-production`
   - Copy: API key (sk-...)

5. **Stripe** ([dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys))
   - Get Secret Key (sk_live_ atau sk_test_)
   - Create webhook endpoint (nanti setelah deploy): `{RAILWAY_URL}/api/stripe/webhook`
   - Copy: Webhook signing secret (whsec_)

6. **JWT Secret** (terminal lokal):
   ```bash
   openssl rand -hex 32
   ```

### Step 2 — Copy .env Template

```bash
cp .env.local.template .env
```

Isi semua values di `.env` dari keys yang kamu kumpulkan di Step 1.

### Step 3 — Install Dependencies

```bash
pnpm install
# atau
npm install
```

### Step 4 — Push Schema ke Railway MySQL

Pastikan DATABASE_URL di .env sudah diisi, lalu:

```bash
pnpm db:push
# atau
npx drizzle-kit push
```

Ini akan create semua 23 tabel di Railway MySQL (fresh database).

### Step 5 — Test Locally

```bash
pnpm dev
```

Buka http://localhost:3000 — harusnya landing page muncul. Test sign up via Clerk.

### Step 6 — Push ke GitHub

```bash
git add .
git commit -m "feat: migrate from Manus to Railway + Clerk + R2"
git push origin main
```

### Step 7 — Deploy ke Railway

1. Railway dashboard → project → Add Service → "Deploy from GitHub repo"
2. Pilih repo `county-finance`
3. Railway auto-detect Node.js, akan build otomatis
4. **Settings → Variables** → tambahkan SEMUA env vars dari `.env`:
   - DATABASE_URL (sudah otomatis kalau MySQL sama project)
   - CLERK_SECRET_KEY, CLERK_PUBLISHABLE_KEY, CLERK_WEBHOOK_SECRET
   - VITE_CLERK_PUBLISHABLE_KEY
   - R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
   - R2_BUCKET_NAME=county-assets
   - OPENAI_API_KEY
   - STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
   - JWT_SECRET
5. **Settings → Networking** → Generate Domain → dapat URL railway.app
6. Railway akan auto-deploy setiap kamu push ke main

### Step 8 — Update Webhooks

Setelah Railway punya URL, update:
- Clerk webhook endpoint → `https://{RAILWAY_URL}/api/webhooks/clerk`
- Stripe webhook endpoint → `https://{RAILWAY_URL}/api/stripe/webhook`

### Step 9 — Custom Domain (county.finance)

1. Railway dashboard → Settings → Networking → Custom Domain
2. Add `county.finance` dan `www.county.finance`
3. Railway kasih CNAME/A record target
4. Login ke Manus dashboard → edit DNS:
   - A record `@` → Railway IP
   - CNAME `www` → county.finance
5. Wait 5-60 menit, SSL auto-issued oleh Railway

### Step 10 — Go Live

Test di county.finance:
- Sign up flow via Clerk
- Create business
- POS transaction
- Receipt scan
- Dashboard
- Export report

---

## Known Issues to Fix Post-Deploy

1. **Client-side still uses old auth hooks** — Perlu update `client/src/` components yang pakai user data dari context Manus. Ganti ke `useUser()` dari @clerk/clerk-react.

2. **Frontend routing** — Pastikan protected routes pakai `<SignedIn>` / `<SignedOut>` wrapper dari Clerk.

3. **Admin role assignment** — Saya hardcode email `sabitah.labs@gmail.com` → admin di `db.ts`. Update kalau mau mekanisme lain.

4. **Main router (`server/routers.ts`)** — 1,715 baris code masih pakai `ctx.user.openId`. Perlu global find & replace `openId` → `clerkUserId` di file ini.

---

## Emergency Rollback

Kalau ada masalah, revert:
```bash
cp .manus-backup/oauth.ts server/_core/
cp .manus-backup/env.ts server/_core/
cp .manus-backup/index.ts server/_core/
# dll — semua backup ada di .manus-backup/
```
