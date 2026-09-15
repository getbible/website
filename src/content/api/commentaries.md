# Commentaries API

Add historical commentary alongside scripture, from a single chapter through a complete offline collection. The Commentaries API publishes approved CrossWire SWORD commentaries as plain-text JSON addressed with the same numeric book, chapter, and verse coordinates used across GetBible.

A commentary may cover a small selection of passages or an extensive part of scripture. Discover actual coverage through its book index; applications do not need to assume every commentary contains every book.

## Start here

```bash
curl --fail --silent --show-error \
  'https://commentaries.getbible.net/v1/commentaries.json'
```

Then inspect one commentary's coverage and read a chapter:

```bash
curl --fail --silent --show-error \
  'https://commentaries.getbible.net/v1/clarke/books.json'

curl --fail --silent --show-error \
  'https://commentaries.getbible.net/v1/clarke/43/1.json'
```

| Resource | Link |
| --- | --- |
| Complete v1 guide | [Commentaries v1](/api/commentaries/v1/) |
| Current catalog | [commentaries.json](https://commentaries.getbible.net/v1/commentaries.json) |
| API service | [commentaries.getbible.net](https://commentaries.getbible.net/) |
| Upstream v1 documentation | [Version 1 documentation](https://commentaries.getbible.net/v1/) |
| OpenAPI specification | [OpenAPI JSON](https://commentaries.getbible.net/v1/openapi.json) |
| Builder source | [getbible/v1_study_builder](https://github.com/getbible/v1_study_builder) |
| Generated data | [getbible/commentaries](https://github.com/getbible/commentaries) |
| Public support | [GetBible support](https://git.vdm.dev/getBible/support) |

## Choose the right download

| Reading experience | Document |
| --- | --- |
| Show a chapter next to a Bible reader | `{commentary}/{book}/{chapter}.json` |
| Prepare one book for offline use | `{commentary}/{book}.json` |
| Download an entire commentary | `{commentary}.json` |
| List available books and chapters | `{commentary}/books.json` |
| Check provenance, license, and download size | `{commentary}/metadata.json` |

Chapter documents are embedded in book documents; book documents are embedded in whole-commentary documents. Applications can reuse the same rendering logic at each level.

## Verse ranges and introductions

One comment may discuss several verses. The API stores that comment once and records its coverage in a `verses` array. A client looking up a verse must inspect that array when present; comparing only the anchor `verse` would miss comments that cover a range.

Book introductions use chapter `0`. Chapter introductions use verse `0`. These are study material coordinates and should be displayed separately from scripture verses.

## Access and connected resources

The published API is public and read-only. It defines no token requirement, request body, or server-side filtering. Each module's metadata records provenance, licensing, and the Bible shape used to resolve citations. Commentary text is plain text, with structured scripture references available for links to the [Bible API](/api/bible/) or [Query API](/api/query/).

Use the [Dictionaries API](/api/dictionaries/) for word definitions and Strong's lexicons, and the [Bookmarks API](/api/bookmarks/) for topic-to-verse associations.

The [complete v1 guide](/api/commentaries/v1/) documents every resource, exact addressing rules, response models, copyable cURL examples, reference handling, checksums, and build health.

