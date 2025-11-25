-- Add attendance columns to joined_participants
ALTER TABLE IF EXISTS joined_participants
  ADD COLUMN IF NOT EXISTS present boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS check_in timestamptz NULL,
  ADD COLUMN IF NOT EXISTS check_out timestamptz NULL;

-- Optional: create index to speed lookups by seminar + email
CREATE INDEX IF NOT EXISTS idx_joined_participants_seminar_email ON joined_participants(seminar_id, participant_email);
