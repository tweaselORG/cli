# Tweasel CI

> Command-line tool for the libraries of the tweasel project.

<!-- TODO: A longer introduction to the module. -->

<!-- The heading levels are unfortunately really messed up here. This is caused by oclif's README generator: https://github.com/oclif/dev-cli/issues/112 -->


## Installation

You can install tweasel CLI using yarn or npm (you probably want to install it globally):

```sh
yarn global add tweasel-cli
# or `npm i -g tweasel-cli`
```

You can then run the CLI using the `tweasel` command.

# Commands

<!-- commands -->
* [`tweasel hello PERSON`](#tweasel-hello-person)
* [`tweasel hello:world`](#tweasel-helloworld)
* [`tweasel help [COMMANDS]`](#tweasel-help-commands)

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

## `tweasel hello:world`

Say hello world

```
USAGE
  $ tweasel hello:world

DESCRIPTION
  Say hello world

EXAMPLES
  $ tweasel hello:world
  hello world! (./src/commands/hello/world.ts)
```

_See code: [dist/commands/hello/world.ts](https://github.com/tweaselORG/cli/blob/v0.0.0/dist/commands/hello/world.ts)_

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
<!-- commandsstop -->

## License

This code is licensed under the MIT license, see the [`LICENSE`](LICENSE) file for details.

Issues and pull requests are welcome! Please be aware that by contributing, you agree for your work to be licensed under an MIT license.
