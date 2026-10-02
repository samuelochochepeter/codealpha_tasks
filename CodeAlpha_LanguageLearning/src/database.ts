import type { SQLiteDatabase } from 'expo-sqlite';
import { getRandomBytes } from 'expo-crypto';
import { scrypt } from 'scrypt-js';
export type User = { id: number; name: string; email: string };
export async function initializeDatabase(db: SQLiteDatabase) {
  await db.execAsync(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
  CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_salt TEXT NOT NULL, password_hash TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS results (user_id INTEGER NOT NULL REFERENCES users(id), lesson TEXT NOT NULL, best INTEGER NOT NULL, total INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 1, PRIMARY KEY(user_id,lesson));
  CREATE TABLE IF NOT EXISTS saved (user_id INTEGER NOT NULL REFERENCES users(id), word TEXT NOT NULL, PRIMARY KEY(user_id,word));
  CREATE TABLE IF NOT EXISTS practice_days (user_id INTEGER NOT NULL REFERENCES users(id), day TEXT NOT NULL, PRIMARY KEY(user_id,day));
  CREATE TABLE IF NOT EXISTS language_days (user_id INTEGER NOT NULL REFERENCES users(id), language TEXT NOT NULL, day TEXT NOT NULL, PRIMARY KEY(user_id,language,day));
  CREATE TABLE IF NOT EXISTS language_preferences (user_id INTEGER PRIMARY KEY REFERENCES users(id), language TEXT NOT NULL);
  INSERT OR IGNORE INTO language_days(user_id,language,day) SELECT user_id,'idoma',day FROM practice_days;`);
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


export type Result = { lesson: string; best: number; total: number; attempts: number };
export const getResults = (db: SQLiteDatabase, id: number) => db.getAllAsync<Result>('SELECT lesson,best,total,attempts FROM results WHERE user_id=?',[id]);
export const getSaved = (db: SQLiteDatabase, id: number) => db.getAllAsync<{word:string}>('SELECT word FROM saved WHERE user_id=?',[id]);
export const getDays = (db: SQLiteDatabase, id: number, language='idoma') => db.getAllAsync<{day:string}>('SELECT day FROM language_days WHERE user_id=? AND language=? ORDER BY day DESC',[id,language]);
export async function getSelectedLanguage(db:SQLiteDatabase,id:number) { const row=await db.getFirstAsync<{language:string}>('SELECT language FROM language_preferences WHERE user_id=?',[id]);return row?.language??null; }
export async function setSelectedLanguage(db:SQLiteDatabase,id:number,language:string) { await db.runAsync('INSERT INTO language_preferences(user_id,language) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET language=excluded.language',[id,language]); }
export const dateKey = (d=new Date()) => [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
export async function recordResult(db: SQLiteDatabase,id:number,lesson:string,score:number,total:number,language='idoma') {
 await db.withTransactionAsync(async () => {
 await db.runAsync('INSERT INTO results(user_id,lesson,best,total) VALUES(?,?,?,?) ON CONFLICT(user_id,lesson) DO UPDATE SET best=MAX(results.best,excluded.best),total=excluded.total,attempts=results.attempts+1',[id,lesson,score,total]);
 await db.runAsync('INSERT OR IGNORE INTO language_days(user_id,language,day) VALUES(?,?,?)',[id,language,dateKey()]);
 });
}
export async function toggleSaved(db:SQLiteDatabase,id:number,word:string,saved:boolean) {
 if(saved) await db.runAsync('DELETE FROM saved WHERE user_id=? AND word=?',[id,word]);
 else await db.runAsync('INSERT OR IGNORE INTO saved(user_id,word) VALUES(?,?)',[id,word]);
}
export function streak(days:string[], now=new Date()) {
 const found=new Set(days); const cursor=new Date(now.getFullYear(),now.getMonth(),now.getDate());
 if(!found.has(dateKey(cursor))) cursor.setDate(cursor.getDate()-1);
 let count=0; while(found.has(dateKey(cursor))) { count++; cursor.setDate(cursor.getDate()-1); } return count;
}
