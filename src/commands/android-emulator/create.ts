import { Args, Command, Flags } from '@oclif/core';
import { createEmulator, listPackages } from 'andromatic';
import enquirer from 'enquirer';

export default class AndroidEmulatorCreate extends Command {
    static override summary = 'Create an Android emulator.';
    static override description = `You can either use the --package flag to manually specify a system image to use, or use the --api-level, --variant, and --architecture flags to specify the system image to use. Alternatively, they will be prompted for interactively if not specified.`;

    static override examples = [
        {
            description:
                'Create an Android emulator called `my-emulator`. You will be interactively prompted for the system image to use.',
            command: '<%= config.bin %> <%= command.id %> my-emulator',
        },
        {
            description: 'Create an x86_64 Android 13 emulator called `android13`.',
            command:
                '<%= config.bin %> <%= command.id %> android13 --api-level 33 --variant google_apis --architecture x86_64',
        },
        {
            description: 'Create the same emulator as in the last example but specified by package path.',
            command: '<%= config.bin %> <%= command.id %> android13 "system-images;android-33;google_apis;x86_64"',
        },
        {
            description: 'Create an emulator called `pixel2` with a Pixel 2 device and a 16 GB partition size.',
            command: '<%= config.bin %> <%= command.id %> pixel2 --device pixel_2 --partition-size 16384',
        },
        {
            description:
                'Create an emulator called `test`, overridign any potential existing emulator with the same name.',
            command: '<%= config.bin %> <%= command.id %> test --force',
        },
    ];

    static override flags = {
        package: Flags.string({
            description:
                'The package path of the system image to use as understood by `sdkmanager` (e.g. `system-images;android-30;google_apis;x86_64`).',
            exclusive: ['api-level', 'variant', 'architecture'],
            aliases: ['k'], // To match `avdmanager`.
        }),

        'api-level': Flags.string({
            description: 'The API level of the system image to use for the emulator, such as 30 for Android 11.',
        }),
        variant: Flags.string({
            description: 'The variant of the system image to use for the emulator.',
            options: [
                'default',
                'google_apis',
                'google_apis_playstore',
                'aosp_atd',
                'google_atd',
                'android-tv',
                'google-tv',
                'android-wear',
                'android-wear-cn',
            ],
        }),
        architecture: Flags.string({
            description: 'The architecture of the system image to use for the emulator.',
            options: ['x86', 'x86_64', 'arm64-v8a', 'armeabi-v7a'],
        }),

        device: Flags.string({
            description:
                'The name of the device to use for the emulator, which determines the screen size, resolution, density and hardware features. Defaults to `pixel_4`.',
            aliases: ['d'],
        }),
        'partition-size': Flags.string({
            description:
                'The partition size of the emulator in MB. Note that sometimes the partition size is not respected exactly, but the partition will always have at least the specified size.',
            aliases: ['s'],
        }),
        force: Flags.boolean({
            description: 'Whether to overwrite an existing emulator with the same name or not.',
            allowNo: true,
            default: false,
            aliases: ['f'],
        }),
    };

    static override args = {
        '<name>': Args.string({
            description: 'The name of the emulator to create.',
            required: true,
        }),
    };

    async run() {
        const { args, flags } = await this.parse(AndroidEmulatorCreate);

        const commonArgs = {
            device: flags.device,
            partitionSize: flags['partition-size'] ? +flags['partition-size'] : undefined,
            force: flags.force,
        };

        if (flags.package) {
            await createEmulator(args['<name>'], {
                package: flags.package,
                ...commonArgs,
            });
        } else {
            // Interactively prompt for the missing flags.
            const promptedFlags =
                !flags['api-level'] || !flags.variant || !flags.architecture
                    ? await (async () => {
                          const availablePackages = await listPackages().then((packages) =>
                              packages
                                  .filter((p) => p.path.startsWith('system-images;android-'))
                                  .map((p) => p.path.split(';'))
                                  .map((p) => ({
                                      apiLevel: +(p[1]?.replace('android-', '') || -1),
                                      variant: p[2],
                                      architecture: p[3],
                                  }))
                          );
                          const res: { 'api-level'?: number; variant?: string; architecture?: string } = {};

                          if (!flags['api-level']) {
                              const { apiLevel } = await enquirer.prompt<{ apiLevel: string }>({
                                  type: 'select',
                                  name: 'apiLevel',
                                  message: 'Select an API level:',
                                  choices: androidVersions
                                      .filter((v) => availablePackages.some((p) => p.apiLevel === v.apiLevel))
                                      .map((v) => ({
                                          message: `${v.apiLevel} (${v.version}${v.name ? `, ${v.name}` : ''})`,
                                          name: v.apiLevel.toString(),
                                      })),
                              });
                              res['api-level'] = +apiLevel;
                          }

                          if (!flags.variant) {
                              const { variant } = await enquirer.prompt<{ variant: string }>({
                                  type: 'select',
                                  name: 'variant',
                                  message: 'Select a variant:',
                                  choices: [
                                      { name: 'default', message: 'Vanilla Android' },
                                      { name: 'google_apis', message: 'Android with Google APIs' },
                                      {
                                          name: 'google_apis_playstore',
                                          message: 'Android with Google APIs and Play Store',
                                      },
                                      { name: 'aosp_atd', message: 'Automated Test Device (ATD)' },
                                      { name: 'google_atd', message: 'Automated Test Device (ATD) with Google APIs' },
                                      { name: 'android-tv', message: 'Android TV' },
                                      { name: 'google-tv', message: 'Google TV' },
                                      { name: 'android-wear', message: 'Wear OS' },
                                      { name: 'android-wear-cn', message: 'China version of Wear OS 3' },
                                  ].filter((v) =>
                                      availablePackages.some(
                                          (p) => p.apiLevel === res['api-level'] && p.variant === v.name
                                      )
                                  ),
                              });
                              res.variant = variant;
                          }

                          if (!flags.architecture) {
                              const { architecture } = await enquirer.prompt<{ architecture: string }>({
                                  type: 'select',
                                  name: 'architecture',
                                  message: 'Select an architecture:',
                                  choices: [
                                      { name: 'x86', message: 'x86' },
                                      { name: 'x86_64', message: 'x86_64' },
                                      { name: 'arm64-v8a', message: 'arm64' },
                                      { name: 'armeabi-v7a', message: 'arm' },
                                  ].filter((v) =>
                                      availablePackages.some(
                                          (p) =>
                                              p.apiLevel === res['api-level'] &&
                                              p.variant === res.variant &&
                                              p.architecture === v.name
                                      )
                                  ),
                              });
                              res.architecture = architecture;
                          }

                          return res;
                      })()
                    : {};

            await createEmulator(args['<name>'], {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                apiLevel: flags['api-level'] ? +flags['api-level'] : promptedFlags['api-level']!,
                variant: (flags.variant ?? promptedFlags.variant) as 'default',
                architecture: (flags.architecture ?? promptedFlags.architecture) as 'x86_64',
                ...commonArgs,
            });
        }
    }
}

// From: https://en.wikipedia.org/wiki/Android_version_history#Overview
const androidVersions = [
    { name: undefined, version: '1.0', apiLevel: 1 },
    { name: 'Petit Four', version: '1.1', apiLevel: 2 },
    { name: 'Cupcake', version: '1.5', apiLevel: 3 },
    { name: 'Donut', version: '1.6', apiLevel: 4 },
    { name: 'Eclair', version: '2.0', apiLevel: 5 },
    { name: 'Eclair', version: '2.0.1', apiLevel: 6 },
    { name: 'Eclair', version: '2.1', apiLevel: 7 },
    { name: 'Froyo', version: '2.2', apiLevel: 8 },
    { name: 'Gingerbread', version: '2.3 – 2.3.2', apiLevel: 9 },
    { name: 'Gingerbread', version: '2.3.3 – 2.3.7', apiLevel: 10 },
    { name: 'Honeycomb', version: '3.0', apiLevel: 11 },
    { name: 'Honeycomb', version: '3.1', apiLevel: 12 },
    { name: 'Honeycomb', version: '3.2', apiLevel: 13 },
    { name: 'Ice Cream Sandwich', version: '4.0 – 4.0.2', apiLevel: 14 },
    { name: 'Ice Cream Sandwich', version: '4.0.3 – 4.0.4', apiLevel: 15 },
    { name: 'Jelly Bean', version: '4.1', apiLevel: 16 },
    { name: 'Jelly Bean', version: '4.2', apiLevel: 17 },
    { name: 'Jelly Bean', version: '4.3', apiLevel: 18 },
    { name: 'KitKat', version: '4.4', apiLevel: 19 },
    { name: 'Lollipop', version: '5.0', apiLevel: 21 },
    { name: 'Lollipop', version: '5.1', apiLevel: 22 },
    { name: 'Marshmallow', version: '6.0', apiLevel: 23 },
    { name: 'Nougat', version: '7.0', apiLevel: 24 },
    { name: 'Nougat', version: '7.1', apiLevel: 25 },
    { name: 'Oreo', version: '8.0', apiLevel: 26 },
    { name: 'Oreo', version: '8.1', apiLevel: 27 },
    { name: 'Pie', version: '9', apiLevel: 28 },
    { name: undefined, version: '10', apiLevel: 29 },
    { name: undefined, version: '11', apiLevel: 30 },
    { name: undefined, version: '12', apiLevel: 31 },
    { name: undefined, version: '12.1', apiLevel: 32 },
    { name: undefined, version: '13', apiLevel: 33 },
    { name: undefined, version: '14', apiLevel: 34 },
].reverse();
