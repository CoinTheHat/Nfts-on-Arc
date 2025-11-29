-- collection_moderation tablosunu oluştur (varsa pas geçer)
CREATE TABLE IF NOT EXISTS collection_moderation (
  address TEXT PRIMARY KEY,
  status TEXT DEFAULT 'neutral', -- 'verified', 'hidden', 'neutral'
  updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS'i aç
ALTER TABLE collection_moderation ENABLE ROW LEVEL SECURITY;

-- Eski politikaları temizle
DROP POLICY IF EXISTS "Allow public read moderation" ON collection_moderation;
DROP POLICY IF EXISTS "Allow authenticated insert moderation" ON collection_moderation;
DROP POLICY IF EXISTS "Allow authenticated update moderation" ON collection_moderation;
DROP POLICY IF EXISTS "Allow anon insert moderation" ON collection_moderation;
DROP POLICY IF EXISTS "Allow anon update moderation" ON collection_moderation;

-- Yeni politikaları oluştur

-- 1. Herkes okuyabilsin
CREATE POLICY "Allow public read moderation" ON collection_moderation
  FOR SELECT USING (true);

-- 2. Anonim kullanıcılar (Frontend) ekleyebilsin/güncelleyebilsin
-- NOT: Gerçek bir uygulamada bu güvenli değildir, ancak bu MVP'de
-- admin kontrolünü frontend tarafında (cüzdan adresi ile) yapıyoruz.
CREATE POLICY "Allow anon insert moderation" ON collection_moderation
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon update moderation" ON collection_moderation
  FOR UPDATE USING (true);
