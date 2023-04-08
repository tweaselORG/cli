oclif-hello-world
=================

oclif example Hello World CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/oclif-hello-world.svg)](https://npmjs.org/package/oclif-hello-world)
[![CircleCI](https://circleci.com/gh/oclif/hello-world/tree/main.svg?style=shield)](https://circleci.com/gh/oclif/hello-world/tree/main)
[![Downloads/week](https://img.shields.io/npm/dw/oclif-hello-world.svg)](https://npmjs.org/package/oclif-hello-world)
[![License](https://img.shields.io/npm/l/oclif-hello-world.svg)](https://github.com/oclif/hello-world/blob/main/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g tweasel-cli
$ tweasel COMMAND
running command...
$ tweasel (--version)
tweasel-cli/0.0.0 linux-x64 node-v18.15.0
$ tweasel --help [COMMAND]
USAGE
  $ tweasel COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`tweasel hello PERSON`](#tweasel-hello-person)
* [`tweasel hello world`](#tweasel-hello-world)
* [`tweasel help [COMMANDS]`](#tweasel-help-commands)
* [`tweasel plugins`](#tweasel-plugins)
* [`tweasel plugins:install PLUGIN...`](#tweasel-pluginsinstall-plugin)
* [`tweasel plugins:inspect PLUGIN...`](#tweasel-pluginsinspect-plugin)
* [`tweasel plugins:install PLUGIN...`](#tweasel-pluginsinstall-plugin-1)
* [`tweasel plugins:link PLUGIN`](#tweasel-pluginslink-plugin)
* [`tweasel plugins:uninstall PLUGIN...`](#tweasel-pluginsuninstall-plugin)
* [`tweasel plugins:uninstall PLUGIN...`](#tweasel-pluginsuninstall-plugin-1)
* [`tweasel plugins:uninstall PLUGIN...`](#tweasel-pluginsuninstall-plugin-2)
* [`tweasel plugins update`](#tweasel-plugins-update)

## `tweasel hello PERSON`

Say hello

```
USAGE
  $ tweasel hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ oex hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [dist/commands/hello/index.ts](https://github.com/tweaselORG/cli/blob/v0.0.0/dist/commands/hello/index.ts)_

## `tweasel hello world`

Say hello world

```
USAGE
  $ tweasel hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ tweasel hello world
  hello world! (./src/commands/hello/world.ts)
```

## `tweasel help [COMMANDS]`

Display help for tweasel.

```
USAGE
  $ tweasel help [COMMANDS] [-n]

ARGUMENTS
  COMMANDS  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for tweasel.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.2.9/src/commands/help.ts)_

## `tweasel plugins`

List installed plugins.

```
USAGE
  $ tweasel plugins [--core]

FLAGS
  --core  Show core plugins.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ tweasel plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.4.4/src/commands/plugins/index.ts)_

## `tweasel plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ tweasel plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ tweasel plugins add

EXAMPLES
  $ tweasel plugins:install myplugin 

  $ tweasel plugins:install https://github.com/someuser/someplugin

  $ tweasel plugins:install someuser/someplugin
```

## `tweasel plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ tweasel plugins:inspect PLUGIN...

ARGUMENTS
  PLUGIN  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ tweasel plugins:inspect myplugin
```

## `tweasel plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ tweasel plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ tweasel plugins add

EXAMPLES
  $ tweasel plugins:install myplugin 

  $ tweasel plugins:install https://github.com/someuser/someplugin

  $ tweasel plugins:install someuser/someplugin
```

## `tweasel plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ tweasel plugins:link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Links a plugin into the CLI for development.
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ tweasel plugins:link myplugin
```

## `tweasel plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ tweasel plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ tweasel plugins unlink
  $ tweasel plugins remove
```

## `tweasel plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ tweasel plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ tweasel plugins unlink
  $ tweasel plugins remove
```

## `tweasel plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ tweasel plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ tweasel plugins unlink
  $ tweasel plugins remove
```

## `tweasel plugins update`

Update installed plugins.

```
USAGE
  $ tweasel plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```
<!-- commandsstop -->
