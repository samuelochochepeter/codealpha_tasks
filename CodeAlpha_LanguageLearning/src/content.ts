export type Word = { id: string; text: string; english: string; tip: string; reading?: string };
export type Lesson = { id: string; title: string; subtitle: string; icon: string; color: string; words: Word[] };
const word = (id: string, text: string, english: string, tip: string): Word => ({ id, text, english, tip });
export const sourceUrl = 'https://en.wikivoyage.org/w/index.php?title=Idoma_phrasebook&oldid=5190968';
export const videoUrl = 'https://www.youtube.com/watch?v=oUxT8va0FYI';
export const greetingsVideo = 'https://www.youtube.com/watch?v=nsEERZQVrMg';
const idomaLessons: Lesson[] = [
 { id:'greetings', title:'A warm beginning', subtitle:'Everyday greetings', icon:'☀',color:'#BF542E',words:[
 word('morning','Nma ochi','Good morning','Start with the greeting for the time of day.'),
 word('afternoon','Nma eno','Good afternoon','Notice how the final word changes with the time of day.'),
 word('evening','Nma one','Good evening','Compare this with the morning and afternoon greetings.'),
 word('welcome','Ahinya o’wa','Welcome','Use this to welcome someone.'),
 word('thanks','Ahinya','Thank you','Compare this shorter expression with the welcome greeting.')
 ]},
 { id:'conversation',title:'Keep the conversation going',subtitle:'Questions and responses',icon:'◌',color:'#39776C',words:[
 word('how','Agbehii?','How are you?','Practise this with its response in the next card.'),
 word('fine','Mgbehi','I am alright','A response to a question about your wellbeing.'),
 word('day','Iche be?','How is the day?','A short question to practise with a speaking partner.'),
 word('arrived','Agaa ee?','Have you arrived?','A question to use when someone arrives.'),
 word('journey','Iyawu kuo be?','How was your journey?','Practise asking about a journey.')
 ]},
 { id:'numbers-one',title:'Your first five numbers',subtitle:'Counting from 1 to 5',icon:'123',color:'#9D7435',words:[
 word('one','Eye','One','Count one object.'),word('two','Epa','Two','Count two objects.'),word('three','Eta','Three','Count three objects.'),word('four','Ene','Four','Count four objects.'),word('five','Elo','Five','Count five objects.')
 ]},
 { id:'numbers-two',title:'Count a little further',subtitle:'Counting from 6 to 10',icon:'10',color:'#645D91',words:[
 word('six','Eli','Six','Review one to five, then continue.'),word('seven','Ahapa','Seven','Say each number slowly with a speaking partner.'),word('eight','Ahata','Eight','Compare this spelling with seven.'),word('nine','Ahane','Nine','Compare the final sounds of seven, eight, and nine.'),word('ten','Igwo','Ten','Practise the full sequence from one to ten.')
 ]}
];

export type Question = { word: Word; options: string[]; reverse: boolean };
export function shuffle<T>(items:T[]):T[] {
 const result=[...items]; for(let i=result.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [result[i],result[j]]=[result[j],result[i]]; } return result;
}
export function questionsFor(lesson:Lesson): Question[] {
 return shuffle(lesson.words).map((w,i)=> {
 const reverse=i%2===1; const answer=reverse?w.text:w.english;
 const distractors=shuffle(lesson.words.filter(x=>x.id!==w.id).map(x=>reverse?x.text:x.english)).slice(0,3);
 return { word:w, reverse, options:shuffle([answer,...distractors]) };
 });
}

export type LanguageId = 'idoma' | 'french' | 'spanish' | 'mandarin';
export type Language = { id: LanguageId; name: string; nativeName: string; symbol: string; description: string; source: string; note: string; lessons: Lesson[] };
type Pair = [string,string,string?];
function starterLessons(id:LanguageId,greetings:Pair[],conversation:Pair[],numbers:Pair[]):Lesson[] {
 const make=(key:string,title:string,subtitle:string,icon:string,color:string,pairs:Pair[]) => ({id:id+':'+key,title,subtitle,icon,color,words:pairs.map(([text,english,reading],i)=>({id:id+':'+key+':'+i,text,english,reading,tip:reading?'Pinyin helps you read the characters. Tone marks are part of pronunciation.':'Practise this expression with a speaking partner.'}))});
 return [make('greetings','A warm beginning','Everyday greetings','☀','#BF542E',greetings),make('conversation','Keep the conversation going','Useful expressions','◌','#39776C',conversation),make('numbers-one','Your first five numbers','Counting from 1 to 5','123','#9D7435',numbers.slice(0,5)),make('numbers-two','Count a little further','Counting from 6 to 10','10','#645D91',numbers.slice(5))];
}
export const languages:Language[] = [
 {id:'idoma',name:'Idoma',nativeName:'Idoma',symbol:'ID',description:'Connect with your roots in Benue South, Nigeria.',source:sourceUrl,note:'Starter source spellings; community review pending. Confirm tone, dialect, and pronunciation with an Idoma speaker.',lessons:idomaLessons},
 {id:'french',name:'French',nativeName:'Français',symbol:'FR',description:'Begin with French greetings and useful everyday words.',source:'https://en.wikivoyage.org/wiki/French_phrasebook',note:'Beginner French with English explanations. The course introduces both formal and informal expressions.',lessons:starterLessons('french',
 [['Bonjour','Hello / Good morning'],['Bonsoir','Good evening'],['Salut','Hi (informal)'],['Au revoir','Goodbye'],['Merci','Thank you']],
 [['Comment allez-vous ?','How are you? (formal)'],['Bien, merci','Fine, thank you'],["S’il vous plaît",'Please (formal)'],['Oui','Yes'],['Non','No']],
 [['Un','One'],['Deux','Two'],['Trois','Three'],['Quatre','Four'],['Cinq','Five'],['Six','Six'],['Sept','Seven'],['Huit','Eight'],['Neuf','Nine'],['Dix','Ten']])},
 {id:'spanish',name:'Spanish',nativeName:'Español',symbol:'ES',description:'Learn practical Spanish, one small lesson at a time.',source:'https://en.wikivoyage.org/wiki/Spanish_phrasebook',note:'Beginner Spanish with English explanations. Expressions and pronunciation can vary by region.',lessons:starterLessons('spanish',
 [['Hola','Hello'],['Buenos días','Good morning'],['Buenas tardes','Good afternoon / Good evening'],['Buenas noches','Good evening / Good night'],['Gracias','Thank you']],
 [['¿Cómo estás?','How are you? (informal)'],['Muy bien, gracias','Fine, thank you'],['Por favor','Please'],['Sí','Yes'],['No','No']],
 [['Uno','One'],['Dos','Two'],['Tres','Three'],['Cuatro','Four'],['Cinco','Five'],['Seis','Six'],['Siete','Seven'],['Ocho','Eight'],['Nueve','Nine'],['Diez','Ten']])},
 {id:'mandarin',name:'Mandarin Chinese',nativeName:'普通话 · Pǔtōnghuà',symbol:'中',description:'Learn simplified Chinese characters with Pinyin support.',source:'https://en.wikivoyage.org/wiki/Mandarin_phrasebook',note:'This course teaches Mandarin Chinese using simplified characters and tone-marked Pinyin. Mandarin is one of the languages spoken in China.',lessons:starterLessons('mandarin',
 [['你好','Hello','Nǐ hǎo'],["早安",'Good morning',"Zǎo’ān"],['晚上好','Good evening','Wǎnshàng hǎo'],['再见','Goodbye','Zàijiàn'],['谢谢','Thank you','Xièxie']],
 [['你好吗？','How are you?','Nǐ hǎo ma?'],['很好，谢谢','Fine, thank you','Hěn hǎo, xièxie'],['请','Please','Qǐng'],['对不起','Sorry','Duìbuqǐ'],['不客气','You’re welcome','Bú kèqi']],
 [['一','One','Yī'],['二','Two','Èr'],['三','Three','Sān'],['四','Four','Sì'],['五','Five','Wǔ'],['六','Six','Liù'],['七','Seven','Qī'],['八','Eight','Bā'],['九','Nine','Jiǔ'],['十','Ten','Shí']])}
];
export const lessons=languages.flatMap(l=>l.lessons);
export const allWords=lessons.flatMap(l=>l.words);
export function getLanguage(id:string|null|undefined):Language|undefined { return languages.find(l=>l.id===id); }
