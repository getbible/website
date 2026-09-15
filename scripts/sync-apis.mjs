import fs from 'node:fs/promises';
import { apis } from '../src/data/catalog.mjs';
await fs.mkdir('public/openapi',{recursive:true});
for(const api of apis)for(const version of api.versions){
  const url=`${api.host}/${version}/openapi.json`;
  const response=await fetch(url,{signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error(`${response.status}: ${url}`);
  const text=await response.text();const spec=JSON.parse(text);
  if(!spec.openapi||!spec.paths)throw Error(`Invalid OpenAPI document: ${url}`);
  await fs.writeFile(`public/openapi/${api.id}-${version}.json`,text);
  console.log(`Updated ${api.id} ${version}`);
}
