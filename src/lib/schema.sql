-- ZoomMate Database Schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- App settings (admin-configurable API keys, etc.)
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Default settings
INSERT INTO app_settings (key, value) VALUES
  ('openai_api_key', ''),
  ('openai_model', 'gpt-4o'),
  ('deepgram_api_key', ''),
  ('stripe_secret_key', ''),
  ('stripe_publishable_key', ''),
  ('stripe_webhook_secret', ''),
  ('stripe_pro_price_id', ''),
  ('free_credits', '3'),
  ('pro_credits', '999999')
ON CONFLICT (key) DO NOTHING;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  password_hash TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  credits INTEGER DEFAULT 3,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interview sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'Untitled Session',
  transcript JSONB DEFAULT '[]',
  answers JSONB DEFAULT '[]',
  duration_seconds INTEGER DEFAULT 0,
  audio_source TEXT CHECK (audio_source IN ('mic', 'system')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create default admin (password: admin123 — CHANGE THIS)
INSERT INTO users (email, name, password_hash, role, credits, plan)
VALUES (
  'admin@zoommate.local',
  'Admin',
  '$2a$10$placeholder',
  'admin',
  999999,
  'pro'
) ON CONFLICT (email) DO NOTHING;
