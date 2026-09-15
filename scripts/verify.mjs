import fs from 'node:fs';
import path from 'node:path';
import { apis } from '../src/data/catalog.mjs';
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)])}
const failures=[];
const files=walk('dist');const htmlFiles=files.filter(f=>f.endsWith('.html'));
function targetFor(url){let local=decodeURIComponent(url.pathname);if(local.endsWith('/'))local+='index.html';let candidate=path.join('dist',local);if(fs.existsSync(candidate)&&fs.statSync(candidate).isDirectory())candidate=path.join(candidate,'index.html');return candidate;}
for(const file of htmlFiles){
  const html=fs.readFileSync(file,'utf8');
  if(!html.includes('<title>'))failures.push(`${file}: missing title`);
  if(!html.includes('rel="canonical"'))failures.push(`${file}: missing canonical`);
  const base=new URL(file.replace(/^dist/,'').replace(/index\.html$/,''),'https://getbible.net');
  for(const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)){
    const value=match[1].replace(/&amp;/g,'&');
    if(/^(mailto:|tel:|data:|javascript:)/.test(value))continue;
    const url=new URL(value,base);
    if(url.origin!=='https://getbible.net')continue;
    const target=targetFor(url);
    if(!fs.existsSync(target)){failures.push(`${file}: broken ${value}`);continue;}
    if(url.hash&&target.endsWith('.html')){const id=decodeURIComponent(url.hash.slice(1));const destination=fs.readFileSync(target,'utf8');if(!destination.includes(`id="${id}"`))failures.push(`${file}: missing anchor ${value}`)}
  }
  if(file!=='dist/404.html'){
    const md=html.match(/rel="alternate" type="text\/markdown" title="Markdown" href="([^"]+)"/);
    if(!md||!fs.existsSync(path.join('dist',md[1])))failures.push(`${file}: missing Markdown alternative`);
  }
}
for(const api of apis)for(const version of api.versions){
  const spec=JSON.parse(fs.readFileSync(`dist/openapi/${api.id}-${version}.json`));
  const collection=JSON.parse(fs.readFileSync(`dist/postman/${api.id}-${version}.json`));
  const count=Object.values(spec.paths).reduce((sum,item)=>sum+Object.keys(item).filter(method=>['get','post','put','patch','delete','options','head'].includes(method)).length,0);
  if(collection.item.length!==count)failures.push(`${api.id}-${version}: incomplete Postman collection`);
}
if(fs.readFileSync('dist/CNAME','utf8').trim()!=='getbible.net')failures.push('Incorrect CNAME');
if(!fs.existsSync('dist/.nojekyll'))failures.push('Missing .nojekyll');
if(failures.length){console.error([...new Set(failures)].join('\n'));process.exit(1)}
console.log(`Verified ${htmlFiles.length} pages, local links and anchors, Markdown alternatives, and all 9 Postman collections.`);
