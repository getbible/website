# Librarian — Python Scripture library

Resolve Bible references, retrieve chapters and verses, and search translations from Python. Librarian powers GetBible services and also works in standalone scripts or against a local API-compatible mirror.

[Repository](https://github.com/getbible/librarian) · [Support](https://git.vdm.dev/getBible/support) · [All projects](/project/)

The Python package name is `getbible`; the project repository is `librarian`. Package versions and Bible API versions are separate. The source reviewed here documents API v2 as its default; do not assume changing a package major version automatically selects Bible API v3. Select a release whose documented data contract matches your deployment.

GetBible Librarian is the Python library used to resolve scripture references, retrieve verses, and perform Unicode-aware searches against GetBible API translations. It supports standalone scripts as well as threaded and multi-process API services.

- Primary project home: <https://git.vdm.dev/getBible/librarian>
- GitHub deployment and releases: <https://github.com/getbible/librarian>
- GetBible API v2: <https://api.getbible.net/v2/translations.json>
- PyPI: <https://pypi.org/project/getbible/>

## Installation

```bash
python -m pip install getbible
```

Python 3.10 or newer is required.

Version 3.0 narrows translation metadata in reference and search responses to
six API fields. See the [field contract and migration](https://github.com/getbible/librarian/blob/HEAD/docs/TRANSLATION_METADATA.md)
before upgrading from 2.x. This source prepares `3.0.0`; pin
`getbible==3.0.0` after that version has been published.

## Retrieve scripture

```python
import json

from getbible import GetBible


bible = GetBible()

selection = bible.select("Genesis 1:1-3;John 3:16", "kjv")
print(json.dumps(selection, ensure_ascii=False, indent=2))

encoded = bible.scripture("Psalm 23:1-6", "kjv")
print(encoded)
```

`select()` returns the established chapter-keyed dictionary. `scripture()` returns the same structure encoded as JSON.

Each chapter includes only these translation fields: `translation`,
`abbreviation`, `lang`, `language`, `direction`, and `encoding`, as present in
the source. Book/chapter metadata, `ref`, and `verses` keep their existing
structure.

## Search scripture

```python
import json

from getbible import GetBible, SearchBible, SearchLimits


bible = GetBible(
    search_limits=SearchLimits(
        max_work_units=50_000_000,
        max_response_bytes=4 * 1024 * 1024,
        deadline_seconds=5.0,
    )
)
criteria = SearchBible(
    words="all",
    match="whole_word",
    case_sensitive=False,
    scope="new_testament",
    books=("John", "1 John"),
    exclude=("darkness",),
    sort="canonical",
    limit=20,
    offset=0,
)

response = bible.search("word life", "kjv", criteria)
print(json.dumps(response, ensure_ascii=False, indent=2))
```

Search responses contain three top-level objects:

- `query`: normalized criteria, translation metadata, exact total, pagination, SHA, cache state, and deterministic search cost.
- `results`: the same grouped scripture object format returned by `select()`.
- `matches`: ordered per-verse match metadata, including score, occurrences, and matched terms.

`query.translation` contains the same six translation fields used by chapter
results. Full translation history and other supplemental metadata can be
retrieved separately from the existing [translation catalogue](https://api.getbible.net/v2/translations.json).

This keeps existing scripture templates reusable. With relevance sorting, `matches` is the authoritative cross-chapter order.

Matching is derived from the text, not chosen by the caller. Librarian
classifies every run of a verse and of a query by the writing system it is
actually in, and applies that system's rules, so a bare query string works in
every translation the API publishes:

```python
bible.search("神爱世人", "cus")          # Chinese, nothing delimits a word
bible.search("사랑", "korean")            # Korean, inside an inflected word
bible.search("בראשית", "modernhebrew")   # unpointed, reaches pointed text
bible.search("λογος", "moderngreek")     # unaccented, reaches accented text
```

There is no match mode to select and no script to detect. Applications
carrying a helper that inspects the query and switches to `substring` should
delete it. See [Scripture search](https://github.com/getbible/librarian/blob/HEAD/docs/SEARCH.md) for the matching policy, the
response contract, and the 1.x migration.

Search criteria may also be supplied as a JSON-decoded dictionary:

```python
response = bible.search(
    "faith hope",
    "kjv",
    {
        "words": "phrase",
        "scope": "bible",
        "limit": 50,
        "offset": 0,
    },
)
```

## Cache behavior

Reference retrieval keeps the lightweight chapter request path. Search downloads the selected full translation once, verifies it against `/v2/{translation}.sha`, and builds a compact in-memory postings index.

By default, full translations are cached under the operating system's user cache directory and checked every seven days. Configure a shared service cache explicitly:

```python
from datetime import timedelta

from getbible import GetBible


bible = GetBible(
    cache_dir="/var/cache/getbible",
    cache_ttl=timedelta(days=7),
    strict_freshness=False,
    require_checksums=True,
)
```

Remote production checksums are required. Full corpora and their independent
books indexes are completely validated before immutable, content-addressed
payloads are atomically committed. A last-known-good translation remains
available during temporary repository or newly published integrity failures
unless `strict_freshness=True`.

Production caches are bounded by default. A service can warm its expected
translation without issuing an artificial query and can expose cache counters to
its internal metrics system:

```python
bible = GetBible(
    cache_dir="/var/cache/getbible",
    search_corpus_limit=4,
    translation_cache_limit=4,
)
bible.warm_translation("kjv")
cache_state = bible.cache_info()
```

Atomically updated local mirrors can coordinate application response caches and
worker-local invalidation with `source_operation()` and
`transition_source()`. See [Cache validation and retention](https://github.com/getbible/librarian/blob/HEAD/docs/CACHING.md).

Call `bible.close()` during worker shutdown, or use `GetBible` as a context
manager in short-lived scripts.

## Documentation

- [Usage and reference retrieval](https://github.com/getbible/librarian/blob/HEAD/docs/USAGE.md)
- [Search criteria and response contract](https://github.com/getbible/librarian/blob/HEAD/docs/SEARCH.md)
- [Translation metadata and the 3.0 migration](https://github.com/getbible/librarian/blob/HEAD/docs/TRANSLATION_METADATA.md)
- [Cache validation and retention](https://github.com/getbible/librarian/blob/HEAD/docs/CACHING.md)
- [Architecture](https://github.com/getbible/librarian/blob/HEAD/docs/ARCHITECTURE.md)
- [Multi-process operations](https://github.com/getbible/librarian/blob/HEAD/docs/OPERATIONS.md)
- [Development and releases](https://github.com/getbible/librarian/blob/HEAD/docs/RELEASING.md)
- [AI and repository guidance](https://github.com/getbible/librarian/blob/HEAD/AGENTS.md)

## Source installation

The primary project home remains on VDM Gitea:

```bash
git clone https://git.vdm.dev/getBible/librarian.git
cd librarian
python -m venv .venv
.venv/bin/python -m pip install -e .
```

The GitHub deployment mirror can also be cloned:

```bash
git clone https://github.com/getbible/librarian.git
cd librarian
python -m venv .venv
.venv/bin/python -m pip install -e .
```

## Development

```bash
./scripts/run_release_gate.sh
```

This creates or reuses `.venv`, installs every development tool, and runs the
local deterministic release gate. GitHub's manually dispatchable **CI**
workflow is the authoritative Python 3.10–3.14 check. Live API tests remain
separate and intentionally opt-in:

```bash
./scripts/run_release_gate.sh --live
```

See the [security and reliability release gate](https://github.com/getbible/librarian/blob/HEAD/docs/RELEASE_GATE.md) for
manual commands, expected diagnostics, and GitHub workflow instructions.

## License

GetBible Librarian is licensed under the GNU General Public License v2.0 or later. See [LICENSE](https://github.com/getbible/librarian/blob/HEAD/LICENSE).


## Usage and reference retrieval

### Client construction

```python
from datetime import timedelta

from getbible import GetBible, SearchLimits


bible = GetBible(
    repo_path="https://api.getbible.net",
    version="v2",
    cache_ttl=timedelta(days=7),
    request_timeout=(3.05, 60.0),
    request_retries=3,
    cache_dir="/var/cache/getbible",
    strict_freshness=False,
    reference_cache_limit=5000,
    books_cache_limit=64,
    chapter_cache_limit=2048,
    search_corpus_limit=4,
    translation_cache_limit=4,
    cache_ttl_jitter=0.1,
    require_checksums=True,
    search_limits=SearchLimits(),
)
```

All constructor arguments are optional. The defaults use GetBible API v2 and
the operating system's user cache directory. Checksums are required
automatically for HTTP/HTTPS repositories and optional for local repositories;
pass `require_checksums=True` for a production local mirror.

In long-running applications, construct a long-lived client rather than one client per call. The client is safe for concurrent threads, and each process receives fork-safe HTTP sessions.

The cache limits are per process. Set a limit to `0` to disable that in-memory
cache or to `None` for unbounded retention. Unbounded full translations or
search corpora are not recommended in long-running applications.

Close network sessions during orderly shutdown:

```python
bible.close()
```

Short-lived scripts may instead use `with GetBible() as bible:`.

### Select verses as a dictionary

```python
from getbible import GetBible


bible = GetBible()
selection = bible.select("Genesis 1:1-3;John 3:16", "kjv")
```

Multiple references are separated with semicolons. Verse lists and ranges are supported:

```python
selection = bible.select("John 3:16,18-21;Romans 8:1-4", "kjv")
```

The return value is grouped by translation, book number, and chapter:

```text
kjv_43_3
kjv_45_8
```

Each grouped object contains translation metadata, book and chapter metadata, the input references that contributed to the group, and an ordered `verses` list.

Starting with 3.0, the only translation fields are `translation`,
`abbreviation`, `lang`, `language`, `direction`, and `encoding`, copied as
present in the source. The remaining chapter fields are `book_nr`, `book_name`,
`chapter`, `name`, `ref`, and `verses`. The translation name is `translation`;
`name` remains the chapter name. Valid empty optional metadata stays empty,
and omitted optional metadata stays absent.

History and other supplemental translation metadata are available separately
from the existing [API translation catalogue](https://api.getbible.net/v2/translations.json).
See [Translation metadata and the 3.0 migration](https://github.com/getbible/librarian/blob/HEAD/docs/TRANSLATION_METADATA.md) for
the complete field contract and upgrade guidance. Direct references and
references served after explicit cache warming follow the same contract.

### Select verses as JSON

```python
encoded = bible.scripture("Psalm 23:1-6", "kjv")
```

`scripture()` calls `select()` and encodes the result with Unicode characters preserved.

### Validate input

```python
reference_is_valid = bible.valid_reference("1 John 3:16", "kjv")
translation_is_valid = bible.valid_translation("kjv")
```

`valid_reference()` verifies that the book alias and reference syntax can be resolved. The final chapter and verse existence check occurs during `select()`.

`valid_translation()` checks the configured repository's `books.json` resource and caches the result for the configured cache interval.

### Resolve references directly

```python
from getbible import GetBibleReference


references = GetBibleReference()
resolved = references.ref("First John 3:16,19-21", "kjv")
print(resolved.book)
print(resolved.chapter)
print(resolved.verses)
```

Reference cache keys include the translation code. Frequently used entries are retained with a bounded least-recently-used policy.

### Resolve book numbers directly

```python
from getbible import GetBibleBookNumber


books = GetBibleBookNumber()
number = books.number("1 John", "kjv")
print(number)
```

The book resolver uses bundled Unicode-normalized alias tries. It tries the requested translation, KJV aliases, and then configured fallback translations.

### Local API-compatible repository

The same client can read API v2-compatible files from disk. A string path or a `pathlib.Path` can be used:

```python
from pathlib import Path

from getbible import GetBible


bible = GetBible(repo_path=Path("/srv/getbible-data"), version="v2")
selection = bible.select("Genesis 1:1", "kjv")
```

Switching back to the remote API changes only `repo_path`:

```python
bible = GetBible(repo_path="https://api.getbible.net", version="v2")
```

Local paths and HTTP(S) URLs use the same API-compatible layout and return the same scripture and search JSON contracts. Deterministic tests serve the local fixture repository over HTTP and compare both modes directly.

Expected paths include:

```text
/srv/getbible-data/v2/kjv/books.json
/srv/getbible-data/v2/kjv/1/1.json
/srv/getbible-data/v2/kjv.json
/srv/getbible-data/v2/kjv.sha
```

The `.sha` resource is optional for local fixtures and required for remote
repositories. Production local mirrors should opt into the same enforcement.

### Errors

- Invalid reference syntax raises `ValueError`.
- Missing translations and chapters preserve the existing `FileNotFoundError` contract.
- Repository transport failures raise `RepositoryError`.
- Invalid JSON raises `RepositoryResponseError`.
- Checksum or structural failures raise `CacheIntegrityError`.
- Invalid search criteria raise `SearchValidationError`.


## Scripture search

### The short version

Pass a query string. Librarian works out how to read it.

```python
from getbible import GetBible


bible = GetBible()

bible.search("faith hope", "kjv")
bible.search("神爱世人", "cus")      # Chinese, no spaces to tokenize
bible.search("사랑", "korean")        # Korean, inside an inflected word
bible.search("בראשית", "modernhebrew")  # unpointed, reaches pointed text
bible.search("λογος", "moderngreek")    # unaccented, reaches accented text
```

There is no match mode to choose, no script to detect, and no per-language
branch to write. If you are carrying code that inspects a query and picks
`match="substring"`, delete it — see [Migrating from 1.x](#migrating-from-1-x).

The criteria that remain exist to *narrow* a search — a testament, a book, an
exclusion. They do not tell the engine how to read a script.

### How matching is decided

Librarian classifies every run of text by the writing system it is actually in,
and applies that system's rules. The same rules run over the corpus at index
time and over your query at request time, so a query can only match what the
same analysis produced from the verse.

| Family | Scripts | How a searchable unit is found |
|---|---|---|
| Alphabetic | Latin, Cyrillic, Greek, Armenian, Georgian, Coptic, Cherokee | Words between spaces. Accents fold. |
| Continuous | Han, Hiragana, Katakana, Hangul, Thai, Lao, Khmer, Myanmar, Tibetan | Overlapping character n-grams with positions. |
| Abjad | Hebrew, Arabic, Syriac, Thaana, Samaritan | Words between spaces. Vowel pointing folds. A word behind an attached particle is also reachable by its stem. |
| Brahmic | Devanagari, Bengali, Tamil, Telugu, Kannada, Malayalam, Sinhala | Words between spaces. Combining marks are **kept** — they carry vowels. |

Classification is by Unicode property, not by a hand-maintained range table and
not by the translation's declared language tag. That matters because the tag is
not always sufficient: the API carries `zh` with no script subtag for one
Chinese translation, and blank language names for several others. A translation
added to the API later is classified from its text, with no code change here.

The response reports the decision so you never have to infer it:

```python
bible.search("神", "cus")["query"]["analysis"]
# {'script': 'continuous'}
```

#### Mixed scripts

A verse or a query may hold more than one writing system. Each run keeps its own
rules:

```python
bible.search("Jesus 耶稣", "multi")
# 'jesus' is matched as a whole Latin word; '耶稣' as a Han run
```

This is why the 1.x helper had to go. It flipped the *whole* query to substring
as soon as it saw one Han character, so `all` started matching inside `small`
and `shall`.

#### Why whole-word and substring agree in continuous scripts

Nothing in Han, kana, Hangul or Thai delimits a word, so there is no boundary
for the two modes to disagree about. Both resolve the same way and both are
exact. A caller cannot get this wrong by choosing either.

A run of *n* characters is verified through its *n−1* overlapping bigrams: if
bigram *i* sits at position *p+i* for every *i*, the run occurs at *p*. Positions
settle it, so no verse text is rescanned and there are no false positives to
filter. `神造` does not match `神神创造神` — the characters are present, the run
is not.

### Criteria

`SearchBible` and plain dictionaries use the same field names. Every field is
optional.

| Field | Values | Default |
|---|---|---|
| `words` | `all`, `any`, `phrase` | `all` |
| `match` | `whole_word`, `substring` | `whole_word` |
| `case_sensitive` | Boolean | `false` |
| `scope` | `bible`, `old_testament`, `new_testament`, `deuterocanon` | `bible` |
| `books` | Book names or numbers | Empty |
| `diacritics` | `fold`, `exact` | `fold` |
| `exclude` | Words that must not occur | Empty |
| `proximity` | 0–100 intervening units | `null` |
| `sort` | `canonical`, `relevance` | `canonical` |
| `limit` | 1–1000 | `100` |
| `offset` | Non-negative integer | `0` |

```python
from getbible import GetBible, SearchBible


bible = GetBible()
response = bible.search(
    "word life",
    "kjv",
    SearchBible(
        words="all",
        scope="new_testament",
        books=("John", "1 John"),
        exclude=("darkness",),
        sort="relevance",
        limit=20,
    ),
)
```

`books` intersects with `scope`: `scope="new_testament"` with `books=("John",)`
searches only John.

Criteria may also be a JSON-decoded dictionary:

```python
bible.search("faith hope", "kjv", {"words": "phrase", "limit": 50})
```

#### Word modes

- **`all`** (default): every distinct unit must occur in the verse.
- **`any`**: at least one unit must occur.
- **`phrase`**: units must occur in order at the spacing the query used.
  Punctuation between them is allowed. Because a continuous run occupies one
  position per character and a word occupies one, a phrase that crosses scripts
  is handled by the same arithmetic.

#### Whole-word and substring

`whole_word` matches complete units. `substring` also matches inside a word, so
`great` reaches `greatest`.

In continuous scripts the two are identical, as described above.

Substring terms in **space-delimited** scripts must be at least
`min_substring_length` characters (3 by default). A one- or two-letter Latin
fragment matches a large share of any vocabulary and is a scan rather than a
word. The floor does not apply to Han, Hangul, Thai, Hebrew, Arabic or
Devanagari, where two characters are an ordinary word that the index answers
exactly. In a mixed query the floor still applies to the Latin run alone.

#### Case and diacritics

Case-insensitive matching uses Unicode `casefold()`, which also unifies Greek
final and medial sigma (ς/σ) and expands the iota subscript. Both sides of a
search pass through the same rule, so the forms meet.

`diacritics="fold"` is the default. It removes combining marks and folds
precomposed letters that Unicode decomposition cannot reach — `đ`, `ø`, `ł`,
`ħ`, `æ`, `þ` and peers. That is what lets `Duc Chua Troi` reach
`Ðức Chúa Trời`, `λογος` reach `λόγος`, and `בראשית` reach `בְּרֵאשִׁית`.

Folding is applied only where marks are accents or optional pointing. Brahmic
and continuous scripts keep their marks, because there the marks carry vowels
and removing them changes the word.

`diacritics="exact"` turns folding off and distinguishes pointed from unpointed
text. The 1.x spellings `sensitive` and `insensitive` are still accepted and map
to `exact` and `fold`.

Original verse text is never modified in the response.

#### Exclusions and proximity

`exclude` removes any verse containing one of the supplied words, analysed the
same way as the query. `proximity` works with `words="all"` and permits that
many intervening units.

### Response contract

`results` is the same chapter-keyed object `select()` returns, so existing
scripture templates keep working. `matches` is the authoritative order when
sorting by relevance.

In 3.0, `query.translation` contains only `translation`, `abbreviation`, `lang`,
`language`, `direction`, and `encoding`, as present in the validated source.
Those same translation fields appear at the top level of each chapter under
`results`. No history, description, license data, or other supplemental
translation metadata is included, even when the search returns no matches.
Existing source values, accepted empty values, and omitted optional fields are
preserved. Full translation details can be fetched separately from the
[API translation catalogue](https://api.getbible.net/v2/translations.json).
See the [3.0 migration](https://github.com/getbible/librarian/blob/HEAD/docs/TRANSLATION_METADATA.md#upgrade-from-2x).

```text
query
  text
  criteria
  engine_version
  translation
    translation
    abbreviation
    lang
    language
    direction
    encoding
  sha
  total
  offset
  limit
  returned
  has_more
  cache
    checked_at
    stale
  analysis
    script            ← how this translation was read
  cost
    work_units
    deadline_seconds
    expensive
results
  <translation>_<book>_<chapter>
    translation, book and chapter metadata
    ref
    verses
matches
  reference, book_nr, chapter, verse
  score, occurrences, terms
```

`engine_version` is `5`. It moves whenever matching or search-response semantics
change, so a downstream result cache can be invalidated without waiting for a
translation SHA to change. Version 3.0 increments it from `4` because translation
metadata is slimmer, even though matching is unchanged. **Key your response
cache on it.**

`SearchBible.expensive` is available before a translation is loaded and is the
right signal for budgeting expensive searches. Diacritic folding is no longer part of it:
folding happens once during index construction and costs nothing per request.

### Performance and sharing

Corpora live in a registry keyed by repository, translation and source SHA, and
are shared by every `GetBible` in the process. Two clients — or a client per
request — reach the same parsed verses and the same analysed index, so a service
pays the parse-and-analyse cost once per translation version rather than once
per object.

```python
bible.warm_translation("cus")   # build before traffic; returns the analysis report
```

An index build is bounded by `SearchLimits.index_build_seconds` (120 s default),
not by the requesting call's `deadline_seconds`. A build serves every later
request, so it must not be abandoned because one caller's request clock ran out.
Concurrent first requests wait on one build rather than each starting their own.

A search still refuses an unusable work budget before any index is built.

### Migrating from 1.x

The following describes the matching changes introduced in 2.0. Upgrading to
3.0 also requires the [translation metadata migration](https://github.com/getbible/librarian/blob/HEAD/docs/TRANSLATION_METADATA.md#upgrade-from-2x).

#### Delete the match-mode selection

```python
# 1.x — remove this
from getbible import requires_substring_matching

if options.match == "whole_word" and requires_substring_matching(query):
    options = replace(options, match="substring")
```

`requires_substring_matching()` now returns `False` for every query. It remains
exported so existing imports keep working and the branch above becomes a no-op
without an immediate code change — but delete it. Leaving it in place is
harmless; leaving *substring* forced on is not, because it loosens Latin terms
in a mixed query.

#### Behaviour that changes

| | 1.x | 2.0 |
|---|---|---|
| Continuous scripts under default criteria | returned nothing | return the verses |
| `diacritics` default | `sensitive` | `fold` |
| Substring floor | all scripts | space-delimited scripts only |
| `engine_version` | `2` | `4` |
| Abjad with attached particle | missed | reachable by stem |

Default searches return **more** than they did. If your application asserted a
1.x total, re-derive it. Invalidate any cached search results — `engine_version`
is there to key that on.

#### API that changed shape

- `cache_info()["indexes"]` entries report `fold_diacritics` (boolean) instead
  of `diacritics` (string).
- `warm_translation()` takes `diacritics="fold"` by default and returns an
  `analysis` block.
- 2.0 changed `SEARCH_ENGINE_VERSION` to `4`; 3.0 changes it to `5` for the
  slimmer translation metadata contract.
- `getbible.search` is a package. Every public name still imports from
  `getbible` and from `getbible.search`; the internal `_Matcher` class is gone.

The 2.0 matching changes preserved `select()`, `scripture()`, and the `results`
structure. Version 3.0 preserves their chapter/verse structure while removing
supplemental translation metadata as documented above.


## Cache validation and retention

Librarian uses separate strategies for lightweight reference retrieval and full-translation search.

### Result contract versioning

Librarian 3.0 projects reference and search translation metadata to the six API
fields described in [Translation metadata](https://github.com/getbible/librarian/blob/HEAD/docs/TRANSLATION_METADATA.md). Complete
source payloads remain subject to the same validation and checksum rules;
existing verified source caches can be reused.

Application-owned response caches are a separate concern. Invalidate old
reference responses or include the library response version in their keys.
Include `SEARCH_ENGINE_VERSION` (now `5`, previously `4`) in search response
keys. Neither a source SHA nor a source-generation namespace changes solely
because the library's response contract changes.

The same projection applies when reference chapters come from `warm_query()`
or `reload_translation()`, so warming cannot reintroduce supplemental
translation metadata.

### Chapter cache

`select()` requests only the required chapter. The parsed chapter is retained in memory with direct verse lookup by verse number.

Before retaining a chapter, Librarian retrieves and validates its SHA endpoint,
downloads the JSON, validates the exact checksum, and validates every required
chapter and verse field. After the configured interval, an unchanged SHA only
updates freshness. Remote production repositories must publish the checksum;
checksum-free local fixtures remain supported.

No cache-maintenance background thread is created.

### Full-translation search cache

The first search for a translation follows this sequence:

1. Acquire the in-process translation lock.
2. Acquire a cross-process file lock for the translation.
3. Read and validate an existing disk entry when present.
4. Retrieve `/v2/{translation}.sha`.
5. Retrieve and independently validate `/v2/{translation}/books.json`.
6. Download `/v2/{translation}.json` only when needed.
7. Calculate SHA-1 over the received bytes and compare it with the published SHA.
8. Validate every book, chapter, verse, numeric range, unique identifier, text
   ceiling, and the exact books-index correspondence.
9. Write the validated JSON as an immutable `objects/{sha}.json` payload.
10. Atomically commit versioned metadata that points at that content-addressed
    payload.
11. Build the immutable in-memory corpus and default postings index.

When the source SHA is unchanged, Librarian updates only freshness state and
retains the existing corpus and every already-built index. It does not reread
and decode the full disk JSON or rebuild postings merely because the freshness
interval elapsed.

The published GetBible `.sha` value is the raw SHA-1 of the corresponding JSON bytes. HTTP/HTTPS repositories require it by default. Set `require_checksums=False` only for a controlled compatibility source; set `require_checksums=True` to enforce the production rule for a local mirror.

### Refresh interval

The default interval is seven days:

```python
from datetime import timedelta

from getbible import GetBible


bible = GetBible(cache_ttl=timedelta(days=7))
```

Freshness is checked lazily on the next relevant request. There is no timer and no worker wake-up cycle.

By default, each process deterministically shortens individual translation
refresh intervals by up to 10 percent. This `cache_ttl_jitter` spreads source
checks across many workers while never serving an entry beyond the configured
TTL. Use `cache_ttl_jitter=0` for exact intervals.

### Cache directory

Resolution order:

1. The `cache_dir` constructor argument.
2. `GETBIBLE_CACHE_DIR`.
3. `XDG_CACHE_HOME/getbible`.
4. `~/.cache/getbible`.

For a multi-process application, configure one writable cache directory shared by all processes:

```python
bible = GetBible(cache_dir="/var/cache/getbible")
```

The cache namespace includes a hash of the repository URL or path and its API version, preventing custom repositories from colliding with official API data.

### Cross-process safety

`filelock` coordinates initial downloads and commits. Immutable payloads and
metadata are written to temporary files, flushed, atomically moved into place,
and followed by a directory `fsync`. Metadata is the commit point. A process
crash can leave an unreferenced immutable object, but cannot make a partially
validated object current. Metadata includes a validation-version marker so a
future validator upgrade forces complete revalidation.

Each process maintains its own in-memory corpus and indexes. The shared disk cache prevents every worker from downloading the full translation independently.

Process-local caches use bounded least-recently-used retention. The defaults
retain four translation snapshots and four search corpora per worker; chapter,
book-list, and parsed-reference caches have separate limits. Eviction removes a
lookup entry but never mutates an immutable corpus already borrowed by an active
request.

### Last-known-good behavior

When a verified disk translation exists and the source becomes temporarily unavailable, Librarian serves the cached translation and reports:

```text
query.cache.stale = true
```

The original SHA remains in the response. This makes availability and source state explicit to the application.

Use strict freshness when stale responses are not acceptable:

```python
bible = GetBible(strict_freshness=True)
```

In strict mode, repository failures propagate instead of serving the older translation.

Checksum, nested validation, and books-index mismatches never replace the
last-known-good translation. Unless strict freshness is enabled, a validated
last-known-good corpus remains available and is marked stale when a newly
published upstream payload fails integrity validation.

### Source generations

The repository URL/path plus API version produces a stable namespace. A
versioned `source-generation.json` manifest records the active immutable mirror
revision. `transition_source()` takes the cross-process writer barrier, runs the
configured response-cache purge callback exactly once, commits the manifest,
and invalidates worker-local books, chapters, full translations, indexes, and
negative translation entries. A purge failure leaves the old generation
committed.

Use `source_operation()` to keep the generation stable while an application
performs an external response-cache lookup, Librarian call, and response-cache
write:

```python
with bible.source_operation() as source:
    key = f"{source.cache_namespace}:{canonical_request_key}"
    response = response_cache.get(key)
    if response is None:
        response = bible.search(query, translation, criteria)
        response_cache.set(key, response)
```

The reader/transition barrier spans threads and Linux worker processes. A
worker that observes a generation committed by another worker invalidates its
process-local caches before serving that generation. Translation metadata also
records the source generation; an older disk snapshot becomes immediately due
for source revalidation, even when its ordinary cache TTL has not elapsed.

### Local repositories

When `repo_path` is a directory rather than a URL, the full translation is
validated and held in memory exactly as for a remote repository, but no copy
is written under the cache directory: the source file already sits on the
same disk, so a duplicate would buy nothing. The metadata file still records
the validated SHA, the books-index checksum and the freshness timestamp, so
processes share freshness state and a changed source is noticed at the next
freshness check. A source file whose bytes no longer match the recorded SHA
is simply re-read and re-validated.

Remote repositories keep the content-addressed on-disk copy, which is what
makes last-known-good fallback possible when the source is unreachable.

### Rotation

Each translation metadata file points to one current content-addressed payload.
Older unreferenced objects may be removed during controlled cache maintenance
after all workers have observed the new generation. Lock and barrier files
contain no scripture data.

Use `GetBible.cache_info()` to observe current sizes, configured limits,
evictions, source checks, downloads, stale fallbacks, loaded SHA values, and
built index variants without exposing Scripture payloads.


### Resident cache controls (2.1)

A freshness TTL is an interval before the next source verification. It is not
an instruction to discard immutable data. After the interval elapses, the next
request rechecks the source and retains the same corpus and built indexes when
the SHA is unchanged. Requests do not extend the interval. Changed source
revisions can be published immediately with `transition_source(revision)`;
there is no need to wait for TTL expiration.

```python
from datetime import timedelta
from getbible import GetBible

bible = GetBible(
    cache_ttl=timedelta(days=30),
    cache_ttl_jitter=0,
    chapter_cache_limit=100_000,
    chapter_cache_bytes=512 * 1024**2,
    search_corpus_limit=100,
    translation_cache_limit=100,
    translation_cache_bytes=512 * 1024**2,
    shared_corpus_limit=100,
    shared_corpus_bytes=1024**3,
)
```

These example limits illustrate the API; they are not measured requirements
for a complete translation collection. Set count and byte bounds appropriate
to the application. The library retains its existing conservative defaults
unless explicitly configured. A byte or count limit takes precedence over
residency: least-recently-used entries can be evicted before their TTL when a
bound is reached. A single oversized request may execute without retaining its
result in a cache. No new background thread, eager translation download, or
periodic rebuild is introduced by construction.

| Parameter | Scope | `None` | `0` |
| --- | --- | --- | --- |
| `chapter_cache_limit` | Chapters retained by this client | No count limit | No retention |
| `chapter_cache_bytes` | Estimated bytes in those chapters | No byte limit | No retention |
| `translation_cache_limit` | Full validated snapshots in this client | No count limit | No retention |
| `translation_cache_bytes` | Estimated bytes in those snapshots | No byte limit | No retention |
| `search_corpus_limit` | This client's retained corpus references | No count limit | No client retention |
| `shared_corpus_limit` | Process-wide strong corpus registry | Constructor leaves registry unchanged | No registry retention |
| `shared_corpus_bytes` | Process-wide registry and this client's corpus references | No byte limit when explicitly configured | No retention |

For shared settings, configure one policy for the process. A later explicit
shared-registry configuration applies to the same process-wide registry.
Changing the registry does not forcibly invalidate immutable objects already
borrowed by another client or active request. A weak lookup table allows those
objects to be reused without parsing and indexing the same SHA again, while
not preventing their release once all borrowers let go. This weak table is
bounded by the number of objects that are actually alive, not by historical
request keys. In-flight data and other clients' references can exceed the
registry's retained-byte limit; these are not operating-system memory limits.

Reconfiguration validates every argument before applying any changes. Omitted
arguments remain unchanged, and existing objects and freshness timestamps are
preserved when capacity grows:

```python
state = bible.configure_cache(
    cache_ttl=timedelta(days=7),
    cache_ttl_jitter=0,
    chapter_cache_limit=200_000,
    shared_corpus_limit=150,
)
```

`configure_cache(shared_corpus_limit=None)` is invalid: unlike the constructor's
"leave unchanged" default, a registry resize requires a non-negative integer.
To leave the setting unchanged, omit it. Set all retention bounds deliberately
rather than removing both count and byte limits from a client cache.

### Explicit query and search lifecycle

```python
# The normal lazy path fetches only the requested chapter:
bible.select("John 3:16", "kjv")

# Optional targeted prewarming uses that same chapter path:
bible.warm_query("kjv", references=["John 3:16", "Genesis 1:1"])

# Explicitly warm all query chapters from a validated full snapshot.
# This does not build a search corpus or index:
query_state = bible.warm_query("kjv")

# Existing search warm-up builds the selected analysed search view:
search_state = bible.warm_translation("kjv")

# Drop resident views, keeping cached source bytes and source repository files:
bible.drop_translation("kjv")

# Force source verification and rebuild either or both views:
bible.reload_translation("kjv", target="both")
```

`warm_query` returns both the amount loaded and the amount still retained.
They may differ when the selected count/byte capacity cannot hold all chapters.
`references` must be a sequence of strings, not a comma-separated string.
`reload_translation` accepts `search`, `query`, or `both`, plus optional query
references. Source bytes are verified before the current views are discarded;
configured last-known-good fallback is reported as stale. Existing repository
failure and strict-freshness rules apply.

Explicit drop/reload/reconfiguration excludes active source readers during its
administrative operation. Calls are intended for administration, not for every
request. They affect this client's resident views and the process registry;
independent clients or worker processes must each receive their own operation.
`transition_source` remains the shared revision/invalidation mechanism.

`drop_translation(code, disk=True)` additionally deletes that translation's
Librarian-owned metadata and referenced downloaded cache object. It never
deletes repository source files or another translation's cache objects. It does
not revoke the source generation or cancel an immutable response already held
by application code.

### Memory measurements

`cache_info()` returns JSON-safe metadata, including:

- `ttl_seconds` and `freshness_policy`;
- `query_translations[code]`: retained chapter count, estimated bytes, and how
  many chapters are due for lazy revalidation;
- `search_corpora.translations[code]`: SHA, verification time, stale state,
  verse count, built index policies, and estimated bytes;
- `translation_cache.translations[code]`: snapshot size estimates and state;
- `translation_cache.source_generation` and the existing `source` manifest;
- `shared_registry`: retained entries/bytes, bounds, hits, misses, evictions and
  active corpus-build locks.

The measurement label is `estimated_python_objects_not_rss`. These values count
reachable Python data structures and native array buffers, not interpreter
heaps, memory fragmentation, process RSS, or peak temporary allocations. Shared
objects can appear in more than one category or worker estimate, so those
values must not be summed and presented as actual physical memory consumption.
Byte sizing is calculated during insertion/index construction and reused for
warm requests; it does not walk an entire translation for every query or chart.
An active request, a cold build, or old/new generations overlapping in application
code require additional headroom beyond retained cache limits.


## Multi-process operations

Librarian is designed to be held as a long-lived dependency in each process
of an application. Retrieval and search are independent capabilities; an
application that serves both under load often runs them in separate processes
so search CPU and memory cannot starve retrieval, and the library supports
either arrangement.

### Client lifetime

Create one client during application initialization or once per worker. Do not construct a new client for every call.

```python
from getbible import GetBible, SearchLimits


bible = GetBible(
    cache_dir="/var/cache/getbible",
    require_checksums=True,
    search_limits=SearchLimits(deadline_seconds=5.0),
)


def execute_scripture_query(reference: str, translation: str) -> dict:
    return bible.select(reference, translation)


def execute_search_query(query: str, translation: str, criteria: dict) -> dict:
    return bible.search(query, translation, criteria)
```

The example functions are framework-neutral. They illustrate Librarian calls
only; what surrounds them belongs to the application.

### Worker processes

Each worker has its own in-memory chapter cache, corpus objects, and postings indexes. Workers share the disk translation cache through process locks and atomic replacement.

Configure the cache directory so every worker identity can read and write it. Do not place it inside an ephemeral per-request directory.

### Pre-fork servers

Librarian detects process changes and does not reuse an HTTP session created by the parent process. This makes the client safe when an application server preloads the module before forking workers.

To share as much read-only memory as the operating system permits, a deployment may warm its most-used translation and default index before forking:

```python
from getbible import GetBible


bible = GetBible(cache_dir="/var/cache/getbible")
bible.warm_translation("kjv")
```

Whether preloading is beneficial depends on the server, worker lifecycle, and available memory. Benchmark both preloaded and per-worker warm-up configurations.

### Threads

Repository sessions are thread-local. Normal cache reads are concurrent. Missing corpus and index construction is coordinated so only one thread performs the expensive work in a process.

### Warm-up

The first search for a translation includes disk or network loading, JSON parsing, corpus construction, and index construction. Warm the expected translation before marking a newly started worker ready when startup latency matters.

Do not warm every case and diacritic variant unless production traffic requires them; each variant consumes additional memory.

`warm_translation()` accepts `case_sensitive` and `diacritics` when a non-default
index is known to be common. It returns an `analysis` block reporting how the
translation was read, which is worth recording once per deployment:

```python
bible.warm_translation("kjv", case_sensitive=True, diacritics="exact")
```

### Shared corpora

Parsed translations and their analysed indexes live in a registry shared by
every `GetBible` in the process, keyed by repository, translation and source
SHA. A service that constructs a client per request, or holds several clients
for different configurations, pays the parse-and-analyse cost once per
translation version rather than once per object.

Keying on the SHA is what makes this safe: when a translation changes upstream,
the new SHA produces a new entry instead of silently reusing stale verses. The
superseded entry is evicted by ordinary LRU pressure.

Sharing is per process. Pre-fork workers each hold their own registry unless the
parent warmed the translation before forking, in which case the pages are shared
copy-on-write — see [Pre-fork servers](#pre-fork-servers).

### Index build window

Index construction is bounded by `SearchLimits.index_build_seconds` (120 seconds
by default), which is deliberately separate from the per-request
`deadline_seconds`.

A build serves every later request, so it must not be abandoned because one
caller's request clock ran out. Under 1.x a build charged to a request deadline
could time out, cache nothing, and leave the next request repeating the same
work and failing the same way — a stall the service could not recover from on
its own. Concurrent first requests now wait on a single build.

Raise `index_build_seconds` only if a very large translation genuinely needs
longer on your hardware; warming before traffic is the better answer.

A request whose work budget cannot cover the corpus is still refused before any
index build starts.

### Bounded memory

Every growing process-local cache is bounded by default:

| Cache | Constructor argument | Default entries |
|---|---|---:|
| Parsed references | `reference_cache_limit` | 5,000 |
| Translation book lists | `books_cache_limit` | 64 |
| Retrieved chapters | `chapter_cache_limit` | 2,048 |
| Full search corpora and indexes | `search_corpus_limit` | 4 |
| Validated translation snapshots | `translation_cache_limit` | 4 |

These limits apply to each process, not to the whole application. Size
process memory for the largest translations and index variants actually used.
Use `0` to disable retention or `None` for an unbounded cache. Avoid `None` for
full translations and corpora when many translations are in play.

For a retrieval-only process, set `search_corpus_limit=0` and
`translation_cache_limit=0`. For a search-only process, set
`reference_cache_limit=0` and `chapter_cache_limit=0`, then choose small corpus
and translation limits based on measured RSS. Processes can read the same
repository but should never share a writable cache directory.

### Pagination limits

The library restricts a page to 1,000 matches. An application may impose a smaller maximum. Exact totals are reported independently of the returned page.

### Deadlines

`SearchBible.expensive` is deliberately corpus-independent, so an application
can classify a search before it runs:

```python
criteria = SearchBible.from_value(filters)
if criteria.expensive:
    ...  # budget it however the application sees fit
response = bible.search(query, translation, criteria)
```

The default cooperative Librarian deadline is 5 seconds. An application that
wraps a call in a timeout of its own should set that timeout above the
Librarian deadline, leaving time to translate a typed failure into whatever it
reports to its callers. Repository connect/read timeouts govern source refresh
separately. A timeout imposed from outside the process does not stop Python
work: it abandons the caller but does not itself cancel matching.

### Timeouts and retries

Defaults:

- Connect timeout: 3.05 seconds.
- Read timeout: 60 seconds.
- Retries: 3 for GET requests.
- Retry statuses: 429, 500, 502, 503, and 504.

Override these through `GetBible()` when the hosting environment requires different limits.

### Monitoring

An application should record:

- call duration for retrieval and for search;
- translation, criteria mode, and page size;
- cache `stale` state;
- repository and checksum failures;
- process memory after each newly loaded translation/index mode;
- search totals and response sizes;
- rejected criteria.

`cache_info()` provides JSON-safe sizes, limits, hit/miss/eviction counters,
loaded translation SHA values, stale flags, and currently built index variants.
It deliberately excludes verse text, source paths, and search terms:

```python
state = bible.cache_info()
metrics.gauge("librarian.search_corpora", state["search_corpora"]["size"])
metrics.counter("librarian.search_evictions", state["search_corpora"]["evictions"])
```

Read these counters periodically or at shutdown. Do not call `cache_info()`
on every call solely for logging.

### Shutdown

Call `bible.close()` from the application's shutdown hook after calling
threads have stopped. It closes every HTTP session created by that process.
Short-lived scripts can use `GetBible` as a context manager.

`cache_info()` never contains verse text or search terms, so it can be logged
freely; what an application logs about its own callers is its own decision.

### Benchmarking

```bash
python benchmarks/search_benchmark.py \
  --translation kjv \
  --query "faith hope" \
  --iterations 10000 \
  --workers 1 \
  --cache-dir /var/cache/getbible
```

The benchmark reports initial warm-up time, exact match total, average warm latency, and queries per second. Use process-level load testing against the actual API service to validate worker count, network stack, serialization, and response compression.


## Translation metadata and the 3.0 migration

### Response field contract

Librarian 3.0 deliberately limits translation metadata in reference and search
results to the fields used by API v2 chapter responses, such as
[Genesis 1 in the KJV](https://api.getbible.net/v2/kjv/1/1.json).

| Field | Meaning | KJV value |
|---|---|---|
| `translation` | Full translation name | `King James Version` |
| `abbreviation` | API translation identifier | `kjv` |
| `lang` | Short language code supplied by the API | `en` |
| `language` | Full language label supplied by the API | `English` |
| `direction` | Text direction | `LTR` |
| `encoding` | Text encoding label | `UTF-8` |

The KJV translation metadata is:

```json
{
  "translation": "King James Version",
  "abbreviation": "kjv",
  "lang": "en",
  "language": "English",
  "direction": "LTR",
  "encoding": "UTF-8"
}
```

These are the only allowed translation keys. The projection preserves source
values without renaming fields, shortening language labels, normalizing their
contents, or inventing defaults. Existing source validation still applies:
optional fields omitted by a valid source remain absent, and accepted empty
values remain empty. A translation name is always `translation`; the chapter's
`name` still means its chapter name.

### Where the projection applies

| Public result | Translation metadata location |
|---|---|
| `select(reference, translation)` | Top level of each chapter under its existing chapter key |
| `scripture(reference, translation)` | The same chapter objects, encoded as JSON |
| `search(query, translation)` | `query.translation` and the top level of every chapter in `results` |
| `search_json(query, translation)` | The same search envelope, encoded as JSON |

For example, `select("Genesis 1:1", "kjv")["kjv_1_1"]` combines those
translation fields with the existing `book_nr`, `book_name`, `chapter`, `name`,
`ref`, and `verses` fields. In a search,
`response["query"]["translation"]["translation"]` is the full translation
name; `response["query"]["translation"]["abbreviation"]` is its identifier.

The same contract applies to direct chapter reads, retained chapters, and
chapters populated by `warm_query()` or `reload_translation()`. Empty searches
and pages beyond the final result still include the projected
`query.translation`; their `results` and `matches` remain empty.

The chapter-keyed dictionary, book/chapter identity, references, and complete
verse dictionaries retain their existing structure. Search keeps its `query`,
`results`, and `matches` envelope, including criteria, totals, pagination,
matching details, source SHA, cache state, analysis, and cost metadata. The
projection does not change matching or verse text.

### Complete translation metadata

Translation history, descriptions, distribution/license data, source details,
and every other supplemental translation field are excluded from query and
search responses. Fetch the existing
[API translation catalogue](https://api.getbible.net/v2/translations.json)
separately when those details are needed. It contains metadata for all
translations, so a client can retain that catalogue and use `abbreviation` to
associate query/search results with it. For a custom API-compatible repository,
use its corresponding catalogue if it provides one.

This is a result-assembly change. Librarian still loads and validates complete
source payloads, verifies checksums, preserves last-known-good translations,
and uses the lightweight chapter path for ordinary references. It does not
fetch the catalogue as part of a search or reference request.

### Upgrade from 2.x

Removing fields is an intentional breaking compatibility decision and the
reason for version `3.0.0`. Earlier `query.translation` copied every top-level
translation field except `books`; warmed reference chapters could carry the
same supplemental metadata. Neither pass-through behavior is part of the
3.0 contract. Do not restore it when adding source fields or changing cache
paths.

1. Keep using the six API fields at their existing locations. Consumers that
   need additional translation details should obtain the catalogue separately
   and look up the result's `abbreviation`.
2. Update response schemas, expected output, and consumers that required the
   removed fields. Do not require optional metadata omitted by a valid source
   or replace valid empty values with guessed labels.
3. Invalidate saved reference responses that contain old metadata. Include the
   package/response contract version in any application-owned reference-result
   cache key; the source SHA alone does not identify the response contract.
4. Invalidate saved search responses or key them with the exported
   `SEARCH_ENGINE_VERSION`, now `5`. Its previous value was `4`; the source SHA
   can stay the same while the response shape changes. Source-generation
   namespaces alone do not distinguish library response versions.
5. Pin `getbible==3.0.0` once the existing release workflow publishes it. Before
   publication, test this checkout or a wheel built from the reviewed commit;
   an immutable full-commit Git dependency pin can identify that same source
   revision. The version change in this repository does not itself publish a
   package or create a release tag.

Verified source translation caches do not need to be deleted for this
migration: the projection happens when results are assembled. Matching criteria
and source-integrity validation keep their existing behavior.


## Support and source documentation

For questions about this project, installation, unexpected output, or contributing, use the [single GetBible support desk](https://git.vdm.dev/getBible/support). Include the project, installed release or commit, operating system, relevant API version, and a minimal reproduction. General enquiries can be sent to [getBible@TrueChristian.church](mailto:getBible@TrueChristian.church).

This guide follows the [repository README](https://github.com/getbible/librarian/blob/HEAD/README.md) and [USAGE](https://github.com/getbible/librarian/blob/HEAD/docs/USAGE.md), [SEARCH](https://github.com/getbible/librarian/blob/HEAD/docs/SEARCH.md), [CACHING](https://github.com/getbible/librarian/blob/HEAD/docs/CACHING.md), [OPERATIONS](https://github.com/getbible/librarian/blob/HEAD/docs/OPERATIONS.md), [TRANSLATION METADATA](https://github.com/getbible/librarian/blob/HEAD/docs/TRANSLATION_METADATA.md). Scripture and study resources retain their own source licences; a software licence does not relicense the texts.

