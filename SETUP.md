# ZoomMate — Self-Hosted Setup Guide

Real-time interview copilot. Self-hosted on your own Ubuntu server.

## One-Click Install (Ubuntu 20.04+)

```bash
chmod +x install.sh
./install.sh
```

This installs everything: PostgreSQL, Node.js, Nginx, builds the app, and starts it as a system service.

## After Installation

1. Open `http://your-server-ip` in your browser
2. Log in with the admin account:
   - **Email:** `admin@zoommate.local`
   - **Password:** `admin123`
3. Go to **Admin Portal** (button in dashboard header)
4. Click **API Keys & Settings** tab
5. Enter your **OpenAI API Key** and **Deepgram API Key**
6. Click Save — you're live!

## Getting Your API Keys

### OpenAI (Required — Powers AI answers)
1. Go to https://platform.openai.com
2. Create an API key
3. Paste it in Admin → Settings → OpenAI API Key

### Deepgram (Required — Powers speech-to-text)
1. Go to https://deepgram.com
2. Create an account (free $200 credits)
3. Create an API key
4. Paste it in Admin → Settings → Deepgram API Key

### Stripe (Optional — For paid subscriptions)
1. Go to https://stripe.com
2. Get your secret key + publishable key
3. Create a Product with a $12/month Price
4. Add all keys in Admin → Settings

### Google OAuth (Optional — For Google login)
1. Go to https://console.cloud.google.com
2. Create OAuth 2.0 credentials
3. Set redirect URI: `http://your-domain/api/auth/callback/google`
4. Add keys to `.env.local` file and restart

## Admin Features

The admin portal at `/admin` lets you:
- **View all users** — see who signed up
- **Grant credits** — manually give users credits (1 credit = 1 AI answer)
- **Change plans** — upgrade/downgrade users between free and pro
- **Manage roles** — promote users to admin
- **Update API keys** — change OpenAI, Deepgram, Stripe keys without touching config files
- **Configure defaults** — set how many credits new users get

## Architecture

```
Your Ubuntu Server
├── Nginx (port 80/443) → reverse proxy
├── Next.js app (port 3000)
│   ├── Landing Page (/)
│   ├── Login (/login)
│   ├── Dashboard (/dashboard)
│   ├── Session (/session) ← THE CORE
│   ├── Admin Portal (/admin)
│   └── API Routes
│       ├── /api/auth      → NextAuth (Google + email)
│       ├── /api/transcribe → Deepgram (speech → text)
│       ├── /api/generate   → OpenAI (text → answer)
│       ├── /api/usage      → Credit tracking
│       ├── /api/admin      → Admin operations
│       └── /api/stripe     → Payment webhooks
└── PostgreSQL (local)
    ├── users table
    ├── sessions table
    └── app_settings table (API keys stored here)
```

## Useful Commands

```bash
# App management
sudo systemctl status zoommate      # Check if running
sudo systemctl restart zoommate     # Restart after changes
sudo systemctl stop zoommate        # Stop the app
sudo journalctl -u zoommate -f      # Live logs

# Database
PGPASSWORD=zoommate psql -h localhost -U zoommate -d zoommate   # Connect to DB

# HTTPS setup (with your domain)
sudo certbot --nginx -d yourdomain.com
# Then update NEXTAUTH_URL in .env.local and restart

# Update the app
git pull
npm install
npm run build
sudo systemctl restart zoommate
```

## Costs (Self-Hosted)

| Service | Cost |
|---------|------|
| Your server | Whatever you pay for VPS ($5-20/month) |
| OpenAI API | ~$0.003 per answer (gpt-4o) |
| Deepgram | $200 free credits, then ~$0.0043/min |
| PostgreSQL | Free (self-hosted) |
| Nginx | Free (self-hosted) |

**Estimated cost per user session (30 min):** ~$0.05-0.10
