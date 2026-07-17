CREATE TABLE IF NOT EXISTS campaigns (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT        NOT NULL,
  slug           TEXT        NOT NULL UNIQUE,
  banner_message TEXT,
  ends_at        TIMESTAMPTZ NOT NULL,
  product_ids    UUID[]      NOT NULL DEFAULT '{}',
  is_active      BOOLEAN     NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS campaigns_slug_idx ON campaigns (slug);
