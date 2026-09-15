import fs from 'node:fs';
import path from 'node:path';
import { apis, cards, SITE } from '../src/data/catalog.mjs';
import { allPages, readDonation } from '../src/lib/content.mjs';
import { collectionFor, referenceFor } from './openapi.mjs';
const write=(file,data)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,data)};
fs.rmSync('src/generated',{recursive:true,force:true});
for(const api of apis)for(const version of api.versions){
  const file=`public/openapi/${api.id}-${version}.json`;
  const spec=JSON.parse(fs.readFileSync(file,'utf8'));
  const source=`${api.host}/${version}/openapi.json`;
  if(!spec.openapi||!spec.paths)throw Error(`Invalid OpenAPI document: ${file}`);
  write(`src/generated/api/${api.id}/${version}/reference.md`,referenceFor(spec,source,`${api.title} ${version}`,`/api/${api.id}/${version}/`));
  write(`public/postman/${api.id}-${version}.json`,JSON.stringify(collectionFor(spec,source,`${api.title} ${version}`),null,2)+'\n');
}
let index='# Get Bible\n\nThe Word. For the world. Built for developers.\n\nBring the Bible into what you build. Open APIs, practical tools, and a shared mission to make Scripture accessible everywhere.\n\n## Explore the ecosystem\n\n';
for(const category of ['APIs','Tools','Apps','AI','Builders']){index+=`### ${category}\n\n`;for(const card of cards.filter(c=>c.category===category))index+=`- [${card.title}](${SITE}${card.href}): ${card.description}\n`;index+='\n';}
index+='## Your first request\n\n```bash\ncurl --fail-with-body \\\n  \'https://api.getbible.net/v2/kjv/43/3.json\'\n```\n\n## The mission\n\nGet Bible is a project of [trueChristian.church](https://trueChristian.church). We build Scripture infrastructure that developers, churches and communities can use to bring the Bible to the world.\n\nThe [Get Bible app](/project/app/) is under development and currently uses API v2. Advancing it to v3 and study APIs is a future priority.\n\n- [About Get Bible](/about/)\n- [Get involved](/contribute/)\n- [Donations](/donate/)\n- [Access and tokens](/tokens/)\n- [Public support](https://git.vdm.dev/getBible/support)\n- [Email](mailto:getBible@TrueChristian.church)\n- [Read the Bible](https://getbible.life)\n';
index += '\n## Connect AI tools\n\nThe Get Bible MCP endpoint is `https://mcp.getbible.net/`. Connect using Streamable HTTP with anonymous access, or run the Python package locally. See [MCP setup](/mcp/) for ChatGPT developer mode and other clients.\n';
write('public/index.md',index);
write('public/404.md','# Page not found\n\nExplore [APIs](/api/), [projects](/project/) or [Get Bible home](/).\n');
const pages=allPages();
for(const page of pages){let markdown=page.markdown;if(page.slug==='donate'&&readDonation())markdown+='\n## Bank donation details\n\n'+readDonation()+'\n';write(`public/${page.slug}.md`,markdown);}
const all=[{title:'Get Bible',slug:'index',description:'Scripture for every application.',markdown:index},...pages];
const urlFor=p=>p.slug==='index'?SITE+'/':`${SITE}/${p.slug}/`;
const mdFor=p=>p.slug==='index'?SITE+'/index.md':`${SITE}/${p.slug}.md`;
write('public/search-index.json',JSON.stringify(all.filter(p=>!p.slug.endsWith('/reference')).map(p=>({title:p.title,url:new URL(urlFor(p)).pathname,description:p.description,text:p.markdown}))));
write('public/llms.txt','# Get Bible\n\n> Scripture APIs, developer tools, applications and MCP. A project of trueChristian.church.\n\nEvery page is available as a static Markdown file. The HTML page links to its text/markdown alternative. The ?format=markdown option is a JavaScript browser view; clients should fetch the direct .md URLs below. llms.txt follows the community proposal at https://llmstxt.org/.\n\n## Documentation\n\n'+all.map(p=>`- [${p.title}](${mdFor(p)}): ${p.description}`).join('\n')+'\n\n## OpenAPI contracts\n\n'+apis.flatMap(a=>a.versions.map(v=>`- [${a.title} ${v}](${a.host}/${v}/openapi.json)`)).join('\n')+'\n\n## Complete text\n\n- [All documentation](https://getbible.net/llms-full.txt)\n');
write('public/llms-full.txt',all.map(p=>`<!-- Source: ${urlFor(p)} -->\n${p.slug==='donate'?fs.readFileSync('public/donate.md','utf8'):p.markdown}`).join('\n\n---\n\n'));
write('public/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+all.map(p=>`<url><loc>${urlFor(p)}</loc></url>`).join('\n')+'\n</urlset>\n');
console.log(`Prepared ${all.length} Markdown pages, 9 API references and Postman collections.`);
