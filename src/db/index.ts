import { mkdirSync } from "node:fs"
import path from "node:path"

import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"

import * as schema from "@/db/schema"

const dbPath =
  process.env.GUIDED_CHAT_DB_PATH ??
  path.join(process.cwd(), "data", "guided-chat.sqlite")

mkdirSync(path.dirname(dbPath), { recursive: true })

const sqlite = new Database(dbPath)
sqlite.pragma("journal_mode = WAL")
sqlite.pragma("foreign_keys = ON")

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS threads (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    messages_json TEXT NOT NULL,
    settings_json TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS threads_updated_at_idx
    ON threads (updated_at);

  CREATE TABLE IF NOT EXISTS workspace_settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
`)

export const db = drizzle(sqlite, { schema })
import "server-only"
