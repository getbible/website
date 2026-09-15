/** Deterministic OpenAPI reference and Postman generation; source contracts stay untouched. */
const METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace']);

/** Resolve local references, including chained refs and escaped JSON Pointer keys. */
export function resolve(spec, value, seen = new Set()) {
  if (!value || typeof value !== 'object' || !value.$ref) return value;
  const ref = value.$ref;
  if (!ref.startsWith('#/')) throw new Error(`External reference is not supported: ${ref}`);
  if (seen.has(ref)) throw new Error(`Circular reference while resolving ${ref}`);
  const target = ref.slice(2).split('/').reduce((object, key) =>
    object?.[decodeURIComponent(key).replace(/~1/g, '/').replace(/~0/g, '~')], spec);
  if (target === undefined) throw new Error(`Unresolved OpenAPI reference: ${ref}`);
  const result = resolve(spec, target, new Set([...seen, ref]));
  const { $ref, ...siblings } = value;
  return result && typeof result === 'object' && !Array.isArray(result)
    ? { ...result, ...siblings }
    : result;
}

/** Relative server URLs resolve against the source contract; absent servers mean its origin. */
export function serverFor(spec, sourceUrl, servers = spec.servers) {
  const server = servers?.[0];
  if (!server?.url) return new URL(sourceUrl).origin;
  const expanded = server.url.replace(/\{([^}]+)\}/g, (_, name) => {
    const value = server.variables?.[name]?.default;
    if (value === undefined) throw new Error(`Server variable ${name} has no default`);
    return String(value);
  });
  return new URL(expanded, sourceUrl).href.replace(/\/$/, '');
}

/** Operation parameters override matching path-item parameters by (in, name). */
export function operations(spec) {
  return Object.entries(spec.paths || {}).flatMap(([route, rawItem]) => {
    const item = resolve(spec, rawItem);
    return Object.entries(item || {}).filter(([method]) => METHODS.has(method)).map(([method, rawOperation]) => {
      const operation = resolve(spec, rawOperation);
      const parameters = new Map();
      for (const raw of [...(item.parameters || []), ...(operation.parameters || [])]) {
        const parameter = resolve(spec, raw);
        parameters.set(`${parameter.in}:${parameter.name}`, parameter);
      }
      return { route, method, operation, parameters: [...parameters.values()], servers: operation.servers ?? item.servers ?? spec.servers };
    });
  });
}

const tableText = value => String(value ?? '—').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
const has = (value, key) => value != null && Object.prototype.hasOwnProperty.call(value, key);

/** Prefer explicit parameter/media examples over schema examples and defaults. */
function declaredExample(spec, value) {
  if (!value || typeof value !== 'object') return undefined;
  if (has(value, 'example')) return value.example;
  if (Array.isArray(value.examples) && value.examples.length) return value.examples[0];
  if (value.examples && typeof value.examples === 'object') {
    for (const raw of Object.values(value.examples)) {
      const example = resolve(spec, raw);
      if (has(example, 'value')) return example.value;
    }
  }
  if (has(value, 'default')) return value.default;
  if (has(value, 'const')) return value.const;
  return undefined;
}

// Coherent, public sample IDs verified against the source catalogues and live API.
// These are example content, never replacements for an upstream request contract.
const EXAMPLES = Object.freeze({
  abbreviation: 'kjv', translation: 'kjv', reference: 'John3:16',
  search: 'faith hope', segment: 'faith hope', q: 'faith hope',
  book: 1, chapter: 1, dictionary: 'strongsgreek', entry: 'G3056',
  commentary: 'mhc', id: 'adultery', locale: 'en', books: 'John', exclude: 'darkness'
});

function schemaExample(spec, rawSchema, name, depth = 0) {
  if (depth > 12) throw new Error(`Example schema nesting is too deep for ${name}`);
  const schema = resolve(spec, rawSchema) || {};
  const explicit = declaredExample(spec, schema);
  if (explicit !== undefined && explicit !== null) return explicit;
  for (const alternatives of [schema.oneOf, schema.anyOf]) {
    if (!alternatives) continue;
    for (const alternative of alternatives) {
      const branch = resolve(spec, alternative);
      if (branch?.type === 'null') continue;
      const value = schemaExample(spec, branch, name, depth + 1);
      if (value !== undefined && value !== null) return value;
    }
  }
  const types = Array.isArray(schema.type) ? schema.type : [schema.type];
  if (types.includes('array')) {
    const preferred = EXAMPLES[name];
    const item = schemaExample(spec, schema.items, name, depth + 1);
    return item === undefined ? [] : [Array.isArray(preferred) ? preferred[0] : item];
  }
  const preferred = EXAMPLES[name];
  if (schema.enum?.length) return schema.enum.includes(preferred) ? preferred : schema.enum[0];
  if (preferred !== undefined) {
    if (typeof preferred === 'number') {
      return Math.min(schema.maximum ?? Infinity, Math.max(schema.minimum ?? -Infinity, preferred));
    }
    return preferred;
  }
  if (types.includes('boolean')) return false;
  if (types.includes('integer') || types.includes('number')) return Math.max(schema.minimum ?? 0, 1);
  if (types.includes('object') || schema.properties || schema.allOf) {
    const result = {};
    for (const branch of schema.allOf || []) {
      Object.assign(result, schemaExample(spec, branch, name, depth + 1));
    }
    for (const key of schema.required || []) {
      const value = schemaExample(spec, schema.properties?.[key], key, depth + 1);
      if (value === undefined) throw new Error(`No example is available for required body field ${key}`);
      result[key] = value;
    }
    // SearchRequest's q is conditionally required when absent from the URL.
    if (schema.properties?.q && !has(result, 'q')) result.q = schemaExample(spec, schema.properties.q, 'q', depth + 1);
    return result;
  }
  return undefined;
}

function exampleFor(spec, parameter) {
  const explicit = declaredExample(spec, parameter);
  return explicit !== undefined ? explicit : schemaExample(spec, parameter.schema, parameter.name);
}

function responseMime(spec, operation) {
  for (const [status, raw] of Object.entries(operation.responses || {})) {
    if (!/^2\d\d$|^2XX$/i.test(status)) continue;
    const media = Object.keys(resolve(spec, raw)?.content || {});
    if (media.length) return media.find(mime => mime === 'application/json') || media[0];
  }
  // Redirects lead to the data representation. Pure error demonstrations return problems.
  return Object.keys(operation.responses || {}).some(status => /^3/.test(status))
    ? 'application/json' : 'application/problem+json';
}

function queryEntries(parameter, value, enabled) {
  const description = parameter.description || '';
  const base = { key: parameter.name, disabled: !enabled, description };
  if (Array.isArray(value)) {
    const explode = parameter.explode ?? ((parameter.style ?? 'form') === 'form');
    if (explode) return value.map(entry => ({ ...base, value: String(entry) }));
    const separator = parameter.style === 'spaceDelimited' ? ' ' : parameter.style === 'pipeDelimited' ? '|' : ',';
    return [{ ...base, value: value.join(separator) }];
  }
  if (value && typeof value === 'object') {
    if (parameter.style === 'deepObject') return Object.entries(value).map(([key, entry]) => ({ ...base, key: `${parameter.name}[${key}]`, value: String(entry) }));
    throw new Error(`Object query parameter ${parameter.name} needs an explicit supported serialization`);
  }
  return [{ ...base, value: value === undefined ? '' : String(value) }];
}

export function collectionFor(spec, sourceUrl, label) {
  const base = serverFor(spec, sourceUrl);
  const variables = new Map([['base_url', base]]);
  const variableFor = (name, value) => {
    const key = name.replace(/\W/g, '_');
    const text = String(value);
    let candidate = key;
    for (let suffix = 2; variables.has(candidate) && variables.get(candidate) !== text; suffix++) candidate = `${key}_${suffix}`;
    variables.set(candidate, text);
    return `{{${candidate}}}`;
  };
  const items = operations(spec).map(({ route, method, operation, parameters, servers }) => {
    const selectedBase = serverFor(spec, sourceUrl, servers);
    const baseVariable = selectedBase === base ? '{{base_url}}' : variableFor('server_url', selectedBase);
    const pathNames = [...route.matchAll(/\{([^}]+)\}/g)].map(match => match[1]);
    const isQueryAlias = new URL(sourceUrl).hostname === 'query.getbible.net'
      && pathNames.length === 1 && pathNames[0] === 'translation'
      && !operation.responses?.['200'] && operation.responses?.['301'];
    const examplePath = route.replace(/\{([^}]+)\}/g, (_, name) => {
      const parameter = parameters.find(candidate => candidate.name === name && candidate.in === 'path');
      if (!parameter) throw new Error(`${method.toUpperCase()} ${route}: missing path parameter ${name}`);
      const value = isQueryAlias ? EXAMPLES.reference : exampleFor(spec, parameter);
      if (value === undefined || value === null || value === '') throw new Error(`${method.toUpperCase()} ${route}: no runnable example for ${name}`);
      return variableFor(isQueryAlias ? 'reference' : name, value);
    });

    const bodyDefinition = resolve(spec, operation.requestBody);
    const bodyMedia = bodyDefinition?.content?.['application/json'];
    let bodyExample;
    if (bodyMedia) bodyExample = declaredExample(spec, bodyMedia) ?? schemaExample(spec, bodyMedia.schema, 'body');
    if (bodyDefinition?.required && !bodyMedia) throw new Error(`${method.toUpperCase()} ${route}: required non-JSON request body needs a supported example`);
    const hasPathSearch = pathNames.some(name => ['search', 'reference', 'segment'].includes(name));
    const query = parameters.filter(parameter => parameter.in === 'query').flatMap(parameter => {
      const supplySearch = parameter.name === 'q' && !hasPathSearch && !bodyExample?.q;
      const enabled = Boolean(parameter.required || supplySearch);
      const value = exampleFor(spec, parameter);
      if (enabled && (value === undefined || value === null || value === '')) throw new Error(`${method.toUpperCase()} ${route}: no value for required query parameter ${parameter.name}`);
      return queryEntries(parameter, value, enabled);
    });
    const enabled = query.filter(parameter => !parameter.disabled);
    const raw = `${baseVariable}${examplePath}` + (enabled.length
      ? '?' + enabled.map(parameter => `${encodeURIComponent(parameter.key)}=${encodeURIComponent(parameter.value)}`).join('&')
      : '');
    const header = [{ key: 'Accept', value: responseMime(spec, operation) }];
    for (const parameter of parameters.filter(candidate => candidate.in === 'header')) {
      const value = exampleFor(spec, parameter);
      if (parameter.required && value === undefined) throw new Error(`No example for required header ${parameter.name}`);
      header.push({ key: parameter.name, value: value === undefined ? '' : String(value), disabled: !parameter.required });
    }
    const request = {
      method: method.toUpperCase(), header,
      url: { raw, host: [baseVariable], path: examplePath.replace(/^\//, '').split('/'), query },
      description: `${operation.description || operation.summary || ''}\n\nSource contract: ${sourceUrl}\nRunnable catalogue examples are prefilled. Optional filters are disabled unless needed to provide search text. You can change collection variables or request parameters. Full-translation requests may download large documents.`
    };
    if (bodyMedia && bodyExample !== undefined) {
      header.push({ key: 'Content-Type', value: 'application/json' });
      request.body = { mode: 'raw', raw: JSON.stringify(bodyExample, null, 2), options: { raw: { language: 'json' } } };
    }
    const security = operation.security ?? spec.security;
    const requiredSecurity = security?.length && !security.some(requirement => Object.keys(requirement).length === 0);
    if (requiredSecurity) {
      const requirement = security.find(item => Object.keys(item).some(name => {
        const scheme = resolve(spec, spec.components?.securitySchemes?.[name]);
        return scheme?.type === 'http' && scheme.scheme?.toLowerCase() === 'bearer';
      }));
      if (!requirement) throw new Error(`Required security scheme needs configuration for ${method.toUpperCase()} ${route}`);
      request.auth = { type: 'bearer', bearer: [{ key: 'token', value: '{{getbible_token}}', type: 'string' }] };
      variables.set('getbible_token', '');
      request.description += '\nThis operation requires a token. Set getbible_token locally before sending.';
    } else if (operation.security?.length === 0) {
      request.auth = { type: 'noauth' };
    }
    const errorOnly = !Object.keys(operation.responses || {}).some(status => /^[23]/.test(status));
    if (errorOnly) request.description += '\nThis is an intentional error-contract example: the source operation declares no successful response.';
    return {
      name: `${errorOnly ? 'Error behavior · ' : ''}${operation.summary || operation.operationId || `${method.toUpperCase()} ${route}`}`,
      request, response: []
    };
  });
  return {
    info: {
      name: `Get Bible · ${label}`,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      description: `Generated from ${sourceUrl}. Public requests start with no authentication. For optional partner access, select Bearer Token in this collection's Authorization tab and enter a token issued for this domain. Never export or share credentials. Catalogue examples are prefilled; requests labeled Error behavior intentionally demonstrate a documented failure. GET and POST search samples are ready to run.`
    },
    auth: { type: 'noauth' },
    variable: [...variables].map(([key, value]) => ({ key, value, type: 'string' })),
    item: items
  };
}

export function referenceFor(spec, sourceUrl, label, parent) {
  const base = serverFor(spec, sourceUrl);
  let out = `# ${label}: endpoint and schema reference\n\nThis reference is generated from the checked-in [OpenAPI contract](${sourceUrl}). Return to the [integration guide](${parent}) for workflows and ready-to-run examples.\n\nResolved request server: \`${base}\`.\n\n`;
  for (const { route, method, operation, parameters, servers } of operations(spec)) {
    out += `## ${method.toUpperCase()} ${route}\n\n${operation.summary || operation.operationId || ''}\n\n${operation.description || ''}\n\n`;
    if (operation.operationId) out += `Operation ID: \`${operation.operationId}\`.\n\n`;
    const operationBase = serverFor(spec, sourceUrl, servers);
    if (operationBase !== base) out += `Operation server: \`${operationBase}\`.\n\n`;
    if (parameters.length) {
      out += '| Parameter | In | Required | Type | Example / default | Description |\n| --- | --- | --- | --- | --- | --- |\n';
      for (const parameter of parameters) {
        const schema = resolve(spec, parameter.schema) || {};
        out += `| \`${parameter.name}\` | ${parameter.in} | ${parameter.required ? 'Yes' : 'No'} | ${tableText(schema.type || 'See schema')} | ${tableText(exampleFor(spec, parameter))} | ${tableText(parameter.description || schema.description)} |\n`;
      }
      out += '\n';
    }
    const requestBody = resolve(spec, operation.requestBody);
    if (requestBody) {
      out += `### Request body\n\n${requestBody.required ? 'Required' : 'Optional'}. ${requestBody.description || ''}\n\n`;
      for (const [mime, media] of Object.entries(requestBody.content || {})) {
        out += `Media type: \`${mime}\`. Schema: \`${media.schema?.$ref || media.schema?.type || 'See contract'}\`.\n\n`;
        const example = declaredExample(spec, media);
        if (example !== undefined) out += '```json\n' + JSON.stringify(example, null, 2) + '\n```\n\n';
      }
    }
    out += '### Responses\n\n| Status | Description | Media type | Schema |\n| --- | --- | --- | --- |\n';
    for (const [code, raw] of Object.entries(operation.responses || {})) {
      const response = resolve(spec, raw);
      for (const [mime, content] of Object.entries(response?.content || { '—': {} })) {
        out += `| ${code} | ${tableText(response?.description)} | ${mime} | ${tableText(content.schema?.$ref || content.schema?.type || 'See contract')} |\n`;
      }
    }
    out += '\n<details><summary>Complete operation contract</summary>\n\n```json\n' + JSON.stringify({ ...operation, parameters }, null, 2) + '\n```\n\n</details>\n\n';
  }
  out += '## Component schemas\n\nTypes, required properties, nested objects, constraints and examples below are copied directly from the contract. A property omitted from a schema’s `required` array is optional, even when examples include it.\n\n';
  for (const [name, schema] of Object.entries(spec.components?.schemas || {})) {
    out += `### ${name}\n\n${schema.description || ''}\n\n<details><summary>View full ${name} schema</summary>\n\n\`\`\`json\n${JSON.stringify(schema, null, 2)}\n\`\`\`\n\n</details>\n\n`;
  }
  out += '## Authentication contract\n\n```json\n' + JSON.stringify({ security: spec.security ?? [], securitySchemes: spec.components?.securitySchemes ?? {} }, null, 2) + '\n```\n\nSee [access and tokens](/tokens/) for public usage and token requests.\n';
  return out;
}
