export type Quote = { id:string; text:string; author:string; topic:string; sourceLabel:string; sourceUrl?:string; attributed?:boolean };
const original=(id:string,text:string,topic:string):Quote=>({id,text,topic,author:'StillWords',sourceLabel:'Original reflection created for this app'});
export const quotes:Quote[]=[
 {id:'africa-identity',text:'Every black person, please remember that you were Africans before you became anything else.',author:'Burna Boy',topic:'Heritage',sourceLabel:'Attributed by Quote Commentary; original statement not independently verified',sourceUrl:'https://quotecommentary.com/africa-quotes/',attributed:true},
 {id:'emerson-peace',text:'Nothing can bring you peace but yourself.',author:'Ralph Waldo Emerson',topic:'Perspective',sourceLabel:'Self-Reliance, Essays: First Series (1841)',sourceUrl:'https://www.gutenberg.org/cache/epub/16643/pg16643-images.html'},
 {id:'austen-kindness',text:'There is no charm equal to tenderness of heart.',author:'Jane Austen',topic:'Kindness',sourceLabel:'Emma, Volume II, Chapter XIII (1815)',sourceUrl:'https://www.gutenberg.org/files/158/158-h/158-h.htm'},
 {id:'shakespeare-possibility',text:'We know what we are, but know not what we may be.',author:'William Shakespeare',topic:'Growth',sourceLabel:'Hamlet, Act IV, Scene V; excerpt spoken by Ophelia',sourceUrl:'https://www.gutenberg.org/files/1524/1524-h/1524-h.htm'},
 original('small-step','Give today one honest effort; let tomorrow meet you a little further along.','Growth'),
 original('roots','Carry your roots with gratitude, and give your dreams room to grow.','Heritage'),
 original('kindness','A gentle word can leave a stronger memory than a loud victory.','Kindness'),
 original('begin','The first attempt does not need applause. It needs a beginning.','Courage'),
 original('learning','A question asked with curiosity is already a step toward understanding.','Learning'),
 original('rest','Rest can be part of your progress when it helps you return with care.','Perspective'),
 original('community','Let your success leave a door open for someone coming after you.','Community'),
 original('heritage','A language remembered is another bridge between generations.','Heritage'),
 original('practice','Let patient practice turn today’s uncertainty into tomorrow’s skill.','Learning'),
 original('listen','Listen long enough to discover the person behind the opinion.','Kindness'),
 original('hope','Make room for hope, then give it something practical to work with.','Courage'),
 original('craft','Care for the small details; they are where good work learns its shape.','Growth'),
 original('africa','Honour your community by building something that helps it flourish.','Community'),
 original('comparison','Measure your next step against your purpose, not someone else’s pace.','Perspective'),
 original('share','Knowledge becomes more useful when you help another person understand it.','Learning'),
 original('future','Keep what gives you strength, and learn what helps you move forward.','Heritage')
];
export function nextQuote(previousId:string|null,random:()=>number=Math.random):Quote {
 const available=quotes.filter(q=>q.id!==previousId);
 if(!available.length) throw new Error('At least two quotes are required.');
 return available[Math.min(available.length-1,Math.max(0,Math.floor(random()*available.length)))];
}
export const quoteMessage=(quote:Quote)=>'“'+quote.text+'”\n— '+(quote.attributed?'Attributed to ':'')+quote.author;
