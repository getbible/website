# Scripture — object-oriented Bible access for PHP

Build PHP applications around validated, immutable, lazy Bible objects backed by installed SWORD modules. Scripture adds configuration, indexing, cache generations, refresh services, and Joomla Framework integration above the native extension.

[Repository](https://github.com/getbible/scripture) · [Support](https://git.vdm.dev/getBible/support) · [All projects](/project/)

Scripture is a local native-data library, separate from the HTTP Bible APIs and the installable Joomla CMS component. Its dependencies include the [SWORD PHP extension](/project/sword/). It exposes Bible modules; dictionaries and commentaries remain outside this library's object model.

`getbible/scripture` is the object-oriented Bible application layer for the
native [`getbible/sword`](https://github.com/getbible/sword) PHP extension. It
validates the complete `getbiblesword.ndjson/v1` stream and exposes immutable,
lazy `Translation`, `Book`, `Chapter`, and `Verse` objects without loading an
entire Bible object graph into every PHP process.

The package is deliberately Bible-only. Non-Bible SWORD modules remain visible
in the low-level catalog but are not exposed as Scripture translations.

## Capabilities

Installed SWORD Bible modules are exposed through validated, immutable
snapshots. The package provides bounded reader/writer locking, durable refresh
state, per-module outcomes, Joomla Console commands, and a Joomla Scheduled
Tasks bridge.

The released native ABI lists and exports installed modules. It does not
download, update, or remove CrossWire modules. Those operations remain disabled
unless the application injects a provisioner that explicitly advertises and
implements them. See the [provisioning boundary](https://github.com/getbible/scripture/blob/HEAD/docs/provisioning.md).

## Getting started

### Product-distributed runtime

People receiving an application should receive PHP, the native extension, the
Composer dependencies, and policy-approved SWORD modules as one tested runtime.
They should not need a compiler, PIE, or Composer on the production host. The
[shipping and deployment guide](https://github.com/getbible/scripture/blob/HEAD/docs/distribution.md) provides a concrete
container build and the equivalent installer contract for application
distributors.

### Existing Composer project

Direct library integration requires:

- Linux with PHP 8.2, 8.3, 8.4, or 8.5.
- The `getbiblesword` PHP extension, installed through PIE.
- Joomla Framework Console, DI, Event, Filesystem, and Registry packages,
  installed by Composer.
- A readable SWORD module root.

```bash
pie install 'getbible/sword:^0.1.1'
php --ri getbiblesword
composer require getbible/scripture
```

PIE owns the native-install confirmation and any administrator prompt. Version
`0.1.1` is the first extension release whose source asset follows PIE's normal
discovery convention. An already-installed `0.1.0` extension remains compatible
with this package, but its published source asset cannot be installed by that
one-command path.

The extension check is intentionally strict. Composer treats PHP extensions as
platform requirements; it verifies that `ext-getbiblesword` is loaded but does
not install it. Composer also does not execute scripts declared by dependency
packages. See [installation and setup](https://github.com/getbible/scripture/blob/HEAD/docs/installation.md) for the exact
boundary and supported deployment choices.

### Interactive setup

After Composer installation, inspect the runtime and configure the library:

```bash
vendor/bin/getbible-scripture scripture:doctor
vendor/bin/getbible-scripture scripture:setup
```

`scripture:setup` validates the loaded native runtime, module and cache paths,
installed Bible modules, refresh policy, and permissions. It does not invoke
PIE and cannot download CrossWire modules through ABI v1.

Applications can perform the same persisted configuration update through
`SetupServiceInterface::apply()`, including immediate warm-up. See
[programmatic setup](https://github.com/getbible/scripture/blob/HEAD/docs/api.md#programmatic-setup).

### Programmatic setup

```php
<?php

declare(strict_types=1);

use GetBible\Scripture\Configuration\Configuration;
use GetBible\Scripture\DependencyInjection\ContainerFactory;
use GetBible\Scripture\Service\ScriptureInterface;

require __DIR__ . '/vendor/autoload.php';

$configuration = Configuration::fromEnvironment([
    'module_path' => '/var/lib/getbible/sword',
    'cache_path' => '/var/cache/getbible/scripture',
]);

$container = ContainerFactory::create($configuration);

/** @var ScriptureInterface $scripture */
$scripture = $container->get(ScriptureInterface::class);

$initialization = $scripture->initialize(['KJV']);

if (!$initialization->succeeded()) {
    throw new RuntimeException(
        json_encode(
            $initialization->toArray(),
            JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR,
        ),
    );
}

$kjv = $scripture->translation('KJV');
$john316 = $kjv->book('John')->chapter(3)->verse(16);
$text = $john316->stripped();

if ($text === null) {
    throw new RuntimeException('This module does not provide stripped projections.');
}

echo $text->requireUtf8(), PHP_EOL;

foreach ($kjv->verses('John', 3, 16, 18) as $verse) {
    $text = $verse->stripped()?->requireUtf8() ?? $verse->raw()->requireUtf8();

    printf(
        "%s %d:%d %s\n",
        $verse->scope()->bookName()->requireUtf8(),
        $verse->scope()->chapter(),
        $verse->scope()->verse(),
        $text,
    );
}
```

The first request for an installed translation performs one full native export,
validates it, and creates an immutable indexed generation. Later requests open
that generation and hydrate only the requested objects.

Run interval-based maintenance from the application scheduler:

```php
$maintenance = $scripture->refreshIfDue();

if (!$maintenance->succeeded()) {
    // Send $maintenance->toArray() to the application's operational log.
}
```

No constructor performs network or full-module work. Both methods return
structured per-module results and continue safely across independent failures.

## Available data layers

Every verse retains:

- authoritative raw bytes;
- SWORD default-rendered bytes;
- stripped text bytes;
- the exact verse key and scope;
- lossless lexical annotation segments;
- SWORD's ordered three-level official attribute map; and
- the original contract record.

Every byte value verifies canonical Base64, decoded size, and SHA-256 before it
is exposed. The optional `utf8` member is treated only as a verified convenience
projection.

## Configuration

Configuration precedence depends on the entry point. Explicit configuration
objects always win. Interactive or programmatic setup applies request values,
then environment values, then persisted JSON, then documented defaults.
Normal container loading applies environment values over persisted JSON.

| Key | Environment variable | Default |
|---|---|---|
| `module_path` | `GETBIBLE_SCRIPTURE_MODULE_PATH` | Native extension resolution |
| `cache_path` | `GETBIBLE_SCRIPTURE_CACHE_PATH` | `$XDG_CACHE_HOME/getbible/scripture` |
| `refresh_interval` | `GETBIBLE_SCRIPTURE_REFRESH_INTERVAL` | `P1M` |
| `auto_refresh` | `GETBIBLE_SCRIPTURE_AUTO_REFRESH` | `true` |
| `lock_timeout` | `GETBIBLE_SCRIPTURE_LOCK_TIMEOUT` | `30` seconds |
| `modules` | `GETBIBLE_SCRIPTURE_MODULES` | All installed translations |
| `provisioning_enabled` | `GETBIBLE_SCRIPTURE_PROVISIONING_ENABLED` | `false` |
| `install_all` | `GETBIBLE_SCRIPTURE_INSTALL_ALL` | `false` |

See [configuration](https://github.com/getbible/scripture/blob/HEAD/docs/configuration.md) for operational details.

## Documentation

- [Architecture](https://github.com/getbible/scripture/blob/HEAD/docs/architecture.md)
- [Installation and setup](https://github.com/getbible/scripture/blob/HEAD/docs/installation.md)
- [Public API](https://github.com/getbible/scripture/blob/HEAD/docs/api.md)
- [Configuration](https://github.com/getbible/scripture/blob/HEAD/docs/configuration.md)
- [Contract v1 mapping](https://github.com/getbible/scripture/blob/HEAD/docs/contract-v1.md)
- [Caching and refresh](https://github.com/getbible/scripture/blob/HEAD/docs/caching.md)
- [Module provisioning](https://github.com/getbible/scripture/blob/HEAD/docs/provisioning.md)
- [Production operations](https://github.com/getbible/scripture/blob/HEAD/docs/operations.md)
- [Shipping and deployment](https://github.com/getbible/scripture/blob/HEAD/docs/distribution.md)
- [Releasing](https://github.com/getbible/scripture/blob/HEAD/docs/releasing.md)

## License

GPL-2.0-only, matching the native `getBibleSword` and `getbible/sword`
foundation. Individual CrossWire modules retain their own licenses and
distribution terms.


## Public API

### Composition

```php
$configuration = Configuration::fromEnvironment([
    'module_path' => '/var/lib/getbible/sword',
    'cache_path' => '/var/cache/getbible/scripture',
]);

$container = ContainerFactory::create($configuration);
$scripture = $container->get(ScriptureInterface::class);
```

To load the versioned JSON document written by `scripture:setup`:

```php
$container = ContainerFactory::create(
    configuration: null,
    configurationPath: '/etc/getbible/scripture.json',
);
$scripture = $container->get(ScriptureInterface::class);
```

Applications already using Joomla DI can register `ScriptureServiceProvider`
with their own container and pre-register `Configuration` when they need custom
values.

### Programmatic setup

Applications can persist validated settings and warm installed translations
through the same service used by the interactive command:

```php
use GetBible\Scripture\Setup\SetupRequest;
use GetBible\Scripture\Setup\SetupServiceInterface;

/** @var SetupServiceInterface $setup */
$setup = $container->get(SetupServiceInterface::class);

$result = $setup->apply(new SetupRequest(
    configurationPath: '/etc/getbible/scripture.json',
    values: [
        'module_path' => '/var/lib/getbible/sword',
        'cache_path' => '/var/cache/getbible/scripture',
        'modules' => ['KJV'],
        'auto_refresh' => true,
    ],
    warm: true,
));

if (!$result->succeeded()) {
    throw new RuntimeException(
        json_encode($result->toArray(), JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR),
    );
}
```

`SetupServiceInterface` never invokes PIE, Composer, a system package manager,
or a module download. It changes only the application-owned JSON configuration
and optionally warms modules already available to the native runtime.

### Scripture service

```php
$translations = $scripture->translations();
$translation = $scripture->translation('KJV');
$verse = $scripture->verse('KJV', 'John', 3, 16);
$range = $scripture->verses('KJV', 'John', 3, 16, 18);
$scripture->refreshTranslation('KJV');
$scripture->provisioningCapabilities();
$scripture->installTranslations(['KJV', 'WEB']);
$scripture->installAllTranslations();
$scripture->refreshSelectedModules(['KJV']);
$scripture->refreshModules();
$scripture->removeTranslation('KJV');
$scripture->initialize();
$scripture->refresh();
$scripture->refreshIfDue();
$scripture->maintenanceStatus();
```

`translations()` lists installed Bible modules. `translation()` opens the
current valid snapshot or performs one full warm-up. A forced refresh re-exports
the installed module and activates a new generation only after validation.

Provisioning methods are stable even when the injected native backend cannot
perform them. Inspect `provisioningCapabilities()` first. The default
getBibleSword ABI v1 adapter accurately reports every mutating capability as
unavailable and throws `ProvisioningUnavailableException` when called.

`initialize()`, `refresh()`, and `refreshIfDue()` return `MaintenanceResult`
objects with ordered snapshot outcomes, the optional native provisioning
result, operation errors, timestamps, and interval status. These operations
continue across independent module failures and report partial failure through
`succeeded()`.

### Translation

```php
$translation->moduleName();
$translation->metadata();
$translation->books();
$translation->book('John');
$translation->bookByPosition(testament: 2, book: 4);
$translation->verses('John', 3, 16, 18);
$translation->configEntriesNamed('DistributionLicense');
$translation->rawExportPath();
$translation->activatedAt();
$translation->expiresAt();
$translation->generationId();
```

Configuration entries are ordered and repeated keys are preserved.

### Book

```php
$book->testament();
$book->position();
$book->name();
$book->abbreviation();
$book->versification();
$book->chapters();
$book->chapter(3);
```

`position()` is the SWORD `VerseKey` book position within its versification and
testament. It is not assumed to be a universal 1-66 number.

### Chapter

```php
$chapter->number();
$chapter->verse(16);
$chapter->verses();
$chapter->verses(16, 18);
$chapter->introductions();
```

Ranges are inclusive. A reversed or invalid range throws
`InvalidReferenceException`.

### Verse

```php
$verse->scope();
$verse->key();
$verse->raw();
$verse->rendered();
$verse->stripped();
$verse->annotationSegments();
$verse->officialAttributes();
$verse->contractRecord();
```

`raw()`, `rendered()`, and `stripped()` return verified `ByteValue` objects.
`rendered()` and `stripped()` may be `null` only when the native producer could
not create projections.

### Byte values

```php
$bytes = $value->bytes();
$utf8 = $value->utf8();
$requiredUtf8 = $value->requireUtf8();
$hash = $value->sha256();
$size = $value->size();
$originalEnvelope = $value->toArray();
```

`requireUtf8()` throws when no exact UTF-8 projection exists. It never attempts a
lossy conversion.

### Events

The default Joomla dispatcher emits:

- `onGetBibleScriptureWarmStarted`
- `onGetBibleScriptureWarmCompleted`
- `onGetBibleScriptureWarmFailed`
- `onGetBibleScriptureRefreshStarted`
- `onGetBibleScriptureRefreshCompleted`
- `onGetBibleScriptureRefreshFailed`
- `onGetBibleScriptureProvisioningStarted`
- `onGetBibleScriptureProvisioningCompleted`
- `onGetBibleScriptureProvisioningFailed`
- `onGetBibleScriptureMaintenanceStarted`
- `onGetBibleScriptureMaintenanceCompleted`
- `onGetBibleScriptureMaintenanceFailed`

Event arguments contain the relevant module, operation, result, snapshot, or
exception for that lifecycle boundary. Listeners must not mutate an active
generation. Listener exceptions are contained so an observer cannot turn a
committed core operation into a reported failure.


## Production operations

### Lifecycle semantics

The public service exposes three explicit maintenance operations:

```php
$scripture->initialize();
$scripture->refresh();
$scripture->refreshIfDue();
```

`initialize()` installs missing configured translations only when runtime policy
enables provisioning and the injected backend advertises the required
capability. It then opens or warms validated snapshots for every target.

`refresh()` invokes remote module refresh only when `provisioning_enabled` is
true. It always rebuilds snapshots for installed targets. Under getBibleSword
ABI v1, leave provisioning disabled and manage the SWORD module root through a
separate trusted deployment process.

`refreshIfDue()` compares durable last-success state with `refresh_interval`.
The default is one calendar month. A failed or partially failed run does not
advance last-success time, so the next scheduler invocation retries.

All operations:

- take one bounded whole-run maintenance lock;
- isolate snapshot failures by module;
- preserve the last active snapshot on export or validation failure;
- write maintenance state through a synchronized temporary file and atomic
  rename;
- emit Joomla lifecycle events; and
- return a structured `MaintenanceResult`.

### CLI

Composer exposes the Joomla Console application as
`vendor/bin/getbible-scripture`. Run commands from the Composer application's directory. Start with the read-only runtime and state checks:

```bash
vendor/bin/getbible-scripture scripture:doctor --json
vendor/bin/getbible-scripture scripture:status
```

Configure the application interactively when it has not yet been set up:

```bash
vendor/bin/getbible-scripture scripture:setup
```

For an already-installed KJV module, initialize its indexed snapshot and run maintenance when due:

```bash
vendor/bin/getbible-scripture scripture:initialize --module=KJV
vendor/bin/getbible-scripture scripture:refresh --if-due
```

Multiple installed modules can be selected by repeating `--module`. An explicit `scripture:refresh --module=KJV` forces that module's refresh rather than waiting for the interval.

Doctor is read-only. Setup saves validated application configuration and can
warm already-installed translations; it never installs the native extension or
downloads modules. Both accept `--config=/absolute/path.json`. Setup also uses
`GETBIBLE_SCRIPTURE_CONFIG_PATH` when the option is absent and prompts for a
path only in an interactive terminal.

Commands emit deterministic JSON with `--json` or non-interactive input.
Interactive setup prints a concise summary followed by the same structured
result. Initialization and refresh return exit code `0` only when the complete
result succeeds, and `1` for partial or complete failure. Bootstrap, readiness,
and uncaught application failures use a non-zero Joomla Console exit code.

`--all` remains an explicit operation. It also requires
`GETBIBLE_SCRIPTURE_PROVISIONING_ENABLED=true` and a native backend that
advertises all-module installation.

### Environment

A production deployment can use:

```dotenv
GETBIBLE_SCRIPTURE_MODULE_PATH=/var/lib/getbible/sword
GETBIBLE_SCRIPTURE_CACHE_PATH=/var/cache/getbible/scripture
GETBIBLE_SCRIPTURE_MODULES=KJV,WEB
GETBIBLE_SCRIPTURE_REFRESH_INTERVAL=P1M
GETBIBLE_SCRIPTURE_AUTO_REFRESH=true
GETBIBLE_SCRIPTURE_PROVISIONING_ENABLED=false
GETBIBLE_SCRIPTURE_INSTALL_ALL=false
GETBIBLE_SCRIPTURE_LOCK_TIMEOUT=30
```

The PHP-FPM and scheduler users must share read access to the SWORD root and
read/write access to the cache root. Run maintenance as the same operating
system identity as the application whenever possible.

For file-based configuration, set:

```dotenv
GETBIBLE_SCRIPTURE_CONFIG_PATH=/etc/getbible/scripture.json
```

The setup command writes only allowlisted settings through an atomic
same-directory replacement, refuses a symlink target, and gives a new file mode
`0600`. Environment values remain available for deployments that manage
configuration outside the application.

### Cron

These scheduler examples are for administrators of a deployed PHP application. They assume the application lives at `/srv/getbible-app`, PHP is `/usr/bin/php`, and the configured module/cache paths below exist with the stated permissions. Adjust the deployment configuration to match the actual installation before registering a scheduled task.

The command contains its own bounded interprocess lock, so overlapping cron
runs safely serialize:

```cron
17 3 * * * cd /srv/getbible-app && /usr/bin/php vendor/bin/getbible-scripture scripture:refresh --if-due >> /var/log/getbible-scripture.log 2>&1
```

Run the cron entry daily or weekly; durable interval state decides whether the
monthly work is due.

### systemd

`/etc/systemd/system/getbible-scripture.service`:

```ini
[Unit]
Description=GetBible Scripture maintenance
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
User=www-data
Group=www-data
WorkingDirectory=/srv/getbible-app
EnvironmentFile=/etc/getbible/scripture.env
ExecStart=/usr/bin/php vendor/bin/getbible-scripture scripture:refresh --if-due
PrivateTmp=true
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/cache/getbible/scripture
ReadOnlyPaths=/var/lib/getbible/sword
```

`/etc/systemd/system/getbible-scripture.timer`:

```ini
[Unit]
Description=Run GetBible Scripture maintenance daily

[Timer]
OnCalendar=*-*-* 03:17:00
Persistent=true
RandomizedDelaySec=15m
Unit=getbible-scripture.service

[Install]
WantedBy=timers.target
```

After installing both unit files and the `/etc/getbible/scripture.env` environment file, verify that `www-data` is your application identity and that it can access the configured paths. Then enable the timer on that host:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now getbible-scripture.timer
systemctl list-timers getbible-scripture.timer
```

If an injected native provisioner writes to the SWORD root, change its systemd
path allowance from `ReadOnlyPaths` to the narrow required `ReadWritePaths`.

### Joomla Scheduled Tasks

`ScheduledRefreshHandler` is registered in the same Joomla DI container as the
Scripture service:

```php
use GetBible\Scripture\Integration\Joomla\ScheduledRefreshHandler;

$handler = $container->get(ScheduledRefreshHandler::class);
$result = $handler();
```

A Joomla CMS scheduler plugin can call this service from its task execution
callback, log `MaintenanceResult::toArray()`, and map `succeeded()` to the CMS
task success/failure status. The handler performs interval gating itself, so
the CMS task can run daily without forcing a monthly refresh on every run.

### Health checks

Use:

```bash
vendor/bin/getbible-scripture scripture:doctor --json
vendor/bin/getbible-scripture scripture:status
```

Doctor verifies configuration parsing, native extension compatibility, module
root access, cache access, installed modules, and warm-up readiness without
changing state. Status reports:

- whether maintenance is due;
- the next due time;
- last attempt, success, and failure timestamps;
- consecutive failures and the last error;
- configured and installed translations;
- runtime provisioning policy; and
- exact native backend capabilities.

Alert on a non-null `last_error`, increasing `consecutive_failures`, or a due
state that remains unchanged across multiple scheduler invocations.


## Support and source documentation

For questions about this project, installation, unexpected output, or contributing, use the [single GetBible support desk](https://git.vdm.dev/getBible/support). Include the project, installed release or commit, operating system, relevant API version, and a minimal reproduction. General enquiries can be sent to [getBible@TrueChristian.church](mailto:getBible@TrueChristian.church).

This guide follows the [repository README](https://github.com/getbible/scripture/blob/HEAD/README.md) and [api](https://github.com/getbible/scripture/blob/HEAD/docs/api.md), [operations](https://github.com/getbible/scripture/blob/HEAD/docs/operations.md). Scripture and study resources retain their own source licences; a software licence does not relicense the texts.
