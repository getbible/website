# SWORD for PHP — native extension

Stream installed CrossWire SWORD modules directly into PHP through `GetBible\Sword\Engine`. The extension embeds the pinned native extraction engine and keeps the same NDJSON contract as the standalone CLI.

[Repository](https://github.com/getbible/sword) · [Support](https://git.vdm.dev/getBible/support) · [All projects](/project/)

This is the native extension layer. Choose [Scripture](/project/scripture/) when an application needs lazy Translation, Book, Chapter, and Verse objects. Module data remains external. Native ABI v1 lists and extracts already-installed modules; it does not download modules or provide direct verse queries.

`getbible/sword` is the native PHP extension for
[getBibleSword](https://github.com/getbible/getbiblesword). It exposes the
released getBibleSword `0.3.0` C ABI to PHP without starting a subprocess and
without requiring a system installation of `libsword`, `diatheke`, or the
`getbiblesword` executable.

The package is designed for installation through the official
[PHP Installer for Extensions (PIE)](https://github.com/php/pie):

```bash
pie install getbible/sword
```

Check the [published releases](https://github.com/getbible/sword/releases) and [Packagist setup guide](https://github.com/getbible/sword/blob/HEAD/docs/packagist.md) for package availability. If PIE cannot resolve a published package, use the source-build workflow below. The extension and native engine use separate release numbers.

## Runtime model

The extension embeds:

- getBibleSword `0.3.0`;
- getBibleSword C ABI version `1`;
- CrossWire SWORD `1.9.0`; and
- the `getbiblesword.ndjson/v1` output contract.

The resulting `getbiblesword.so` PHP module does not dynamically depend on
`libsword.so` or `libgetbiblesword.so`. Bible translations, commentaries,
dictionaries, and other SWORD modules remain external data.

## PHP API

The API is intentionally streamed. A full Bible is never concatenated into one
PHP string.

```php
<?php

declare(strict_types=1);

use GetBible\Sword\Engine;

$engine = new Engine('/var/lib/getbiblesword/sword');

$list = fopen('/tmp/modules.ndjson', 'wb');
$listBytes = $engine->streamModules($list);
fclose($list);

$output = fopen('/tmp/kjv.ndjson', 'wb');
$extractBytes = $engine->streamModule(
    module: 'KJV',
    destination: $output,
    artifactChunkSize: Engine::DEFAULT_ARTIFACT_CHUNK_SIZE
);
fclose($output);
```

Both methods write the exact NDJSON bytes emitted by the standalone
getBibleSword `0.3.0` CLI. They return the accepted byte count and throw
`GetBible\Sword\Exception` when the C ABI reports an extraction, write,
cancellation, argument, or internal error. The exception code is the underlying
`gbs_status` value.

Metadata is available without constructing an engine:

```php
Engine::abiVersion();         // 1
Engine::productVersion();     // "0.3.0"
Engine::contractIdentifier(); // "getbiblesword.ndjson/v1"
```

See [docs/php-api.md](https://github.com/getbible/sword/blob/HEAD/docs/php-api.md) for the complete interface and error
contract.

## Module-path resolution

`new Engine()` resolves its module root in this order:

1. the path passed to the constructor;
2. the `getbiblesword.module_path` PHP INI setting;
3. the `SWORD_PATH` environment variable;
4. `$HOME/.sword`; or
5. the effective operating-system user's home directory plus `/.sword`.

For PHP-FPM, configure a stable application-owned path:

```ini
getbiblesword.module_path=/var/lib/getbiblesword/sword
```

The executing user needs read access to installed module data. ABI v1 does not
install missing modules or perform network operations. Automatic repository
installation and direct verse/reference queries require additive getBibleSword
C ABI functions and are tracked as follow-up work; this initial package does not
claim behavior the released native library does not provide.

## Supported platforms

- Linux on `x86_64` and `arm64`
- PHP `8.2`, `8.3`, `8.4`, and `8.5`
- non-thread-safe and Zend thread-safe PHP builds

PIE source packages include the exact native sources. A source build requires a
C/C++ build toolchain, PHP development tools, `pkg-config`, Autotools, CMake,
and the development packages used by SWORD. On Debian or Ubuntu:

```bash
sudo apt-get install \
    autoconf automake binutils build-essential cmake curl git \
    libbz2-dev libcurl4-openssl-dev libicu-dev liblzma-dev \
    libtool pkg-config zlib1g-dev
```

PIE can detect many missing build tools, but not every native SWORD dependency.

## Source layout

The extension source is not missing: PHP extensions traditionally keep
`config.m4`, their primary C file, public header, stub, and generated arginfo in
the repository root. In this repository:

| Path | Purpose |
|---|---|
| `getbiblesword.c` | Zend/PHP stream and object adapter |
| `php_getbiblesword.h` | Extension identity and module declaration |
| `getbiblesword.stub.php` | Canonical PHP API signatures |
| `getbiblesword_arginfo.h` | Generated Zend argument metadata |
| `config.m4` | phpize/PIE native build definition |
| `vendor/getbiblesword/` | Verified native engine source, created while packaging |
| `vendor/sword-1.9.0.tar.gz` | Verified SWORD source, created while packaging |

The large native dependencies are deliberately not duplicated in Git. The
release source archive vendors and verifies them before PIE receives the
package. The complete map is in
[docs/repository-layout.md](https://github.com/getbible/sword/blob/HEAD/docs/repository-layout.md).

## Dependency integrity

Release source packages vendor, rather than dynamically select:

| Dependency | Pin | Verification |
|---|---|---|
| getBibleSword | `v0.3.0` / `c52003438dc7e3d5bab0d6680372b1de8a0077ce` | Exact Git commit |
| CrossWire SWORD | `1.9.0` | SHA-256 `42409cf3de2faf1108523e2c5ac0745d21f9ed2a5c78ed878ee9dcc303426b8a` |

Official builds never fall back to an ambient `libsword`.

## Development

Install the dependencies shown above, clone the repository, and run:

```bash
git clone https://github.com/getbible/sword.git
cd sword
./scripts/build-extension.sh
```

The script:

1. verifies and vendors the two pinned sources;
2. builds SWORD as a PIC static library;
3. builds the PHP extension with `phpize`;
4. runs PHPT tests;
5. creates a real SWORD module fixture;
6. compares CLI and PHP output byte-for-byte; and
7. verifies that the extension has no SWORD shared-library dependency.

To build the current branch through PIE before a release:

```bash
pie repository:add vcs https://github.com/getbible/sword
pie build 'getbible/sword:dev-main'
```

## Golden release evidence

Every pull request builds the extension and validates its deterministic local
Public Domain SWORD fixture. The separate scheduled golden-baseline workflow
and every release additionally download the public CrossWire KJV module as
live test input, build the extension, stream that module through
`GetBible\Sword\Engine`, and select the first and last chapters of canonical
book 66 from getBibleSword's NDJSON output. The live gate requires all 20
verses of Revelation 1 and all 21 verses of Revelation 22. CrossWire's archive
is not the expected result or test oracle.

The workflow compares both chapters' newly generated entry records and readable
text byte-for-byte with the maintainer-approved historical output committed
under `tests/baselines/kjv-revelation-1/` and
`tests/baselines/kjv-revelation-22/`. It fails before publication on any output
change, prints every verse, and publishes:

- two exact selected NDJSON entry-record files;
- two human-readable chapter-text files; and
- two manifests containing engine, ABI, contract, source, and artifact hashes.

PR artifacts remain downloadable even when the comparison fails, making an
unexpected result inspectable without weakening the golden baselines.

The separate **Golden Baseline** workflow runs after each `main` update, daily,
and on demand. If its strict comparison fails, **Golden Baseline Recovery**
performs five independent live downloads and extension extractions. It proceeds
only when all six generated files match byte-for-byte across all five runs. A
stable changed result is proposed on an `automation/kjv-golden-*` branch in a
normal pull request. It is never written directly to `main`; a maintainer must
inspect and merge the PR before the candidate becomes the approved baseline.
Unstable output, build failures, and results that still match the current
baseline create no PR.

## Release process for repository maintainers

Installing or consuming the extension does not require publishing a release. Authorized repository maintainers use the **Release** workflow. Its default `auto` mode releases
an untagged `VERSION`, or derives the next semantic version from changes since
the latest release:

- `BREAKING CHANGE:` or a conventional `!` commit selects `major`;
- `feat:` selects `minor`;
- all other changes select `patch`.

The workflow updates `VERSION` and `CHANGELOG.md`, commits when necessary,
creates the annotated version tag, builds and verifies the PIE source package,
creates the KJV evidence artifact, and publishes the GitHub release. A manually
pushed matching `vX.Y.Z` tag follows the same build, evidence, and publication
path. See [docs/releasing.md](https://github.com/getbible/sword/blob/HEAD/docs/releasing.md).

## Documentation

| Document | Purpose |
|---|---|
| [PHP API](https://github.com/getbible/sword/blob/HEAD/docs/php-api.md) | Complete public PHP interface and errors |
| [Architecture](https://github.com/getbible/sword/blob/HEAD/docs/architecture.md) | Native, Zend, trust, and packaging boundaries |
| [Repository layout](https://github.com/getbible/sword/blob/HEAD/docs/repository-layout.md) | Location and origin of every source layer |
| [Packagist setup](https://github.com/getbible/sword/blob/HEAD/docs/packagist.md) | One-time package registration and synchronization |
| [Releasing](https://github.com/getbible/sword/blob/HEAD/docs/releasing.md) | Automated and tag-driven release operations |
| [AI summary](https://github.com/getbible/sword/blob/HEAD/llms.txt) | Compact machine-oriented capability map |

## Security

SWORD parsing occurs in the PHP process. A native memory-safety defect can
terminate the PHP CLI or FPM worker, unlike the existing standalone-CLI
subprocess boundary. Treat module data as untrusted, validate completed NDJSON
before committing downstream state, and review [SECURITY.md](https://github.com/getbible/sword/blob/HEAD/SECURITY.md) and
[docs/architecture.md](https://github.com/getbible/sword/blob/HEAD/docs/architecture.md) before production deployment.

## License

GPL-2.0-only. The extension statically links GPL-2.0-only getBibleSword and
CrossWire SWORD code.


## PHP API

### `GetBible\Sword\Engine`

#### Construction

```php
new Engine(?string $modulePath = null)
```

An explicit non-empty path is preserved exactly. When the argument is `null`,
the resolver uses the INI setting, environment, and effective-user rules
documented in the main README. Resolution does not require the directory to
exist; getBibleSword emits a deterministic failed NDJSON stream if the path
cannot be opened.

#### Metadata

```php
Engine::abiVersion(): int
Engine::productVersion(): string
Engine::contractIdentifier(): string
```

These return native library metadata with static lifetime. Extension startup
fails if the embedded ABI version is not `1`.

#### Path

```php
$engine->modulePath(): string
```

Returns the resolved module root owned by this engine object.

#### Module listing

```php
$engine->streamModules(mixed $destination): int
```

`$destination` must be a writable PHP stream resource. The method calls
`gbs_list_modules_v1()` synchronously, writes each callback span completely, and
returns the number of bytes accepted by the stream.

#### Module extraction

```php
$engine->streamModule(
    string $module,
    mixed $destination,
    int $artifactChunkSize = Engine::DEFAULT_ARTIFACT_CHUNK_SIZE
): int
```

The module name must be non-empty. The chunk size must be from `4096` through
`16777216` bytes. Chunk size controls getBibleSword artifact records, not the
size of PHP stream writes and not NDJSON record boundaries.

### Exceptions

Native failures throw `GetBible\Sword\Exception`, which extends
`RuntimeException`. Its integer code maps directly to C ABI status:

| Code | Native status | Meaning |
|---:|---|---|
| `1` | `GBS_STATUS_INVALID_ARGUMENT` | ABI or native input was invalid |
| `2` | `GBS_STATUS_EXTRACTION_FAILED` | A complete `success:false` footer was emitted |
| `3` | `GBS_STATUS_WRITE_FAILED` | The PHP destination refused output |
| `4` | `GBS_STATUS_CANCELLED` | The native callback operation was cancelled |
| `255` | `GBS_STATUS_INTERNAL_ERROR` | A contained native failure occurred |

PHP signature and range violations use normal `TypeError` or `ValueError`.

An extraction failure can still produce a complete NDJSON stream. Applications
should inspect or retain that stream for diagnostics even when the method
throws.

### Concurrency

Engine objects hold only an immutable module-path string. They are safe in NTS
and ZTS builds. getBibleSword ABI v1 serializes SWORD operations within one
process; separate PHP-FPM workers remain independent.

Do not modify, install, replace, or remove module data while any engine call is
reading the same root.


## Support and source documentation

For questions about this project, installation, unexpected output, or contributing, use the [single GetBible support desk](https://git.vdm.dev/getBible/support). Include the project, installed release or commit, operating system, relevant API version, and a minimal reproduction. General enquiries can be sent to [getBible@TrueChristian.church](mailto:getBible@TrueChristian.church).

This guide follows the [repository README](https://github.com/getbible/sword/blob/HEAD/README.md) and [php-api](https://github.com/getbible/sword/blob/HEAD/docs/php-api.md). Scripture and study resources retain their own source licences; a software licence does not relicense the texts.
