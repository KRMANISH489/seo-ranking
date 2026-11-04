# Vercel + Email (SMTP) setup — CodAbhi SEO

Live site: `https://seo-ranking-sigma.vercel.app`

## 0) Persistent storage (History + Admin) — required

Vercel `/tmp` is wiped between deploys, so audits disappear unless you add Blob:

1. Vercel project → **Storage** → **Create** → **Blob**  
2. Connect to `seo-ranking` (adds `BLOB_READ_WRITE_TOKEN` automatically)  
3. Redeploy  
4. Run a new audit — it will stay in History / Admin

## 1) Email via Resend (recommended)

Gmail SMTP often fails with `535 BadCredentials` on Vercel. Use Resend instead:

1. https://resend.com → sign up → **API Keys** → Create  
2. Add on Vercel:

| Name | Value |
|------|--------|
| `RESEND_API_KEY` | `re_...` |
| `EMAIL_FROM` | `CodAbhi SEO <onboarding@resend.dev>` (testing) |
| `ADMIN_EMAIL` | `krmanish489@gmail.com` |

For production client emails, verify your domain in Resend and set `EMAIL_FROM` to that domain.

## 2) Other Vercel Environment Variables

Add for **Production** (+ Preview recommended):

| Name | Value |
|------|--------|
| `ADMIN_EMAIL` | `krmanish489@gmail.com` |
| `APP_BASE_URL` | `https://seo-ranking-sigma.vercel.app` |
| `ADMIN_PASSWORD` | `admin123` |
| `ADMIN_SECRET` | `rankscope-dev-secret` |
| `CRON_SECRET` | `rankscope-dev-secret` |
| `GEMINI_API_KEY` | *(your key)* |
| `GEMINI_MODEL` | `gemini-3.8-flash` |
| `SERPER_API_KEY` | *(your key)* |
| `SERP_GL` | `in` |
| `SERP_HL` | `en` |

## 3) Redeploy

Deployments → … → **Redeploy** (env changes need a new deploy).

## 4) Test

1. Login `/admin/login`  
2. Open `/admin/settings` → **Send test email to admin**  
3. Or run an audit with a client email — both client + admin get the report
