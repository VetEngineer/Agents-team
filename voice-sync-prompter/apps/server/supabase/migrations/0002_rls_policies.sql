-- Voice Sync Prompter RLS 정책

-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- Users 정책: 자신의 정보만 조회/수정 가능
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Scripts 정책: 자신의 대본만 CRUD 가능, 공개 대본은 모두 조회 가능
CREATE POLICY "Users can view own scripts"
  ON scripts FOR SELECT
  USING (auth.uid() = user_id OR is_public = TRUE);

CREATE POLICY "Users can create own scripts"
  ON scripts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scripts"
  ON scripts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scripts"
  ON scripts FOR DELETE
  USING (auth.uid() = user_id);

-- Transcriptions 정책: 자신의 음성인식 기록만 CRUD 가능
CREATE POLICY "Users can view own transcriptions"
  ON transcriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transcriptions"
  ON transcriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transcriptions"
  ON transcriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Usage Logs 정책: 자신의 사용량 로그만 조회 가능 (삽입은 서비스 키로만)
CREATE POLICY "Users can view own usage logs"
  ON usage_logs FOR SELECT
  USING (auth.uid() = user_id);

-- 서비스 역할을 위한 정책 (서버에서 service_role 키 사용 시)
CREATE POLICY "Service role full access to users"
  ON users FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access to scripts"
  ON scripts FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access to transcriptions"
  ON transcriptions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access to usage_logs"
  ON usage_logs FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
