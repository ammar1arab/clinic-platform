const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {createRequire}=require('module');
const root=path.resolve(__dirname, '../apps/web');
const req=createRequire(root+'/package.json');
const ts=req('typescript');
const cache=new Map();
function load(file){
 if(!path.extname(file))file=fs.existsSync(file+'.ts')?file+'.ts':file+'/index.ts';
 if(cache.has(file))return cache.get(file).exports;
 const mod={exports:{}};cache.set(file,mod);
 const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText;
 new Function('require','module','exports',js)(name=>name.startsWith('@/')?load(root+'/src/'+name.slice(2)):name.startsWith('.')?load(path.resolve(path.dirname(file),name)):req(name),mod,mod.exports);
 return mod.exports;
}
const {translations,getTranslations}=load(root+'/src/i18n/index.ts');
function keys(v,p=''){return Object.entries(v).flatMap(([k,x])=>typeof x==='object'?keys(x,p+k+'.'):[p+k]).sort();}
assert.deepEqual(keys(translations.en),keys(translations.ar));
for(const key of keys(translations.en)){
 const a=key.split('.').reduce((x,k)=>x[k],translations.en),b=key.split('.').reduce((x,k)=>x[k],translations.ar);
 assert.deepEqual((a.match(/\{\w+\}/g)||[]).sort(),(b.match(/\{\w+\}/g)||[]).sort(),key);
}
let lang='en';global.window={};global.localStorage={getItem:()=>lang};
const v=load(root+'/src/lib/validations.ts');
for(const language of ['en','ar','en']){
 lang=language;const t=getTranslations();
 assert.equal(v.requiredText().safeParse('').error.issues[0].message,t.validation.required);
 assert.equal(v.personName().safeParse('123').error.issues[0].message,t.validation.lettersOnly);
 assert.equal(v.optionalEmail.safeParse('invalid').error.issues[0].message,t.validation.email);
 assert.equal(v.optionalText(2).safeParse('abcd').error.issues[0].message,t.validation.maxCharacters.replace('{max}','2'));
 assert.equal(v.positiveNumber(10).safeParse(11).error.issues[0].message,t.validation.maxNumber.replace('{max}','10'));
 const options=load(root+'/src/constants/patient.ts').getGenders(t);
 assert.equal(options[0].label,t.constants.gender.male);
 assert.equal(load(root+'/src/lib/datetime.ts').formatClockParts(9,0,language),'9 '+t.time.am);
 const balance=load(root+'/src/lib/package-balance.ts').formatPackageBalance({sessionsTotal:3,sessionsRemaining:2},language);
 assert.equal(balance,t.packageBalance.sessions.replace('{left}','2').replace('{total}','3'));
}
function walk(dir) {
 return fs.readdirSync(dir, {withFileTypes:true}).flatMap(entry => {
  const file=path.join(dir,entry.name);
  return entry.isDirectory()?walk(file):[file];
 });
}
let components=0;
for(const folder of ['services','providers','lib','hooks','constants','components/ui','components/primitives']) {
 for(const file of walk(path.join(root,'src',folder))) {
  if(!/\.tsx?$/.test(file))continue;
  const source=fs.readFileSync(file,'utf8');
  assert(!/\bt\?\./.test(source), 'Optional translation access: '+file);
  if(!folder.startsWith('components/'))continue;
  components++;
  const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  function visit(node) {
   if(ts.isJsxText(node)) assert(!/[A-Za-z\u0600-\u06FF]/.test(node.text),'Hardcoded JSX text: '+file);
   if(ts.isStringLiteral(node)&&ts.isJsxAttribute(node.parent)&&/^(aria-label|placeholder|title|alt)$/.test(node.parent.name.text)) {
    assert(!/[A-Za-z\u0600-\u06FF]/.test(node.text),'Hardcoded accessible text: '+file);
   }
   ts.forEachChild(node,visit);
  }
  visit(ast);
 }
}
console.log('PASS: '+keys(translations.en).length+' dictionary keys and placeholders match; EN/AR validation, option, clock and balance checks pass; '+components+' UI/primitive files have no literal JSX labels; audited folders have no optional t access.');
