# Bookmarks API

Build topical Bible discovery with a reviewed collection of subjects, verse references, colors, and translated topic names. The Bookmarks API lets an application move in both directions: from a topic to its scripture references, and from a verse to the topics associated with it.

The API stores references rather than scripture text. Use the [Bible API](/api/bible/) to retrieve verses in your chosen translation.

## Start here

```bash
curl --fail --silent --show-error \
  'https://bookmarks.getbible.net/v1/index.json'
```

The index exposes resource paths, schema and catalog versions, current counts, locale codes, and a checksum for the complete catalog. Follow it with the topic list:

```bash
curl --fail --silent --show-error \
  'https://bookmarks.getbible.net/v1/topics.json'
```

| Resource | Link |
| --- | --- |
| Complete v1 guide | [Bookmarks v1](/api/bookmarks/v1/) |
| Discovery document | [index.json](https://bookmarks.getbible.net/v1/index.json) |
| API service | [bookmarks.getbible.net](https://bookmarks.getbible.net/) |
| Upstream v1 documentation | [Version 1 documentation](https://bookmarks.getbible.net/v1/) |
| OpenAPI specification | [OpenAPI JSON](https://bookmarks.getbible.net/v1/openapi.json) |
| Catalog and builder source | [getbible/v1_bookmark_builder](https://github.com/getbible/v1_bookmark_builder) |
| Generated data | [getbible/bookmarks](https://github.com/getbible/bookmarks) |
| Public support | [GetBible support](https://git.vdm.dev/getBible/support) |

## Designed for readers and applications

Topic responses contain stable identifiers, English names, available translations, colors, and sorted `[book, chapter, verse]` coordinates. Book and chapter responses provide reverse lookups, so a Bible reader can display related topics next to a verse.

A client can load individual topics on demand, download the whole catalog for offline use, or cache one locale's translated names. English is always available; applications select their own language and apply English fallback where a translated name is missing.

## Public topics and personal bookmarks

This API publishes the project's shared topic catalog. It is a read-only static resource and does not store a user's personal bookmarks. Applications remain responsible for their own personal collections.

Contributions are changes to reviewed source files in the builder repository. There is no write endpoint in this API. The [contribution guide](https://github.com/getbible/v1_bookmark_builder/blob/main/docs/CONTRIBUTING.md) covers editing source files and submitting changes through GitHub.

## A collection with a purpose

The original collection grew from Brother Jaco van der Merwe's mission work and everyday conversations in Namibia. He collected verses by subject so that people could read what scripture says in response to their questions. His family continues to expand that work.

The catalog is intended as a practical aid to finding and sharing scripture. Its coordinates contain no Bible translation text; the builder and catalog are published under the Apache License 2.0.

Read the [complete v1 guide](/api/bookmarks/v1/) for all eleven routes, response models, localization, reverse lookup, caching, checksums, and contribution workflows.

