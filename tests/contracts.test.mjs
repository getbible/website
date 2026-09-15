import test from 'node:test';
import assert from 'node:assert/strict';
import { serverFor, collectionFor, operations } from '../scripts/openapi.mjs';
import fs from 'node:fs';
import { apis } from '../src/data/catalog.mjs';
import { readDonation, renderMarkdown } from '../src/lib/content.mjs';

test('relative OpenAPI server URLs resolve against the source document',()=>{
  assert.equal(serverFor({servers:[{url:'./'}]},'https://example.org/v1/openapi.json'),'https://example.org/v1');
  assert.equal(serverFor({},'https://example.org/v3/openapi.json'),'https://example.org');
  assert.equal(serverFor({servers:[{url:'https://example.org/v2'}]},'https://example.org/v2/openapi.json'),'https://example.org/v2');
});
test('donation input permits bank formatting but removes executable markup and unsafe links',()=>{
  const previous=process.env.DONATION_BANK_DETAILS_HTML;
  try{process.env.DONATION_BANK_DETAILS_HTML='<p>Bank <strong>Example</strong></p><script>alert(1)</script><a href="javascript:alert(1)">Unsafe</a><img src=x onerror=alert(1)>';
  const output=readDonation();assert.match(output,/<strong>Example<\/strong>/);assert.doesNotMatch(output,/<script|javascript:|onerror|<img/);
  }finally{if(previous===undefined)delete process.env.DONATION_BANK_DETAILS_HTML;else process.env.DONATION_BANK_DETAILS_HTML=previous;}
});
test('Markdown exports stable unique heading anchors and sanitizes raw HTML',()=>{
  const {html,headings}=renderMarkdown('## Usage\n\n## Usage\n\n<script>alert(1)</script>');
  assert.deepEqual(headings.map(h=>h.id),['usage','usage-1']);assert.doesNotMatch(html,/<script/);
});

test('every published operation has a complete importable request and nonempty resource variables',()=>{
  for(const api of apis)for(const version of api.versions){
    const spec=JSON.parse(fs.readFileSync(`public/openapi/${api.id}-${version}.json`,'utf8'));
    const collection=collectionFor(spec,`${api.host}/${version}/openapi.json`,`${api.id} ${version}`);
    assert.equal(collection.item.length,operations(spec).length);
    const vars=Object.fromEntries(collection.variable.map(v=>[v.key,v.value]));
    for(const item of collection.item){
      const expanded=item.request.url.raw.replace(/\{\{([^}]+)\}\}/g,(_,key)=>{assert.ok(vars[key],`${api.id}: empty variable ${key}`);return vars[key]});
      assert.ok(new URL(expanded).hostname.endsWith('getbible.net'));
      assert.doesNotMatch(expanded,/\/v\d+\/v\d+\//);
      if(item.request.method==='POST')assert.doesNotThrow(()=>JSON.parse(item.request.body.raw));
    }
  }
});

test('operation parameter and server overrides take precedence over path defaults',()=>{
  const parameter = example => ({name:'id',in:'path',required:true,schema:{type:'string',example}});
  const spec = {
    servers: [{url:'https://example.org'}],
    paths: {
      '/items/{id}': {
        parameters: [parameter('old')],
        get: {
          servers: [{url:'https://other.example.org'}],
          parameters: [parameter('new')],
          responses: {200: {description:'OK',content:{'application/json':{schema:{type:'object'}}}}},
        },
      },
    },
  };
  const collection=collectionFor(spec,'https://example.org/openapi.json','example');
  const vars=Object.fromEntries(collection.variable.map(v=>[v.key,v.value]));
  assert.equal(vars.id,'new');assert.equal(vars.server_url,'https://other.example.org');
});
