-- Add custom display name and banner images to campaigns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS banner_images TEXT[] NOT NULL DEFAULT '{}';
