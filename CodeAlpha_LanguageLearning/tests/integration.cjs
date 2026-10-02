const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');
const ts = require('typescript');
function load(file) {
 const exports = {};
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 vm.runInNewContext(code,{exports,require:name=>name==='expo-crypto'?{getRandomBytes:n=>new Uint8Array(crypto.randomBytes(n))}:require(name),Uint8Array,Date,Math,Set,encodeURIComponent},{filename:file});
 return exports;
}
(async()=>{
 const api=load('src/database.ts'), content=load('src/content.ts');
 const sql=new DatabaseSync(':memory:');
 const db={execAsync:async text=>sql.exec(text),runAsync:async(text,args=[])=>{const r=sql.prepare(text).run(...args);return {lastInsertRowId:Number(r.lastInsertRowid),changes:r.changes};},getFirstAsync:async(text,args=[])=>sql.prepare(text).get(...args)||null,getAllAsync:async(text,args=[])=>sql.prepare(text).all(...args),withTransactionAsync:async fn=>{sql.exec('BEGIN');try{await fn();sql.exec('COMMIT');}catch(e){sql.exec('ROLLBACK');throw e;}}};
 await api.initializeDatabase(db);
 const a=await api.createUser(db,'First Learner','FIRST@example.com ','password123');
 const b=await api.createUser(db,'Second Learner','second@example.com','different123');
 assert.equal((await api.loginUser(db,' first@EXAMPLE.com ','password123')).id,a.id);
 await assert.rejects(()=>api.loginUser(db,'missing@example.com','password123'),/Email not found/);
 await assert.rejects(()=>api.loginUser(db,'first@example.com','wrong'),/Wrong password/);
 await assert.rejects(()=>api.createUser(db,'Duplicate','first@example.com','password123'),/already exists/);
 await assert.rejects(()=>api.createUser(db,'Learner','bad email','password123'),/valid email/);
 await assert.rejects(()=>api.createUser(db,'Learner','other@example.com','short'),/at least 8/);
 await db.runAsync('INSERT INTO practice_days(user_id,day) VALUES(?,?)',[a.id,api.dateKey()]);
 await api.initializeDatabase(db);assert.equal((await api.getDays(db,a.id,'idoma')).length,1);
 assert.equal(await api.getSelectedLanguage(db,a.id),null);await api.setSelectedLanguage(db,a.id,'french');assert.equal(await api.getSelectedLanguage(db,a.id),'french');assert.equal(await api.getSelectedLanguage(db,b.id),null);
 const stored=sql.prepare('SELECT password_hash,password_salt FROM users WHERE id=?').get(a.id);
 assert.notEqual(stored.password_hash,'password123');assert.equal(stored.password_hash.length,64);assert.equal(stored.password_salt.length,32);
 await api.recordResult(db,a.id,'greetings',4,5);await api.recordResult(db,a.id,'greetings',2,5);
 let result=(await api.getResults(db,a.id))[0];assert.equal(result.best,4);assert.equal(result.attempts,2);
 await api.recordResult(db,a.id,'greetings',5,5);result=(await api.getResults(db,a.id))[0];assert.equal(result.best,5);
 assert.equal((await api.getResults(db,b.id)).length,0);
 await api.toggleSaved(db,a.id,'morning',false);assert.equal((await api.getSaved(db,a.id)).length,1);assert.equal((await api.getSaved(db,b.id)).length,0);
 await api.toggleSaved(db,a.id,'morning',true);assert.equal((await api.getSaved(db,a.id)).length,0);
 assert.equal((await api.getDays(db,a.id)).length,1);
 await api.recordResult(db,a.id,'french:greetings',3,5,'french');assert.equal((await api.getDays(db,a.id,'french')).length,1);assert.equal((await api.getDays(db,a.id,'spanish')).length,0);
 assert.equal((await api.getResults(db,a.id)).find(r=>r.lesson==='greetings').best,5);
 await api.toggleSaved(db,a.id,'french:greetings:0',false);assert.equal((await api.getSaved(db,a.id)).length,1);assert.equal((await api.getSaved(db,b.id)).length,0);
 assert.equal(content.languages.length,4);assert.equal(content.lessons.length,16);assert.equal(content.allWords.length,80);assert.ok(content.getLanguage('mandarin').lessons.flatMap(l=>l.words).every(w=>w.reading));
 for(const language of content.languages){assert.equal(language.lessons.length,4);assert.equal(language.lessons.flatMap(l=>l.words).length,20);}
 const now=new Date(2026,9,1);assert.equal(api.streak(['2026-10-01','2026-09-30','2026-09-29'],now),3);assert.equal(api.streak(['2026-09-30','2026-09-29'],now),2);assert.equal(api.streak(['2026-09-28'],now),0);
 assert.equal(new Set(content.allWords.map(w=>w.id)).size,content.allWords.length);
 for(const lesson of content.lessons){for(let i=0;i<25;i++){const questions=content.questionsFor(lesson);assert.equal(questions.length,lesson.words.length);assert.equal(new Set(questions.map(q=>q.word.id)).size,lesson.words.length);for(const q of questions){assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert.ok(q.options.includes(q.reverse?q.word.text:q.word.english));}}}
 sql.close();console.log('Passed: authentication, hashed credentials, per-user progress/bookmarks, best scores, streaks, language choice and separation, migration, and quiz options.');
})().catch(e=>{console.error(e);process.exitCode=1;});
