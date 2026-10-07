-- 0001 · intervene 스키마 첫 생성(2026-10-08 · 결정 #30 · #31 · docs/DATABASE.md §3).
-- 🔴 조각 운영 DB 에 적용된다. 모든 문장이 intervene 스키마 · intervene_app 역할만 건드린다(러너가 검사한다).
-- 🔴 고치지 않는다. 바꿀 것은 0002 이후에 덧붙인다(expand-only).
-- 전제: 역할 intervene_app 이 이미 있다(scripts/create-role.mjs).
-- subject_id = 공용 서버 기기 토큰의 subject(가명). received_at = 서버가 받은 시각.

CREATE SCHEMA IF NOT EXISTS intervene;

CREATE TABLE intervene._migrations (
  name       text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

-- 현재 규칙(정본 · 결정 #30). 삭제는 tombstone(CLAUDE §5-11)
CREATE TABLE intervene.rules (
  subject_id  text        NOT NULL,
  id          uuid        NOT NULL,
  kind        text        NOT NULL CHECK (kind IN ('intercept','check')),
  name        text        NOT NULL,
  enabled     boolean     NOT NULL,
  days        smallint    NOT NULL CHECK (days BETWEEN 1 AND 127),
  start_min   smallint    NOT NULL CHECK (start_min BETWEEN 0 AND 1439),
  end_min     smallint             CHECK (end_min BETWEEN 0 AND 1439),
  targets     text[]      NOT NULL,
  message     text        NOT NULL,
  grace_min   smallint             CHECK (grace_min IN (1, 3, 5, 10, 15, 30)),
  updated_at  timestamptz NOT NULL,
  deleted_at  timestamptz,
  received_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (subject_id, id),
  CHECK (kind IN ('check') OR (end_min IS NOT NULL AND end_min <> start_min)),
  CHECK (kind IN ('intercept') OR cardinality(targets) = 1)
);

-- 규칙이 바뀔 때마다 한 줄(당시 문구 · 결정 #24)
CREATE TABLE intervene.rule_versions (
  subject_id  text        NOT NULL,
  rule_id     uuid        NOT NULL,
  updated_at  timestamptz NOT NULL,
  snapshot    jsonb       NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (subject_id, rule_id, updated_at)
);

-- 확인 화면 한 번 = 한 줄
CREATE TABLE intervene.prompt_events (
  subject_id  text        NOT NULL,
  id          uuid        NOT NULL,
  rule_id     uuid        NOT NULL,
  pkg         text        NOT NULL,
  shown_at    timestamptz NOT NULL,
  result      text        NOT NULL CHECK (result IN ('cancel','open','dismissed')),
  decide_ms   integer,
  tz          text        NOT NULL,
  day_key     date        NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (subject_id, id)
);
CREATE INDEX ix_prompt_rule ON intervene.prompt_events (subject_id, rule_id, day_key);

-- 실행 확인의 하루 = 한 줄
CREATE TABLE intervene.check_days (
  subject_id      text        NOT NULL,
  rule_id         uuid        NOT NULL,
  day_key         date        NOT NULL,
  verdict         text                 CHECK (verdict IN ('notify','already','notified','not_today','before','missed','off')),
  first_opened_at timestamptz,
  notified_at     timestamptz,
  action          text                 CHECK (action IN ('later','open')),
  tz              text,
  updated_at      timestamptz NOT NULL,
  received_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (subject_id, rule_id, day_key)
);

-- 기기 정보(진단과 같은 축 · 결정 #21)
CREATE TABLE intervene.devices (
  subject_id    text        PRIMARY KEY,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz NOT NULL DEFAULT now(),
  model         text,
  sdk_int       smallint,
  app_version   text,
  locale        text,
  tz            text,
  adv_protection text
);

ALTER TABLE intervene._migrations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervene.rules        ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervene.rule_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervene.prompt_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervene.check_days   ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervene.devices      ENABLE ROW LEVEL SECURITY;

CREATE POLICY intervene_app_all ON intervene.rules         FOR ALL TO intervene_app USING (true) WITH CHECK (true);
CREATE POLICY intervene_app_all ON intervene.rule_versions FOR ALL TO intervene_app USING (true) WITH CHECK (true);
CREATE POLICY intervene_app_all ON intervene.prompt_events FOR ALL TO intervene_app USING (true) WITH CHECK (true);
CREATE POLICY intervene_app_all ON intervene.check_days    FOR ALL TO intervene_app USING (true) WITH CHECK (true);
CREATE POLICY intervene_app_all ON intervene.devices       FOR ALL TO intervene_app USING (true) WITH CHECK (true);

REVOKE ALL ON SCHEMA intervene FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA intervene FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA intervene TO intervene_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON intervene.rules, intervene.rule_versions, intervene.prompt_events, intervene.check_days, intervene.devices TO intervene_app;
