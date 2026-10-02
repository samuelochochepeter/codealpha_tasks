import type { SQLiteDatabase } from 'expo-sqlite';
export async function initializeDatabase(db:SQLiteDatabase) {
 await db.execAsync('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY,value TEXT NOT NULL); CREATE TABLE IF NOT EXISTS favorites (quote_id TEXT PRIMARY KEY,saved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);');
}
export async function getLastQuote(db:SQLiteDatabase) { const row=await db.getFirstAsync<{value:string}>('SELECT value FROM settings WHERE key=?',['last_quote']);return row?.value??null; }
export async function saveLastQuote(db:SQLiteDatabase,id:string) { await db.runAsync('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',['last_quote',id]); }
export const getFavorites=(db:SQLiteDatabase)=>db.getAllAsync<{quote_id:string}>('SELECT quote_id FROM favorites ORDER BY saved_at DESC,quote_id');
export async function setFavorite(db:SQLiteDatabase,id:string,value:boolean) {
 if(value) await db.runAsync('INSERT OR IGNORE INTO favorites(quote_id) VALUES(?)',[id]);
 else await db.runAsync('DELETE FROM favorites WHERE quote_id=?',[id]);
}
