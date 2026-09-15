# The builders behind the APIs

GetBible's study and bookmark APIs are generated documents. Their builders turn source material into validated, versioned JSON trees, publish those files to dedicated repositories, and generate the OpenAPI contracts alongside the data. Applications consume the files without running a builder.

| Builder | Source | Published output | API guide |
| --- | --- | --- | --- |
| [Study Builder v1](https://github.com/getbible/v1_study_builder) | Approved CrossWire SWORD commentary and dictionary modules | [Commentaries](https://github.com/getbible/commentaries) and [dictionaries](https://github.com/getbible/dictionaries), under `v1/` | [Commentaries](/api/commentaries/), [Dictionaries](/api/dictionaries/) |
| [Bookmark Builder v1](https://github.com/getbible/v1_bookmark_builder) | Reviewed topic, verse-link, and locale source files | [Bookmarks](https://github.com/getbible/bookmarks), under `v1/` | [Bookmarks](/api/bookmarks/) |

## Study Builder v1

Study Builder converts licensed, policy-approved CrossWire commentary and dictionary resources into plain-text JSON. A separate, pinned [getbiblesword](/project/getbiblesword/) executable extracts the SWORD modules; Python validates the extraction contract, normalizes the content, resolves scripture references, and writes the public documents.

The builder uses the [Librarian](/project/librarian/) reference engine and Bible API v2 translation structure at build time. Numeric book, chapter, and verse coordinates come from the API rather than a separate hardcoded Bible shape. Module metadata records the selected versification, translation shape, naming language, and reference-resolution tables.

### What the builder guarantees

- The extraction stream is independently checked for version, record order, counts, byte lengths, hashes, and successful completion.
- Public content is plain text, with paragraph structure and structured scripture references.
- Commentary text shared across verse ranges is stored once per chapter, with explicit verse coverage.
- Dictionary IDs are deterministic; duplicate definitions remain available as separate entries.
- Every document is checked against its published JSON Schema before writing.
- `hashes.json` describes every other generated document and the builder-owned paths.
- Unchanged module content rebuilds to identical bytes.
- Failed individual modules are reported; previously verified output can be retained while other valid modules publish.
- The default maximum individual document size is 95 MiB.
- The builder owns only the version directories in downstream repositories.

### Build locally

Python 3.12 is used by the production workflow. The published extractor supports Linux x86-64 and ARM64; its asset, digest, version, and contract are pinned in the repository manifest.

```bash
git clone https://github.com/getbible/v1_study_builder.git
cd v1_study_builder

python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -e '.[dev]'

study-builder engine install
study-builder engine verify
study-builder catalog
study-builder build --resource all
```

The extractor is downloaded from a pinned public release and verified by SHA-256. It does not require a GitHub token. A deliberately selected local executable must still report the pinned version and contract.

Build one commentary for development:

```bash
study-builder build --resource commentaries --module Clarke --refresh
python scripts/validate_build.py --resource commentaries --module Clarke
```

A limited module selection cannot publish with `--push`. Production publication uses a full resource selection so that a partial selection cannot accidentally replace a complete catalog.

Run the repository checks:

```bash
python -m ruff check src tests scripts
python -m ruff format --check src tests scripts
python -m pytest
```

### Caching and offline builds

The builder caches the CrossWire catalog, source packages, extractor, and Bible shape. Online builds check the Bible API hash and refresh cached structure when it changes. No scripture text is included in the study output.

`--offline` uses verified cached inputs only. It cannot be combined with `--refresh`; missing inputs fail the build rather than silently initiating a download. `--dry-run` previews approved work without downloading source packages or installing the extractor.

### Automated publication

The production workflow is scheduled for 04:12 UTC on the first day of each month and can also be run manually. Manual controls select the resource, refresh behavior, and publication.

Publication uses the repository's signing identity and SSH deployment credentials. If the required publication secrets are incomplete, the study workflow still builds locally and preserves output and reports without pushing. A full publication command is:

```bash
study-builder build --resource all --pull --push
```

Each output tree includes `build.json`, `build-report.json`, `hashes.json`, `openapi.json`, and its JSON Schemas. Read the build report to distinguish newly rebuilt modules from retained output. Compilation status is separate from a later publication failure.

For operational details, read [build recovery](https://github.com/getbible/v1_study_builder/blob/main/docs/build-recovery.md) and [target repository responsibilities](https://github.com/getbible/v1_study_builder/blob/main/docs/target-repositories.md). Serving the generated trees is a separate deployment concern.

## Bookmark Builder v1

The bookmark builder is both the custodian of the reviewed topic catalog and the program that publishes it. Its source files contain metadata, translated topic names, and translation-independent verse coordinates. They do not contain scripture text.

| Source file | Purpose |
| --- | --- |
| `data/topics.json` | Stable IDs, English names, colors, aliases, and default flags |
| `data/links/{topic}.json` | Sorted verse-coordinate triples for one topic |
| `data/locales/{locale}.json` | Topic-name translations for one locale |

The original collection grew from Brother Jaco van der Merwe's mission work and personal evangelism in Namibia. He gathered verses by subject to answer questions from scripture, and his family continues to expand the catalog.

### Build and validate locally

The builder requires Python 3.12 or newer and uses the standard library. Git is required for repository workflows.

```bash
git clone https://github.com/getbible/v1_bookmark_builder.git
cd v1_bookmark_builder

python3 src/builder.py validate
python3 src/builder.py build --output v1
python3 src/builder.py build --output v1 --check
```

Run CI-equivalent checks in a virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-dev.txt
bash scripts/run-checks.sh
```

### Commands and source editing

| Command | Purpose |
| --- | --- |
| `validate` | Validate every source file and report catalog counts |
| `normalize` | Rewrite already-valid sources into canonical formatting |
| `build --output v1` | Generate the complete static tree atomically |
| `build --output v1 --check` | Check whether existing output matches a fresh build |
| `import-bundle --check` | Validate a robot contribution bundle without applying it |
| `import-bundle` | Apply a valid contribution bundle to the source files |

Validation failures return exit code 1 with the file and violated rule on standard error. Normalization is formatting, not a repair mechanism for invalid data.

The [data guide](https://github.com/getbible/v1_bookmark_builder/blob/main/docs/DATA.md) explains which files are involved in adding, renaming, translating, or deleting topics. Changes are reviewed through GitHub. Deleting a topic removes it from the next published tree; git history is the record of earlier content.

### Output and determinism

Every build produces discovery, topic summaries, full topic documents, aggregate catalogs, reverse verse indexes, locale documents, checksums, and OpenAPI 3.1.1. All canonical books and chapters have reverse-index files, even when their association maps are empty.

`index.json.checksum` hashes the exact `all.json` bytes, and `catalog_version` advances when that content changes. `checksums.json` hashes every other generated file, including the OpenAPI description. Documentation changes therefore publish even if the catalog version remains unchanged.

The output is built beside the target and swapped in atomically. Identical input produces identical output. `build --check` detects stale or missing documents, including the generated specification.

### Automated publication and contributions

The production workflow runs after pushes to `main` or `master`, and through manual dispatch. It uses Python 3.13, validates and builds the source, then pushes a signed change to the generated `getbible/bookmarks` repository only when output differs.

`run.sh` wraps source validation, building, and downstream git publication. Repository secrets supply the signing and deployment identity; the downstream repository and branch have optional overrides. These are builder publication credentials, not API consumer tokens.

The API itself has no write or authentication endpoint. A human contribution uses a branch and pull request; an authorized application can prepare source changes through GitHub. See [contributing](https://github.com/getbible/v1_bookmark_builder/blob/main/docs/CONTRIBUTING.md), [publishing](https://github.com/getbible/v1_bookmark_builder/blob/main/docs/PUBLISHING.md), and [CLI reference](https://github.com/getbible/v1_bookmark_builder/blob/main/docs/CLI.md).

## Support and source of truth

All public questions, reports, and requests can go to the [shared GetBible support desk](https://git.vdm.dev/getBible/support).

The generated OpenAPI document beside each API is the machine-readable contract for that tree. The builder source documents describe how the data is validated and published. Module-specific licenses and provenance travel with study metadata; the bookmark builder and catalog use Apache License 2.0.

## Sources

- [Study Builder source and contracts](https://github.com/getbible/v1_study_builder)
- [Study production workflow](https://github.com/getbible/v1_study_builder/blob/main/.github/workflows/build.yml)
- [Bookmark Builder source and catalog history](https://github.com/getbible/v1_bookmark_builder)
- [Bookmark production workflow](https://github.com/getbible/v1_bookmark_builder/blob/main/.github/workflows/build.yml)
- [Bookmark OpenAPI guide](https://github.com/getbible/v1_bookmark_builder/blob/main/docs/OPENAPI.md)

## Bible v2 builder

The [v2 builder](https://github.com/getbible/v2_builder) creates the static Scripture tree used by [Bible API v2](/api/bible/v2/). It reads configured CrossWire SWORD modules and produces whole-translation, book and chapter JSON documents. The build adds discovery indexes, change checksums and a generated OpenAPI 3.1 description.

Two outputs serve different purposes:

| Output | Default folder | Contents |
| --- | --- | --- |
| Scripture tree | `repo/v2_scripture` | Translation/book/chapter JSON, indexes, OpenAPI and checksums |
| Public hash companion | `repo/v2` | Hashes, JSON/text indexes and OpenAPI without the full Scripture documents |

Every JSON file has a `.sha` sibling. The build's final checksum pass creates or corrects missing/mismatched checksums and removes orphaned hashes. Indexes are available as JSON and tab-separated `.txt`. The reserved names `translations`, `books`, `chapters`, `checksum` and `openapi` are never treated as translation IDs.

Start by inspecting the repository and its command options:

```bash
git clone https://github.com/getbible/v2_builder.git
cd v2_builder
bash ./run.sh --help
```

Follow the [repository installation instructions](https://github.com/getbible/v2_builder#installation) before a complete build. Its implementation uses Python, PySword and shell helpers. `--bconf` selects the module-to-abbreviation map, `--api` chooses the output locations, `--hashonly` hashes existing data, and `--pull`/`--push` enable configured repository publication. A full catalogue build is substantially larger than fetching an API chapter; use the published API when you only need to consume Scripture.

The project asks maintainers of distributed copies to refresh at least weekly, retain checksum handling and preserve the connection between source text and published hashes. Full Scripture repositories must follow the [builder's publication guidelines](https://github.com/getbible/v2_builder#guidelines); the hash companion is intended for public change verification. Report a public deployment through the central [GetBible support desk](https://git.vdm.dev/getBible/support).

[Source repository](https://github.com/getbible/v2_builder) · [Build workflow](https://github.com/getbible/v2_builder/actions/workflows/build.yml) · [v2 API guide](/api/bible/v2/) · [OpenAPI JSON](https://api.getbible.net/v2/openapi.json)

## Bible v3 builder

The [v3 builder](https://github.com/getbible/v3_builder) generates [Bible API v3](/api/bible/v3/) using the official SWORD engine through the separately released [GetBibleSWORD executable](/project/getbiblesword/). C++ handles native extraction; Python validates the extraction contract and produces compact Scripture JSON.

The pipeline downloads approved modules, extracts one transient NDJSON contract per module, validates its framing and integrity, converts the data, writes indexes and hashes, generates OpenAPI and publishes configured output repositories. Temporary module archives, SWORD installations and extraction streams are discarded after the attempt. Those extraction internals are not copied into the public reading API.

Version 3 preserves the core chapter/verse fields and adds source-derived `tokens`, `spans`, paragraph starts, introductions, book titles and chapter `editorial`. The same chapter editorial data is emitted in whole-translation, book and standalone chapter representations. Known book numbers remain stable; new source identities receive deterministic extension numbers. Books containing only titles or introductory material can be retained.

### Local validation build

The current native pipeline requires Python 3.12 or later and Linux x86-64 or ARM64 for its published GetBibleSWORD executable.

```bash
git clone https://github.com/getbible/v3_builder.git
cd v3_builder

python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt -r requirements-dev.txt

python scripts/install_getbiblesword.py
export GETBIBLESWORD_BIN="$PWD/.tools/getbiblesword"

python src/builder.py --test
```

The native installer follows the checked-in release policy, resolves an exact stable release for the build, checks its release asset and records provenance. `--test` builds representative modules; `python src/builder.py` builds the configured catalogue. Publication credentials and repository destinations are separate configuration, so local validation does not require a contributor to publish data.

| Option | Purpose |
| --- | --- |
| `--getbiblesword` | Native executable path or command |
| `--bconf` | Requested module-to-abbreviation mapping |
| `--publication-policy` | Explicit source publication approval manifest |
| `--api-base-url` | Public host plus one version segment recorded in index URLs |
| `--contracts` | Temporary validated extraction-contract directory |
| `--sword-root` | Explicit temporary SWORD installation |
| `--hash-only` | Rebuild hashes for existing output |
| `--dry` | Inspect the configured build plan without executing it |

The generated OpenAPI embeds its schemas and uses version-prefixed paths without assuming a host. Its schema source is checked in under [`schema/`](https://github.com/getbible/v3_builder/tree/master/schema). Every JSON resource has a hash companion. Scripture publication completes before the derived hash repository is published, and oversized output or failed extraction stops publication.

### Contributing and checking changes

```bash
# Deterministic unit tests
python -m pytest tests/ -v

# Native integration after installing the executable
python -m pytest tests_integration/ -v --run-integration
```

The repository provides unit/integration CI, a native smoke workflow, full-catalogue validation, preview builds and a fresh KJV inspection workflow. Changes to emitted data belong with matching schema updates and conformance checks. New translation publication requires source rights review and explicit approval in the publication policy; the software licence does not relicense module content.

[Source repository](https://github.com/getbible/v3_builder) · [Native pipeline](https://github.com/getbible/v3_builder/blob/master/docs/getbiblesword-pipeline.md) · [Output contract](https://github.com/getbible/v3_builder/blob/master/docs/static-output.md) · [Publication policy](https://github.com/getbible/v3_builder/blob/master/docs/publication-policy.md) · [v3 API guide](/api/bible/v3/) · [OpenAPI JSON](https://api.getbible.net/v3/openapi.json)
