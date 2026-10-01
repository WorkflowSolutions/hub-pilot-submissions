import 'dotenv/config';
import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';

const DB_PATH = resolve(process.env.DB_PATH || './data/hub.db');
const dir = dirname(DB_PATH);
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    submitter_name TEXT NOT NULL,
    submitter_title TEXT,
    submitter_email TEXT NOT NULL,
    checked_waitlist INTEGER DEFAULT 0,
    meets_criteria INTEGER DEFAULT 0,
    agency_name TEXT NOT NULL,
    brand_name TEXT,
    ct_agency_id TEXT,
    rh_agency_id TEXT,
    marketing_platform TEXT,
    artwork_builder TEXT,
    engage_usage TEXT,
    rta_usage TEXT,
    main_user TEXT DEFAULT '{}',
    additional_users TEXT DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'Waitlist',
    submitted_at TEXT NOT NULL,
    approved_at TEXT,
    live_at TEXT
  )
`);

// Migrate: add rejection columns if they don't exist yet
try { db.exec('ALTER TABLE submissions ADD COLUMN rejection_reason TEXT'); } catch {}
try { db.exec('ALTER TABLE submissions ADD COLUMN rejected_at TEXT'); } catch {}

export default db;
