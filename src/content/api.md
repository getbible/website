# Build with the Get Bible APIs

Six API families give you Scripture, reference lookup, search and study resources. Choose the API for the job, then select its version for the complete integration guide and contract reference.

## Choose an API

| API | Use it to | Versions |
| --- | --- | --- |
| [Bible](/api/bible/) | Download translations, books, chapters and their checksums | [v2](/api/bible/v2/), [v3](/api/bible/v3/) |
| [Query](/api/query/) | Resolve a verse, chapter, range or combined reference | [v2](/api/query/v2/), [v3](/api/query/v3/) |
| [Search](/api/search/) | Find words and phrases with scopes and pagination | [v2](/api/search/v2/), [v3](/api/search/v3/) |
| [Dictionaries](/api/dictionaries/) | Look up original-language entries and translated definitions | [v1](/api/dictionaries/v1/) |
| [Commentaries](/api/commentaries/) | Read commentary on books, chapters and passages | [v1](/api/commentaries/v1/) |
| [Bookmarks](/api/bookmarks/) | Discover curated Bible topics and references | [v1](/api/bookmarks/v1/) |

## Start with a chapter

This retrieves John 3 in the King James Version:

```bash
curl --fail-with-body --silent --show-error \
  'https://api.getbible.net/v2/kjv/43/3.json'
```

The static Bible API publishes chapter JSON. Use the Query API when you want a specific verse or a reference range:

```bash
curl --fail-with-body --silent --show-error \
  'https://query.getbible.net/v3/kjv/John%203%3A16'
```

Look up the actual translation and book identifiers from the catalogs. For text matching and filtering, continue with the [Search API guide](/api/search/).

## Choose v2 or v3

The Bible, Query and Search APIs offer both versions. V3 preserves richer verse information where present, including lexical tokens and spans. Static v3 chapter data can also carry editorial layout metadata. Query and search return verse-based results rather than a complete chapter layout; do not assume chapter editorial data appears there.

Not every translation contains every optional v3 field. Keep the data returned by your selected version and check optional fields before reading them. Translation catalogs remain the place for complete metadata; query and search results keep their translation headers compact.

See [Bible v3](/api/bible/v3/), [Query v3](/api/query/v3/) and [Search v3](/api/search/v3/) for their exact response structures.

## Try the APIs in Postman

Every version page includes a downloadable Postman collection generated from its OpenAPI document. Download the collection, open Postman, choose **Import**, and select the JSON file. Review the collection variables and choose the request you want to send. Optional query parameters start disabled; enable those you need.

You can also copy the **live OpenAPI JSON** URL from a version page and paste it into Postman’s Import flow. Some source specifications use relative servers, so the generated collection resolves the actual service hostname for you.

| Collection | Importable JSON |
| --- | --- |
| Bible v2 | [Download](/postman/bible-v2.json) |
| Bible v3 | [Download](/postman/bible-v3.json) |
| Query v2 | [Download](/postman/query-v2.json) |
| Query v3 | [Download](/postman/query-v3.json) |
| Search v2 | [Download](/postman/search-v2.json) |
| Search v3 | [Download](/postman/search-v3.json) |
| Dictionaries v1 | [Download](/postman/dictionaries-v1.json) |
| Commentaries v1 | [Download](/postman/commentaries-v1.json) |
| Bookmarks v1 | [Download](/postman/bookmarks-v1.json) |

Postman is optional. Every guide includes cURL examples, and the source contracts can be used with other OpenAPI clients.

## Access, tokens and caching

Start with public access. Query, search and MCP can have domain-specific tokens for managed access and rate-limit allowances; tokens are not interchangeable between hosts. The static Bible and study data do not require a consumer API key in their published contracts. Read [access and tokens](/tokens/) for the request process and client guidance.

Cache reusable content, honor service response headers, and back off when rate-limited. Read the full translation or study-work metadata when you need rights and attribution information. Check the service-specific guides before depending on cache lifetimes, response sizes or optional data.

## Connect a library or AI client

- [Librarian](/project/librarian/) provides Python access to local or remote Scripture datasets.
- [The JavaScript loader](/project/loader/) embeds Scripture in existing websites.
- [Get Bible MCP](/mcp/) connects compatible AI clients to the APIs.
- [API builders](/project/builders/) explain how the published datasets are generated.

## Documentation and service addresses

These guides live on `getbible.net/api/<type>/<version>/`. Requests still go to the original `api.`, `query.`, `search.`, `dictionaries.`, `commentaries.` and `bookmarks.getbible.net` service hosts. Moving documentation does not change the API endpoints.

For all public support, use the [Get Bible support desk](https://git.vdm.dev/getBible/support). For private access enquiries, email [getBible@TrueChristian.church](mailto:getBible@TrueChristian.church).
