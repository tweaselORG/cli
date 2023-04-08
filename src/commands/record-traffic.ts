import { Args, Command, Flags } from '@oclif/core';
import type { Analysis, AppAnalysis, SupportedCapability } from 'cyanoacrylate';
import { pause, startAnalysis } from 'cyanoacrylate';
import { writeFile } from 'fs/promises';
import listr from 'listr';

type ListrCtx = {
    analysis: Analysis<'android' | 'ios', 'emulator', SupportedCapability<'android'>[]>;
    appAnalysis: AppAnalysis<'android' | 'ios', 'emulator', SupportedCapability<'android'>[]>;
};

export default class RecordTraffic extends Command {
    static override summary = 'Record the traffic of an Android or iOS app in HAR format.';
    static override description = `The app will be installed and started automatically on the device or emulator. Its traffic will be then recorded for the specified duration and saved as a HAR file at the end. You can either record the traffic of the entire system or only the specified app (default).

The app can optionally be uninstalled automatically afterwards.`;

    // To allow multiple arguments.
    static override strict = false;

    static override examples = [
        {
            description: 'Record the traffic of `app.apk` for 60 seconds.',
            command: '<%= config.bin %> <%= command.id %> app.apk',
        },
        {
            description: 'Record the traffic of an consisting of multiple split APKs.',
            command: '<%= config.bin %> <%= command.id %> app.apk config.en.app.apk config.xxhdpi.app.apk',
        },
        {
            description:
                'Record the traffic of `app.apk` for 30 seconds in the emulator called `my-emulator` and start that emulator automatically.',
            command: '<%= config.bin %> <%= command.id %> app.apk -t emulator --emulator-name my-emulator --timeout 30',
        },
        {
            description:
                'Record the traffic of `app.apk` for 10 seconds and save the HAR file to `traffic.har` in your home directory.',
            command: '<%= config.bin %> <%= command.id %> app.apk -o ~/traffic.har --timeout 10',
        },
        {
            description: 'Install and run `app.apk` but record the traffic of the entire system.',
            command: '<%= config.bin %> <%= command.id %> app.apk --all-traffic',
        },
    ];

    static override flags = {
        platform: Flags.string({
            char: 'p',
            description: 'The platform to run the app on (will be inferred from the first app file if not specified).',
            required: false,
            options: ['android', 'ios'],
        }),

        'run-target': Flags.string({
            char: 't',
            description: 'The target to run the app on.',
            default: 'device',
            options: ['device', 'emulator'],
        }),

        timeout: Flags.integer({
            description: 'How long to run the app and record its traffic for (in seconds).',
            default: 60,
        }),

        output: Flags.string({
            char: 'o',
            description:
                'The path to the HAR file to save the traffic to. If not specified, a file named <app ID>.har will be created in the current directory.',
            required: false,
        }),

        'bypass-certificate-pinning': Flags.boolean({
            description: 'Bypass certificate pinning on Android using objection. Enabled by default.',
            allowNo: true,
            default: true,
        }),

        'all-traffic': Flags.boolean({
            description:
                'By default, only the traffic of the specified app is recorded. Set this flag to record all traffic.',
            default: false,
        }),

        'uninstall-app': Flags.boolean({
            description: 'Whether to uninstall the app after the analysis.',
            default: false,
        }),

        'grant-permissions': Flags.boolean({
            description: 'Automatically grant all permissions to the app. Enabled by default.',
            allowNo: true,
            default: true,
        }),

        'bypass-tracking-domain-resolution-check': Flags.boolean({
            description:
                'By default, we assert that a few tracking domains can be resolved. This is useful to ensure that no DNS tracking blocker is interfering with the results. Set this flag to disable this behavior.',
            default: false,
        }),

        'emulator-name': Flags.string({
            description:
                "The name of the emulator to start. If you don't provide this, you need to start the emulator yourself.",
            helpGroup: 'EMULATOR',
        }),

        'emulator-snapshot-name': Flags.string({
            description: 'The name of a snapshot to reset the emulator to before starting.',
            helpGroup: 'EMULATOR',
            required: false,
        }),

        'emulator-headless': Flags.boolean({
            description: 'Whether to start the emulator in headless mode.',
            helpGroup: 'EMULATOR',
            default: false,
        }),

        'emulator-no-audio': Flags.boolean({
            description: 'Whether to start the emulator with audio disabled.',
            helpGroup: 'EMULATOR',
            default: false,
        }),

        'emulator-ephemeral': Flags.boolean({
            description: 'Whether to discard all changes when exiting the emulator.',
            helpGroup: 'EMULATOR',
            default: false,
        }),
    };

    static override args = {
        '<app file(s)>': Args.string({
            description:
                'The path to the app to analyze (.ipa on iOS, .apk on Android). Can be specified multiple times for split APKs on Android.',
            required: true,
        }),
    };

    async run() {
        const { argv, flags } = await this.parse(RecordTraffic);
        const appFiles = argv as string[];

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const platform = (flags.platform as 'ios' | 'android') ?? (appFiles[0]!.endsWith('.ipa') ? 'ios' : 'android');

        await new listr<ListrCtx>([
            {
                title: 'Setting up…',
                task: async (ctx) => {
                    ctx.analysis = await startAnalysis({
                        platform,
                        runTarget: flags['run-target'] as 'emulator',
                        capabilities: flags['bypass-certificate-pinning']
                            ? ['certificate-pinning-bypass', 'frida']
                            : [],
                        targetOptions: {
                            startEmulatorOptions: {
                                emulatorName: flags['emulator-name'],
                                headless: flags['emulator-headless'],
                                audio: !flags['emulator-no-audio'],
                                ephemeral: flags['emulator-ephemeral'],
                            },
                            snapshotName: flags['emulator-snapshot-name'],
                        },
                    });

                    if (!flags['bypass-tracking-domain-resolution-check'])
                        await ctx.analysis.ensureTrackingDomainResolution();
                    await ctx.analysis.ensureDevice();
                    if (flags['emulator-snapshot-name']) await ctx.analysis.resetDevice();

                    ctx.appAnalysis = await ctx.analysis.startAppAnalysis(appFiles);
                },
            },
            {
                title: 'Installing app…',
                task: async (ctx) => {
                    await ctx.appAnalysis.installApp();
                    if (flags['grant-permissions']) await ctx.appAnalysis.setAppPermissions();
                },
            },
            {
                title: 'Starting app…',
                task: async (ctx) => {
                    await ctx.analysis.startTrafficCollection(
                        flags['all-traffic'] ? undefined : { mode: 'allowlist', apps: [ctx.appAnalysis.app.id] }
                    );
                    await ctx.appAnalysis.startApp();
                },
            },
            {
                title: `Waiting ${flags['timeout']} seconds…`,
                task: () => pause(flags['timeout'] * 1000),
            },
            {
                title: 'Saving traffic and stopping app…',
                task: async (ctx) => {
                    const traffic = await ctx.analysis.stopTrafficCollection();
                    await writeFile(flags.output || `${ctx.appAnalysis.app.id}.har`, JSON.stringify(traffic, null, 4));

                    await ctx.appAnalysis.stopApp();
                },
            },
            {
                title: 'Uninstalling app…',
                enabled: () => flags['uninstall-app'],
                task: (ctx) => ctx.appAnalysis.uninstallApp(),
            },
            {
                title: 'Cleaning up…',
                task: async (ctx) => {
                    await ctx.appAnalysis.stop();
                    await ctx.analysis.stop();
                },
            },
        ]).run();
    }
}
