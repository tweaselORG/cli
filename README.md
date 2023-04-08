# Tweasel CLI

> Command-line tool for the libraries of the tweasel project.

The tweasel project provides various JavaScript libraries for instrumenting and analyzing mobile apps and their traffic. `tweasel-cli` is a command-line tool that provides a convenient wrapper around these libraries for common use cases, so you don't have to write any code. Currently, support for [`cyanoacrylate`](https://github.com/tweaselORG/cyanoacrylate) is implemented.

The tweasel CLI provides the following commands:

* `record-traffic`: Record the traffic of an Android or iOS app in HAR format.

  The app will be installed and started automatically on the device or emulator. Its traffic will be then recorded for the specified duration and saved as a HAR file at the end. You can either record the traffic of the entire system or only the specified app (default).

  The app can optionally be uninstalled automatically afterwards.

More commands and support for the other libraries will be added soon.

If you want more control over the analysis, you can use the libraries directly. See the [README for cyanoacrylate](https://github.com/tweaselORG/cyanoacrylate).

<!-- The heading levels are unfortunately really messed up here. This is caused by oclif's README generator: https://github.com/oclif/dev-cli/issues/112 -->

## Installation

To use `tweasel-cli`, you need to have Node.js and Python 3.8 or greater installed. Depending on the device platform(s) you are interested in, you need to install different host dependencies. Take a look at the [README for appstraction](https://github.com/tweaselORG/appstraction#host-dependencies-for-android) and follow the instructions to install those.

You can then install the tweasel CLI using yarn or npm (you probably want to install it globally):

```sh
yarn global add tweasel-cli
# or `npm i -g tweasel-cli`
```

You can run the CLI using the `tweasel` command.

# Commands

<!-- commands -->
* [`tweasel autocomplete [SHELL]`](#tweasel-autocomplete-shell)
* [`tweasel help [COMMANDS]`](#tweasel-help-commands)
* [`tweasel record-traffic <APP FILE(S)>`](#tweasel-record-traffic-app-files)

## `tweasel autocomplete [SHELL]`

display autocomplete installation instructions

```
USAGE
  $ tweasel autocomplete [SHELL] [-r]

ARGUMENTS
  SHELL  shell type

FLAGS
  -r, --refresh-cache  Refresh cache (ignores displaying instructions)

DESCRIPTION
  display autocomplete installation instructions

EXAMPLES
  $ tweasel autocomplete

  $ tweasel autocomplete bash

  $ tweasel autocomplete zsh

  $ tweasel autocomplete --refresh-cache
```

_See code: [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/v2.1.8/src/commands/autocomplete/index.ts)_

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

## `tweasel record-traffic <APP FILE(S)>`

Record the traffic of an Android or iOS app in HAR format.

```
USAGE
  $ tweasel record-traffic <APP FILE(S)> [-p android|ios] [-t device|emulator] [--timeout <value>] [-o <value>]
    [--bypass-certificate-pinning] [--all-traffic] [--uninstall-app] [--grant-permissions]
    [--bypass-tracking-domain-resolution-check] [--emulator-name <value>] [--emulator-snapshot-name <value>]
    [--emulator-headless] [--emulator-no-audio] [--emulator-ephemeral]

ARGUMENTS
  <APP FILE(S)>  The path to the app to analyze (.ipa on iOS, .apk on Android). Can be specified multiple times for
                 split APKs on Android.

FLAGS
  -o, --output=<value>                       The path to the HAR file to save the traffic to. If not specified, a file
                                             named <app ID>.har will be created in the current directory.
  -p, --platform=<option>                    The platform to run the app on (will be inferred from the first app file if
                                             not specified).
                                             <options: android|ios>
  -t, --run-target=<option>                  [default: device] The target to run the app on.
                                             <options: device|emulator>
  --all-traffic                              By default, only the traffic of the specified app is recorded. Set this
                                             flag to record all traffic.
  --[no-]bypass-certificate-pinning          Bypass certificate pinning on Android using objection. Enabled by default.
  --bypass-tracking-domain-resolution-check  By default, we assert that a few tracking domains can be resolved. This is
                                             useful to ensure that no DNS tracking blocker is interfering with the
                                             results. Set this flag to disable this behavior.
  --[no-]grant-permissions                   Automatically grant all permissions to the app. Enabled by default.
  --timeout=<value>                          [default: 60] How long to run the app and record its traffic for (in
                                             seconds).
  --uninstall-app                            Whether to uninstall the app after the analysis.

EMULATOR FLAGS
  --emulator-ephemeral              Whether to discard all changes when exiting the emulator.
  --emulator-headless               Whether to start the emulator in headless mode.
  --emulator-name=<value>           The name of the emulator to start. If you don't provide this, you need to start the
                                    emulator yourself.
  --emulator-no-audio               Whether to start the emulator with audio disabled.
  --emulator-snapshot-name=<value>  The name of a snapshot to reset the emulator to before starting.

DESCRIPTION
  Record the traffic of an Android or iOS app in HAR format.

  The app will be installed and started automatically on the device or emulator. Its traffic will be then recorded for
  the specified duration and saved as a HAR file at the end. You can either record the traffic of the entire system or
  only the specified app (default).

  The app can optionally be uninstalled automatically afterwards.

EXAMPLES
  Record the traffic of `app.apk` for 60 seconds.

    $ tweasel record-traffic app.apk

  Record the traffic of an consisting of multiple split APKs.

    $ tweasel record-traffic app.apk config.en.app.apk config.xxhdpi.app.apk

  Record the traffic of `app.apk` for 30 seconds in the emulator called `my-emulator` and start that emulator
  automatically.

    $ tweasel record-traffic app.apk -t emulator --emulator-name my-emulator --timeout 30

  Record the traffic of `app.apk` for 10 seconds and save the HAR file to `traffic.har` in your home directory.

    $ tweasel record-traffic app.apk -o ~/traffic.har --timeout 10

  Install and run `app.apk` but record the traffic of the entire system.

    $ tweasel record-traffic app.apk --all-traffic
```

_See code: [dist/commands/record-traffic.ts](https://github.com/tweaselORG/cli/blob/v0.0.0/dist/commands/record-traffic.ts)_
<!-- commandsstop -->

## License

This code is licensed under the MIT license, see the [`LICENSE`](LICENSE) file for details.

Issues and pull requests are welcome! Please be aware that by contributing, you agree for your work to be licensed under an MIT license.
