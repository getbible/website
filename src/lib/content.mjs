import fs from 'node:fs';
import path from 'node:path';
import { Marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

export const escapeHtml = value => String(value).replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
export function renderMarkdown(markdown) {
  const headings = [];
  const used = new Map();
  const marked = new Marked({gfm: true});
  marked.use({ renderer: { heading({tokens, depth}) {
    const text = this.parser.parseInline(tokens);
    const plain = text.replace(/<[^>]*>/g, '');
    const base = plain.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'section';
    const count = used.get(base) || 0; used.set(base, count + 1);
    const id = count ? `${base}-${count}` : base;
    if(depth === 2 || depth === 3) headings.push({id, text:plain, depth});
    return `<h${depth} id="${id}">${text}<a class="heading-anchor" href="#${id}" aria-label="Link to ${escapeHtml(plain)}">#</a></h${depth}>`;
  }}});
  return {html: sanitizeHtml(marked.parse(markdown), {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img','details','summary']),
    allowedAttributes: {...sanitizeHtml.defaults.allowedAttributes, '*':['id','class'], a:['href','title','aria-label'], img:['src','alt','width','height','loading']},
  }), headings};
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, {withFileTypes:true}).flatMap(entry => entry.isDirectory() ? walk(path.join(dir,entry.name)) : [path.join(dir,entry.name)]);
}
export function allPages() {
  return [...walk('src/content'), ...walk('src/generated')].filter(file => file.endsWith('.md')).map(file => {
    let original = fs.readFileSync(file,'utf8').replace(/^---\n[\s\S]*?\n---\n/, '').trim() + '\n';
    const slug = file.replace(/^src\/(content|generated)\//,'').replace(/\.md$/,'');
    if (/^api\/[^/]+\/v\d+$/.test(slug)) original += `\n## Complete contract reference\n\nOpen the [complete endpoint and schema reference](/${slug}/reference/) for every operation, parameter, response and component model in the published OpenAPI contract.\n`;
    const title = original.match(/^# (.+)$/m)?.[1] || slug;
    const body = original.replace(/^# .+\n/,'').trim();
    const description = body.split('\n').find(line => line.trim() && !/^#|^\||^>|^```/.test(line))?.replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/[*`]/g,'').slice(0,180) || title;
    return {slug, title, description, markdown: original, body, generated:file.includes('/generated/'), ...renderMarkdown(body)};
  }).sort((a,b) => a.slug.localeCompare(b.slug));
}
export function readDonation() {
  const raw = process.env.DONATION_BANK_DETAILS_HTML || '';
  return sanitizeHtml(raw, {
    allowedTags: ['p','br','strong','b','em','i','ul','ol','li','table','thead','tbody','tr','th','td','dl','dt','dd','a','h3','h4'],
    allowedAttributes: {a:['href','title']}, allowedSchemes:['https','mailto'],
  }).trim();
}
