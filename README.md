# RankScope Pro — SEO + Weekly Rank Emails

Professional SEO platform with Gemini strategy, live Google rankings, weekly auto-audits, and email reports to **client + admin**.

## What it does

1. Collects **URL + client email + target keywords**
2. Runs full SEO audit + **real Google rank positions**
3. Emails report to **client and ADMIN_EMAIL**
4. Saves a **weekly monitor** (stays ON until admin pauses)
5. Cron `/api/cron/weekly` re-checks every week and re-mails both

## Setup

```bash
cd seo-analyzer
npm install
cp .env.example .env.local
```

### Required for full power

| Env | Purpose |
|-----|---------|
| `GEMINI_API_KEY` | AI SEO strategist |
| `SERPER_API_KEY` | Live Google ranks ([serper.dev](https://serper.dev)) |
| `SMTP_*` + `ADMIN_EMAIL` | Email client + admin |
| `CRON_SECRET` / `ADMIN_SECRET` | Protect cron + monitors admin |
| `APP_BASE_URL` | Links inside emails |

```bash
npm run dev
```

## Weekly automation

- **Vercel:** `vercel.json` runs Monday 09:00 UTC → `/api/cron/weekly`
- **Manual / external cron:**  
  `GET/POST /api/cron/weekly?secret=YOUR_CRON_SECRET`
- **Admin UI:** `/monitors` → Pause / Resume / Run now / Run weekly now

## Admin panel (backend)

| Path | Purpose |
|------|---------|
| `/admin/login` | Admin login |
| `/admin` | Dashboard (stats, run weekly) |
| `/admin/clients` | Pause/resume/run client monitors |
| `/admin/audits` | All saved reports |
| `/admin/settings` | System status |

Login password = `ADMIN_PASSWORD` (or `ADMIN_SECRET`).

## Routes

| Path | Purpose |
|------|---------|
| `/` | Audit + enroll weekly monitor |
| `/admin` | Backend admin panel |
| `/compare` | Competitor compare |
| `/history` | Saved audits |
| `/report/[id]` | Full report |
| `/api/cron/weekly` | Weekly job |
| `/api/admin/*` | Admin auth + stats APIs |

## Notes

- Google rank needs a SERP API key (Serper or SerpAPI). Without it, audits still work; rank shows setup hint.
- Email needs SMTP (Gmail App Password works well).
- Monitoring continues until admin pauses/deletes the monitor.
