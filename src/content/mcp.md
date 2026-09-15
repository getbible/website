---
title: GetBible MCP
description: Connect ChatGPT and other AI applications to scripture, search, dictionaries, commentaries and public topics through the Model Context Protocol.
---

# GetBible for AI applications

Connect an AI application to **https://mcp.getbible.net/** using **Streamable HTTP**. Public access is free and requires no account or token. A single connection gives the application structured tools for scripture, reference lookup, full-text search, dictionaries, commentaries and public Bible topics.

GetBible MCP is a read-only bridge to the [GetBible APIs](/api/). It retrieves published source material and keeps its provenance, native data and content rights. The same open-source Python package can run locally over stdio or be embedded in your own server. [Source repository](https://github.com/getbible/mcp) · [Python package](https://pypi.org/project/getbible-mcp/) · [Public support](https://git.vdm.dev/getBible/support).

## Connection details

| Setting | Value |
| --- | --- |
| Connection name | GetBible |
| Remote URL | `https://mcp.getbible.net/` |
| Transport | Streamable HTTP |
| Public authentication | No authentication |
| Default Bible, query and search version | `v3` |
| Other Bible, query and search version | Select `api_version: "v2"` explicitly |
| Dictionaries, commentaries and bookmarks | `v1` |
| Local command | `getbible-mcp --transport stdio` |
| Python requirement | Python 3.11 or later |
| Software license | GPL-2.0-or-later; content licenses remain separate |

Use the remote URL exactly. The official service places the MCP protocol at the domain root, so adding `/mcp`, `/v2` or `/v3` creates a different URL. Upstream API versions belong in tool arguments. An MCP URL accepts protocol requests; it is not a REST path for a Bible reference. [Connection reference](https://github.com/getbible/mcp/blob/main/docs/CLIENTS.md).

## Connect in ChatGPT developer mode

1. Open ChatGPT **Settings → Security and login** and enable **Developer mode**.
2. Open **Plugins**, select the **plus** button, and create an MCP connection named **GetBible**. A useful description is “Read and search Bible translations, dictionaries, commentaries and public topics.”
3. Enter `https://mcp.getbible.net/`, select the public HTTP connection method, and choose **No Authentication**.
4. Create the connection and inspect the discovered tools.
5. Start a new conversation, open the tools or plus menu, and enable your GetBible connection.
6. Try: “Use GetBible to retrieve John 3:16–19 in the King James Version. Cite the returned source.”

Developer mode availability depends on your account and workspace policy. After the server adds or changes tools, refresh the development connection and start a new conversation. These steps create a development connection; the repository's prepared plugin package does not establish approval in a public plugin directory. [Official OpenAI connection guide](https://developers.openai.com/plugins/deploy/connect-chatgpt) · [Developer mode documentation](https://developers.openai.com/api/docs/guides/developer-mode).

The public ChatGPT connection uses no authentication. A GetBible administrator-issued bearer token is not an OAuth sign-in or a ChatGPT API-key login. Use optional tokens only in clients whose secure authentication settings support the header specified by the administrators. [Access and tokens](/tokens/).

## Useful things to ask

- “Use GetBible to find the available Afrikaans translations, then show me Psalm 23 in the translation I choose.”
- “Find verses containing faith and hope in Romans and First Corinthians, with references and links to their sources.”
- “Retrieve John 1:1 using API v3. If its actual token data contains Strong's identifiers, look those up in a compatible dictionary and preserve the source attribution.”
- “Show me which commentary modules cover John 3. Read the selected module's comments that include verse 16, including comments spanning several verses.”
- “Find public topics connected to John 3 and retrieve the associated verses in KJV.”
- “Help me design an application using GetBible, including translation rights, version selection and the cache refresh policy.”

Specify the translation, source module and API version when they matter. A model should report an unavailable reference or missing commentary coverage instead of silently substituting another passage. Commentary is its author's interpretation; dictionary definitions and Bible quotations should remain distinguishable from the AI's explanation.

## What the connection covers

| Service argument | Versions | Content | Website guide |
| --- | --- | --- | --- |
| `api` | `v2`, `v3` | Translation catalogs, books, chapters, complete scopes, indexes and checksums | [Bible API](/api/bible/) |
| `query` | `v2`, `v3` | Individual, ranged and grouped Bible references | [Query API](/api/query/) |
| `search` | `v2`, `v3` | Full-text and reference search, filters, ranking, pagination and read-only POST | [Search API](/api/search/) |
| `dictionaries` | `v1` | Module discovery, indexes, entries, lexical links, provenance and checksums | [Dictionaries](/api/dictionaries/) |
| `commentaries` | `v1` | Module discovery, coverage, introductions, comments and checksums | [Commentaries](/api/commentaries/) |
| `bookmarks` | `v1` | Public topics, verse coordinates, localized names and checksums | [Bookmarks](/api/bookmarks/) |

There are nine versioned OpenAPI contracts behind these six service names. The generic tools expose the complete packaged contracts, while convenience tools simplify common tasks. The data is not flattened to a lowest common denominator: v3 tokens, spans, paragraphs and additional native fields remain available. Package releases and upstream API versions are independent.

## Tools

GetBible exposes the following 13 tools. Read the connection's discovered schemas before generating calls for exact parameter types, defaults and validation. Both Streamable HTTP and local stdio provide the same tool capabilities. [Tool implementation](https://github.com/getbible/mcp/blob/main/src/getbible_mcp/server.py).

| Tool | Purpose and inputs |
| --- | --- |
| `discover_apis` | List contracts, source URLs and resource URIs. Optional `service` and `api_version` narrow discovery. |
| `describe_api_operation` | Require `service` and `api_version`; omit `operation_id` to list operations, or supply it for exact inputs and response schemas. |
| `call_api_operation` | Require `service`, `api_version`, `operation_id`; send named path/query inputs in `parameters` and a documented search POST object in `body`. |
| `list_translations` | Retrieve the selected version's catalog, including language and publisher metadata. `api_version` defaults to `v3`. |
| `list_books` | Discover numbers, localized names and hashes. Defaults to `translation: "kjv"` and `api_version: "v3"`. |
| `list_chapters` | Discover chapter identifiers and hashes for a required `translation` and positive integer `book`. |
| `get_scripture` | Read a chapter, book or translation with before/after hash consistency checks. Provide `book` and `chapter` for a chapter; omit `chapter` for a book; omit both for a translation. |
| `query_verses` | Resolve `references` of 1–512 characters. Translation defaults to KJV; explicit versions prevent accidental mixing. |
| `search_verses` | Search 1–500 characters of text with typed filters, pagination and version selection. |
| `search_dictionary_entries` | Find entry identifiers in a freshly fetched dictionary index. Required `dictionary` and `query`; `match` is `exact`, `prefix` or `contains`; `limit` is 1–100, default 20; `offset` starts at 0. |
| `get_hash` | Read a scope's Bible SHA-1. `kind` is `translation`, `book` or `chapter`; provide the coordinates required by that scope. |
| `get_hash_manifest` | Read bulk hashes. `kind` is `all_translations`, `translation` or `book`; provide applicable translation/book inputs. |
| `check_for_updates` | Compare 1–100 saved scope records. Each item carries its own `api_version`, coordinates and actual `current_hash`; the result describes required invalidation. |

All these tools are read-only and idempotent. Search POST submits a lookup; it does not publish content. MCP cannot edit a Bible, upload a translation or change a user's personal bookmarks. Generic operations accept declared contract routes, rather than arbitrary destination URLs.

### Search filters

| Argument | Supported values or bounds |
| --- | --- |
| `words` | `all` (default), `any`, `phrase` |
| `match` | `whole_word` (default), `substring` |
| `case_sensitive` | Boolean, default `false` |
| `diacritics` | `fold` (default), `exact`, `insensitive`, `sensitive` |
| `scope` | `bible` (default), `old_testament`, `new_testament`, `deuterocanon` |
| `book` | Array of book numbers or names; at most 83 items |
| `books` | Comma-separated book selection |
| `exclude` | Array of excluded terms; at most 32 items |
| `proximity` | Integer 0–100; requires `words: "all"` |
| `sort` | `canonical` (default), `relevance` |
| `limit` | Integer 1–100, default 100 |
| `offset` | Integer 0–10,000, default 0 |

A search recognized as a Bible reference may follow reference lookup behavior instead of ordinary full-text filters. Inspect the native response and its pagination. Do not assume that an empty or truncated page represents the entire dataset.

## Copyable tool examples

These objects describe a tool and its arguments for an MCP client or Inspector. They are not complete JSON-RPC requests. Your client discovers the protocol and supplies the appropriate request envelope.

### Retrieve a passage

```json
{
  "tool": "query_verses",
  "arguments": {
    "translation": "kjv",
    "references": "John 3:16-19; 1 John 3:16-19,22",
    "api_version": "v3"
  }
}
```

### Retrieve a chapter with its checksum

```json
{
  "tool": "get_scripture",
  "arguments": {
    "translation": "kjv",
    "book": 43,
    "chapter": 3,
    "api_version": "v3"
  }
}
```

### Search within selected books

```json
{
  "tool": "search_verses",
  "arguments": {
    "search": "faith hope",
    "translation": "kjv",
    "api_version": "v3",
    "words": "any",
    "book": [45, 46],
    "sort": "relevance",
    "limit": 25,
    "offset": 0
  }
}
```

Preserve the native `query`, `results` and `matches` envelope. For full-text pages, inspect `query.has_more` and retain the same filters while increasing the offset by the chosen page size.

### Inspect and call a complete API operation

```json
{
  "tool": "describe_api_operation",
  "arguments": {
    "service": "search",
    "api_version": "v3",
    "operation_id": "searchTranslationPost"
  }
}
```

```json
{
  "tool": "call_api_operation",
  "arguments": {
    "service": "search",
    "api_version": "v3",
    "operation_id": "searchTranslationPost",
    "parameters": {"translation": "kjv"},
    "body": {"q": "faith hope", "words": "all", "proximity": 10, "limit": 25}
  }
}
```

Operation identifiers are scoped to a service and version. Preserve the returned `input_name` and JSON types. Repeated query values are arrays; a colliding path/query parameter uses the plain path name and `query.` prefix for the query input. For search POST, a query parameter overrides the body value and a path value overrides both. POST results use `no-store`. [More source examples](https://github.com/getbible/mcp/blob/main/site/v2/examples.md).

## Dictionaries: discover, match, retrieve

Start with `call_api_operation` using `service: "dictionaries"`, `api_version: "v1"`, `operation_id: "listDictionaries"`. Choose an actual returned `dictionaries[].id` by source, language and purpose. Read `getDictionaryMetadata` with that ID before presenting definitions; retain the module's attribution, license, distribution notes and provenance.

For a discovered `strongsgreek` module and an actual Strong's token `G3056`, these calls locate and retrieve the entry:

```json
{
  "tool": "search_dictionary_entries",
  "arguments": {
    "dictionary": "strongsgreek",
    "query": "G3056",
    "match": "exact",
    "limit": 20,
    "offset": 0
  }
}
```

```json
{
  "tool": "call_api_operation",
  "arguments": {
    "service": "dictionaries",
    "api_version": "v1",
    "operation_id": "getDictionaryEntry",
    "parameters": {"dictionary": "strongsgreek", "entry": "G3056"}
  }
}
```

Pass the exact identifier returned by the index. An entry filename cannot safely be guessed from a headword; several definitions can share a key and use occurrence suffixes such as `--2`. The search helper matches headwords, IDs and aliases, not the full text of definitions. Text matching ignores case and combining accents, while identifier matching preserves exact case. Follow `next_offset` with unchanged inputs until no further relevant results remain.

For integrations that need a complete dictionary index, `getDictionaryIndex` through `call_api_operation` returns the selected module's full index. Account for its size when processing it in your application. Prefer `search_dictionary_entries` for individual word lookups, and do not claim no match after seeing only a truncated index. There is no static dictionary `?q=` route, and `search_verses` searches scripture rather than dictionary definitions.

Preserve native Strong's tokens, including Hebrew `H0` prefixes such as `H0430`. An English word alone does not establish its original-language lemma. Use the passage's actual token data, retain ambiguous identifiers, and never invent annotations missing from the source.

Optional `see_also` and `backlinks` fields describe directed links within a module. Fetch relevant linked entries by their supplied IDs, retain link direction, and stop cycles with a visited set. These links are not automatically proof of synonymy or etymology. Scripture `references` are separate: resolve their canonical `ref` through `query_verses` in the selected Bible version and translation. [Study workflow source](https://github.com/getbible/mcp/blob/main/docs/STUDY_WORKFLOWS.md).

## Commentaries: check coverage first

Use `listCommentaries`, choose a returned module ID, and read `getCommentaryMetadata`. Then call `getCommentaryBooks` to discover the actual book and chapter coverage. Do not assume every module covers all Bible books or continuous chapters.

If the discovered `mhc` module includes book 43, chapter 3:

```json
{
  "tool": "call_api_operation",
  "arguments": {
    "service": "commentaries",
    "api_version": "v1",
    "operation_id": "getCommentaryChapter",
    "parameters": {"commentary": "mhc", "book": 43, "chapter": 3}
  }
}
```

To select comments on verse 16, include every entry whose `verses` array contains 16; if that array is absent, compare `verse`. A range anchored at verse 14 may cover verse 16. Preserve multiple matching comments and their original text, ranges, `osis` and references.

A discovered chapter 0 is a book introduction. Verse 0 within a chapter is introductory content. Keep both as context without renumbering them. Cross-chapter comments may occur in each affected chapter; avoid repeating the same quotation while retaining the full coverage. Fetch Bible text separately with `query_verses` and cite the commentary module and the returned `source.url`.

## Public topics and bookmarks

```json
{
  "tool": "call_api_operation",
  "arguments": {
    "service": "bookmarks",
    "api_version": "v1",
    "operation_id": "getTopics"
  }
}
```

```json
{
  "tool": "call_api_operation",
  "arguments": {
    "service": "bookmarks",
    "api_version": "v1",
    "operation_id": "getChapter",
    "parameters": {"book": 43, "chapter": 3}
  }
}
```

The bookmark dataset supplies topics and verse coordinates, not scripture text. Resolve selected coordinates through the Bible or query API in the reader's chosen translation. These are public associations; the MCP does not read or write a person's private bookmarks.

## Run the Python package locally

The Python distribution is named `getbible-mcp`; its import package is `getbible_mcp`. Use Python 3.11 or later. An isolated environment gives the MCP client an explicit executable and keeps dependencies separate from system Python.

```bash
python3 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install getbible-mcp
.venv/bin/getbible-mcp --version
.venv/bin/getbible-mcp --transport stdio
```

This installs the published package and its compatible dependencies. For production applications, record the tested release in your dependency lockfile and review [package releases](https://pypi.org/project/getbible-mcp/#history) before updating. Running the stdio command directly waits for protocol input; it is normally launched by an MCP host.

For a per-user executable managed by pipx:

```bash
pipx install getbible-mcp
command -v getbible-mcp
```

In a client using the conventional `mcpServers` configuration, a PATH-resolved executable looks like this:

```json
{
  "mcpServers": {
    "getbible": {
      "command": "getbible-mcp",
      "args": ["--transport", "stdio"]
    }
  }
}
```

If a desktop host cannot resolve that command, use the absolute executable path returned by `command -v` or by `realpath .venv/bin/getbible-mcp` for a virtual environment. The host's working directory and PATH may differ from your terminal. Let it launch the installed command directly. Standard output is reserved for MCP messages; diagnostics belong on standard error.

Local stdio still reads the configured upstream GetBible services. It does not download a full offline Bible automatically. Ordinary Python applications that want scripture without an MCP host can use the [Librarian](/project/librarian/) or call the REST APIs.

## Call the remote MCP from Python

Installing `getbible-mcp` also installs its supported official Python MCP SDK. This example uses the SDK's `Client` interface and delegates discovery, protocol metadata and transport handling to the library.

```bash
python3 -m venv .venv
.venv/bin/python -m pip install getbible-mcp
```

Save the following as `query_getbible.py` and run `.venv/bin/python query_getbible.py`:

```python
import asyncio
import json

from mcp import Client
from mcp.client.streamable_http import streamable_http_client


async def main() -> None:
    async with Client(
        streamable_http_client("https://mcp.getbible.net/"), cache=None
    ) as client:
        result = await client.call_tool(
            "query_verses",
            {
                "translation": "kjv",
                "references": "John 3:16-19",
                "api_version": "v3",
            },
        )
        if result.is_error:
            raise RuntimeError("GetBible returned an MCP tool error; inspect the result in your client.")
        if result.structured_content is None:
            raise RuntimeError("GetBible returned no structured result.")
        print(json.dumps(result.structured_content, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
```

An HTTP 200 response alone does not establish a successful tool lookup: check the MCP error flag. Preserve the structured result's native `data`, `source` and `cache` fields. Applications should also handle transport exceptions and rate limits. [Python connection example](https://github.com/getbible/mcp/blob/main/docs/CLIENTS.md).

## Host or embed your own MCP server

The package can expose Streamable HTTP locally:

```bash
.venv/bin/getbible-mcp --transport streamable-http
```

With default settings, this listens at `http://127.0.0.1:3100/mcp`. This is the package's local default, distinct from the official remote root endpoint. Supply that exact URL to a local Inspector. Your application owns HTTPS termination, process management and public hosting.

For direct Python embedding, save this as `serve_getbible.py` after installing the package:

```python
import uvicorn

from getbible_mcp import create_app


app = create_app(path="/mcp")


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=3100)
```

Run it with `.venv/bin/python serve_getbible.py`. `create_app` returns an ASGI application; `create_runtime` additionally exposes the server, upstream client and resolved settings. Importing the package creates no default client or network request. If mounting the app inside another ASGI application, the parent must enter `child.router.lifespan_context(child)` during its own lifespan so startup and HTTP-client cleanup run correctly. [Architecture and embedding](https://github.com/getbible/mcp/blob/main/docs/ARCHITECTURE.md).

### Trusted upstream configuration

| Environment variable | Default upstream |
| --- | --- |
| `GETBIBLE_API_V2_BASE` | `https://api.getbible.net/v2` |
| `GETBIBLE_API_V3_BASE` | `https://api.getbible.net/v3` |
| `GETBIBLE_QUERY_V2_BASE` | `https://query.getbible.net/v2` |
| `GETBIBLE_QUERY_V3_BASE` | `https://query.getbible.net/v3` |
| `GETBIBLE_SEARCH_V2_BASE` | `https://search.getbible.net/v2` |
| `GETBIBLE_SEARCH_V3_BASE` | `https://search.getbible.net/v3` |
| `GETBIBLE_DICTIONARIES_BASE` | `https://dictionaries.getbible.net/v1` |
| `GETBIBLE_COMMENTARIES_BASE` | `https://commentaries.getbible.net/v1` |
| `GETBIBLE_BOOKMARKS_BASE` | `https://bookmarks.getbible.net/v1` |

Mirror URLs must implement the corresponding versioned contract and end in its version path. These are trusted operator settings; a tool caller cannot redirect requests to a different host.

Other controls include `GETBIBLE_MCP_BIND_HOST` (default `127.0.0.1`), `GETBIBLE_MCP_BIND_PORT` (3100), `GETBIBLE_MCP_REQUEST_TIMEOUT` (20 seconds), `GETBIBLE_MCP_MAX_RESPONSE_BYTES` (33,554,432 bytes), and `GETBIBLE_MCP_MAX_PARALLEL_HASH_CHECKS` (10). Configure host and origin allowlists for a custom public deployment with `GETBIBLE_MCP_ALLOWED_HOSTS` and `GETBIBLE_MCP_ALLOWED_ORIGINS`. These memory, timeout and security settings do not change upstream access quotas. [Configuration reference](https://github.com/getbible/mcp/blob/main/docs/OPERATIONS.md).

## Discovery resources and integration prompt

| MCP resource or prompt | Purpose |
| --- | --- |
| `getbible://docs/api` | Complete integration guidance |
| `getbible://docs/cache-policy` | Expiry, hashes and synchronization |
| `getbible://docs/usage-policy` | Public access, limits and content rights |
| `getbible://docs/study-workflows` | Dictionary and commentary procedures |
| `getbible://openapi/{service}/{version}` | A complete bundled OpenAPI document |
| `design_getbible_integration` | Prompt for planning an integration |

For example, `getbible://openapi/search/v3` identifies the search v3 contract. These are MCP resource identifiers, read through the connected client rather than a normal web browser. The website's corresponding REST guides link to the upstream OpenAPI JSON documents as well.

## Freshness and content integrity

The MCP does not keep an upstream result cache and recommends using query and search responses directly. If your application caches an eligible response, its key must include service, version, operation and every effective input, including translation, filters and page offset.

Honor `Cache-Control`, `Age`, response dates and `Expires`. A shorter remaining lifetime wins. `no-store` prohibits persistence; `no-cache` requires revalidation. Never retain content beyond **30 days** without refreshing it. An unchanged checksum does not restart that lifetime.

Bible `.sha` files use SHA-1. Dictionary and commentary `hashes.json` manifests and bookmark `checksums.json` use SHA-256. Compare the checksum belonging to the exact scope or document path. A changed translation invalidates its cached books and chapters; a changed book invalidates its chapters. Fetch replacements into temporary storage and replace the old record atomically.

`get_scripture` checks the scope hash before and after retrieving JSON, retrying once if publication changes during the read. This consistency check is separate from verifying downloaded bytes and from publisher identity. Query results do not carry an invented chapter-hash envelope. Search `query.sha` describes the source translation, not the result payload. [Complete cache policy](https://github.com/getbible/mcp/blob/main/site/v2/cache-policy.md).

## Test a connection

Use MCP Inspector to discover and call tools with the actual transport:

```bash
npx @modelcontextprotocol/inspector@latest
```

Select Streamable HTTP and enter `https://mcp.getbible.net/`. For an installed local package:

```bash
npx @modelcontextprotocol/inspector@latest \
  .venv/bin/getbible-mcp --transport stdio
```

Discover tools, call `discover_apis`, inspect an operation schema, query a known passage, and verify errors for invalid inputs. The repository includes a bounded, explicit endpoint probe for contributors:

```bash
git clone https://github.com/getbible/mcp.git getbible-mcp
cd getbible-mcp
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-dev.txt
.venv/bin/python -m pip install --no-deps -e .
.venv/bin/python scripts/check_endpoint.py
.venv/bin/python scripts/check_endpoint.py --upstreams
```

The optional upstream check performs representative read-only requests across all nine contracts. It is not a full production load test. Use `--expect-version` only when checking a known deployment target. A browser GET may wait on a protocol event stream, and `/healthz` only identifies the running package; actual MCP calls establish whether lookups work.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Connection fails at `/mcp` or `/v3` | The official URL is `https://mcp.getbible.net/`. Remove added path segments. |
| Browser request hangs | Use an MCP client or Inspector; the endpoint is a protocol service and may stream. |
| A documented tool is missing | Refresh the connection's tools and metadata, confirm the tool is enabled in your client, then start a new conversation. |
| HTTP 429 | Honor `Retry-After`, back off and reduce concurrency. See [access policy](/tokens/). |
| HTTP 200 but no useful data | Inspect MCP `isError` and the structured error; transport success does not mean the upstream lookup succeeded. |
| Invalid or unresolved reference | Correct the reference or translation. No fallback passage should be substituted. |
| Dictionary term not found | Discover the right source/language, search its index, retain exact IDs and check all relevant pages. There is no definition-text search endpoint. |
| Commentary misses a requested verse | Inspect actual coverage and every entry's `verses` array, including ranges anchored at earlier verses. |
| Local command not found | Configure the absolute installed executable path in the MCP host and confirm Python 3.11+. |
| Local protocol output is malformed | Keep application logs on stderr and stdout exclusively for MCP messages. |
| Embedded application fails at startup | Run the child ASGI lifespan from the parent application. |
| Whole module or translation is too large | Prefer chapters or individual entries and respect the configured response-size limit. |

For public help with any GetBible project, use the [single support desk](https://git.vdm.dev/getBible/support). For credentials or private questions, email [getBible@TrueChristian.church](mailto:getBible@TrueChristian.church). Preserve translation and module licenses when displaying or redistributing content; the MCP software license does not relicense those materials.
