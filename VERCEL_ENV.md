# Vercel + Email (SMTP) setup — CodAbhi SEO

Live site: `https://seo-ranking-sigma.vercel.app`

## 1) Gmail App Password (required for reports)

1. Open https://myaccount.google.com/security  
2. Enable **2-Step Verification**  
3. Open https://myaccount.google.com/apppasswords  
4. Create password for app **Mail**  
5. Copy the 16-character password (spaces optional)

## 2) Vercel → Settings → Environment Variables

Add for **Production** (+ Preview recommended):

| Name | Value |
|------|--------|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `krmanish489@gmail.com` |
| `SMTP_PASS` | *(Gmail App Password)* |
| `SMTP_FROM` | `CodAbhi SEO <krmanish489@gmail.com>` |
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
