CREATE TABLE IF NOT EXISTS "user_consents" (
  "user_id" varchar PRIMARY KEY NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "agreement_version" text NOT NULL,
  "personal_data_version" text NOT NULL,
  "accepted_at" timestamp with time zone DEFAULT now() NOT NULL
);
