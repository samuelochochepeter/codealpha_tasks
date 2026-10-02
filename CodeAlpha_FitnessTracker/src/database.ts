import type { SQLiteDatabase } from 'expo-sqlite';
import { getRandomBytes } from 'expo-crypto';
import { scrypt } from 'scrypt-js';

export type User = { id: number; name: string; email: string };
export type Activity = { id: number; user_id: number; date: string; type: string; minutes: number; calories: number; steps: number; notes: string; created_at: string };
export type ActivityInput = Pick<Activity, 'date' | 'type' | 'minutes' | 'calories' | 'steps' | 'notes'>;

export async function initializeDatabase(db: SQLiteDatabase) {
  await db.execAsync(`PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
      password_salt TEXT NOT NULL, password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS user_activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id),
      date TEXT NOT NULL, type TEXT NOT NULL, minutes INTEGER NOT NULL DEFAULT 0,
      calories INTEGER NOT NULL DEFAULT 0, steps INTEGER NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS user_activities_owner_date ON user_activities(user_id, date);
    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id INTEGER NOT NULL REFERENCES users(id), key TEXT NOT NULL, value TEXT NOT NULL,
      PRIMARY KEY(user_id, key)
    );`);
}

// Local accounts use a random salt and scrypt; no plaintext password is stored.
const utf8 = (value: string) => {
  const encoded = encodeURIComponent(value);
  const bytes: number[] = [];
  for (let i = 0; i < encoded.length; i++) {
    if (encoded[i] === '%') { bytes.push(parseInt(encoded.slice(i + 1, i + 3), 16)); i += 2; }
    else bytes.push(encoded.charCodeAt(i));
  }
  return new Uint8Array(bytes);
};
const hex = (bytes: Uint8Array) => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
const fromHex = (value: string) => new Uint8Array(value.match(/.{2}/g)?.map(x => parseInt(x, 16)) ?? []);
const passwordHash = async (password: string, salt: Uint8Array) => hex(await scrypt(utf8(password), salt, 16384, 8, 1, 32));
const normalizeEmail = (email: string) => email.trim().toLowerCase();

export async function createUser(db: SQLiteDatabase, name: string, email: string, password: string): Promise<User> {
  const cleanName = name.trim(); const cleanEmail = normalizeEmail(email);
  if (cleanName.length < 2 || cleanName.length > 60) throw new Error('Enter a name between 2 and 60 characters.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) throw new Error('Enter a valid email address.');
  if (password.length < 8) throw new Error('Use a password of at least 8 characters.');
  if (await db.getFirstAsync('SELECT id FROM users WHERE email=?', [cleanEmail])) throw new Error('An account with this email already exists on this device.');
  const salt = getRandomBytes(16);
  const hash = await passwordHash(password, salt);
  const result = await db.runAsync('INSERT INTO users (name,email,password_salt,password_hash) VALUES (?,?,?,?)', [cleanName, cleanEmail, hex(salt), hash]);
  return { id: result.lastInsertRowId, name: cleanName, email: cleanEmail };
}

export async function loginUser(db: SQLiteDatabase, email: string, password: string): Promise<User> {
  const row = await db.getFirstAsync<User & { password_salt: string; password_hash: string }>('SELECT id,name,email,password_salt,password_hash FROM users WHERE email=?', [normalizeEmail(email)]);
  if (!row) throw new Error('Email not found. Check your email address or create an account.');
  const calculated = await passwordHash(password, fromHex(row.password_salt));
  let mismatch = calculated.length ^ row.password_hash.length;
  for (let i = 0; i < calculated.length; i++) mismatch |= calculated.charCodeAt(i) ^ row.password_hash.charCodeAt(i);
  if (mismatch) throw new Error('Wrong password. Please try again.');
  return { id: row.id, name: row.name, email: row.email };
}

export const localDate = (date = new Date()) => {
  const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export function weekDates(today = new Date()) {
  const day = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const monday = new Date(day);
  monday.setDate(day.getDate() - ((day.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday); date.setDate(monday.getDate() + i); return localDate(date);
  });
}

export async function listActivities(db: SQLiteDatabase, userId: number) {
  return db.getAllAsync<Activity>('SELECT * FROM user_activities WHERE user_id=? ORDER BY date DESC, id DESC', [userId]);
}
export async function saveActivity(db: SQLiteDatabase, userId: number, activity: ActivityInput, id?: number) {
  const args = [activity.date, activity.type, activity.minutes, activity.calories, activity.steps, activity.notes];
  if (id) await db.runAsync('UPDATE user_activities SET date=?, type=?, minutes=?, calories=?, steps=?, notes=? WHERE id=? AND user_id=?', [...args, id, userId]);
  else await db.runAsync('INSERT INTO user_activities (date,type,minutes,calories,steps,notes,user_id) VALUES (?,?,?,?,?,?,?)', [...args, userId]);
}
export async function deleteActivity(db: SQLiteDatabase, userId: number, id: number) {
  await db.runAsync('DELETE FROM user_activities WHERE id=? AND user_id=?', [id, userId]);
}
export async function getGoal(db: SQLiteDatabase, userId: number) {
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM user_preferences WHERE user_id=? AND key=?', [userId, 'weekly_minutes_goal']);
  const value = Number(row?.value ?? 150);
  return Number.isFinite(value) && value > 0 ? value : 150;
}
export async function setGoal(db: SQLiteDatabase, userId: number, minutes: number) {
  await db.runAsync('INSERT INTO user_preferences (user_id,key,value) VALUES (?,?,?) ON CONFLICT(user_id,key) DO UPDATE SET value=excluded.value', [userId, 'weekly_minutes_goal', String(minutes)]);
}
