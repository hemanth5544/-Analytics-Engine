
DROP TABLE IF EXISTS public.analytics_events CASCADE;
DROP TABLE IF EXISTS public.api_keys CASCADE;
DROP TABLE IF EXISTS public.apps CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    google_id TEXT UNIQUE,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.apps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    domain TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);

CREATE TABLE public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
    key TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);

CREATE TABLE public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
    event TEXT NOT NULL,
    url TEXT,
    referrer TEXT,
    device TEXT NOT NULL,
    ip_address TEXT,
    user_id TEXT,
    browser TEXT,
    os TEXT,
    screen_size TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_google_id ON public.users(google_id);

CREATE INDEX idx_apps_user_id ON public.apps(user_id);

CREATE INDEX idx_api_keys_app_id ON public.api_keys(app_id);
CREATE INDEX idx_api_keys_key ON public.api_keys(key);
CREATE INDEX idx_api_keys_active ON public.api_keys(app_id) WHERE is_active = true;

CREATE INDEX idx_analytics_events_app_id          ON public.analytics_events(app_id);
CREATE INDEX idx_analytics_events_event           ON public.analytics_events(event);
CREATE INDEX idx_analytics_events_timestamp       ON public.analytics_events(timestamp DESC);
CREATE INDEX idx_analytics_events_user_id         ON public.analytics_events(user_id);
CREATE INDEX idx_analytics_events_device          ON public.analytics_events(device);

CREATE INDEX idx_analytics_events_app_timestamp   ON public.analytics_events(app_id, timestamp DESC);
CREATE INDEX idx_analytics_events_app_event       ON public.analytics_events(app_id, event);
CREATE INDEX idx_analytics_events_event_timestamp ON public.analytics_events(event, timestamp DESC);

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

