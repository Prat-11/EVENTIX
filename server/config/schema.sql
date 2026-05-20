
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password      TEXT NOT NULL,
  avatar        TEXT DEFAULT NULL,          
  avatar_public_id TEXT DEFAULT NULL,       
  phone         TEXT DEFAULT '',
  dob           TEXT DEFAULT '',
  location      TEXT DEFAULT '',
  bio           TEXT DEFAULT '',
  interests     JSONB DEFAULT '[]',         
  notifications TEXT DEFAULT 'all' CHECK (notifications IN ('all','important','none')),
  is_admin      BOOLEAN DEFAULT FALSE,
  blocked       BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organizer_name   TEXT NOT NULL,
  event_name       TEXT NOT NULL,
  date             TEXT NOT NULL,           -- stored as YYYY-MM-DD string
  description      TEXT DEFAULT '',
  category         TEXT DEFAULT 'general' CHECK (category IN ('music','tech','sports','food','general')),
  image            TEXT DEFAULT NULL,       -- Cloudinary image URL
  image_public_id  TEXT DEFAULT NULL,       -- Cloudinary public_id
  members_required INTEGER NOT NULL CHECK (members_required >= 1),
  enrolled_members INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS enrollments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name   TEXT NOT NULL,
  user_email  TEXT NOT NULL,
  seats       JSONB DEFAULT '[]',          
  seat_count  INTEGER DEFAULT 1,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)                
);


CREATE TABLE IF NOT EXISTS reservations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name  TEXT NOT NULL,
  seats      JSONB NOT NULL DEFAULT '[]',
  expires_at TIMESTAMPTZ NOT NULL,          
  created_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_enrollments_event ON enrollments(event_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_event ON reservations(event_id);
CREATE INDEX IF NOT EXISTS idx_reservations_expires ON reservations(expires_at);


CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER events_updated_at
  BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
