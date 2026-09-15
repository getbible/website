# Dictionaries API

Bring definitions, lexicons, and linked study resources into a Bible application. The Dictionaries API serves a catalog of dictionaries converted from approved CrossWire SWORD modules into plain-text JSON. A client can download a small word index for interactive search, retrieve one definition, follow related terms, or take an entire dictionary offline.

The API uses stable document addresses. Strong's lexicons connect directly to the tokens in GetBible scripture data: Greek `G3056` resolves to the Greek entry, and Hebrew `H0430` resolves to the Hebrew entry. General dictionaries expose their own path-safe entry identifiers through an index.

## Start here

```bash
curl --fail --silent --show-error \
  'https://dictionaries.getbible.net/v1/dictionaries.json'
```

Choose a dictionary from the response, check its metadata for language, provenance, license, and download size, then read its index or fetch an entry directly.

| Resource | Link |
| --- | --- |
| Complete v1 guide | [Dictionaries v1](/api/dictionaries/v1/) |
| Current catalog | [dictionaries.json](https://dictionaries.getbible.net/v1/dictionaries.json) |
| API service | [dictionaries.getbible.net](https://dictionaries.getbible.net/) |
| Upstream v1 documentation | [Version 1 documentation](https://dictionaries.getbible.net/v1/) |
| OpenAPI specification | [OpenAPI JSON](https://dictionaries.getbible.net/v1/openapi.json) |
| Builder source | [getbible/v1_study_builder](https://github.com/getbible/v1_study_builder) |
| Generated data | [getbible/dictionaries](https://github.com/getbible/dictionaries) |
| Public support | [GetBible support](https://git.vdm.dev/getBible/support) |

## What you can build

- A word-study panel that opens a Strong's definition from scripture.
- A dictionary picker organized by language and source.
- Fast local search using each dictionary's normalized word index.
- A study graph using forward links, backlinks, and scripture references.
- An offline reader using a whole-dictionary download and the integrity manifest.

Dictionary search is performed by your application over `index.json`; this static API does not have a server-side search query endpoint. For searching scripture text, use the [Search API](/api/search/).

## A connected study experience

Each definition contains plain text and may include `see_also`, `backlinks`, and `references`. The first two link to other entries in the same dictionary. Scripture references provide numeric GetBible coordinates and a canonical reference string that the [Query API](/api/query/) understands. Commentary material is available independently from the [Commentaries API](/api/commentaries/).

The Dictionaries API has its own v1 schema. Its version does not have to match the Bible API version selected by an application.

## Access and reuse

The published documents are public GET resources. No application token or request body is defined by the generated API contract. Each module publishes its source and license in its metadata: retain those details when redistributing a resource.

Version 1 documents contain no HTML markup. Preserve paragraphs when displaying definitions, and render text through a text-safe interface such as `textContent`. Content, catalogs, JSON Schemas, build provenance, and SHA-256 hashes are generated together by the study builder.

Read the [complete v1 guide](/api/dictionaries/v1/) for every endpoint, field model, Strong's key rules, search examples, integrity verification, and error behavior.

