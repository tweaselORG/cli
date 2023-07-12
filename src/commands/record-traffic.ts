import { Args, Command, Flags } from '@oclif/core';
import type { Analysis, AppAnalysis, SupportedCapability } from 'cyanoacrylate';
import { pause, startAnalysis } from 'cyanoacrylate';
import { exists } from 'fs-extra';
import { writeFile } from 'fs/promises';
import { Listr } from 'listr2';
import { basename, dirname, extname, join } from 'path';

type ListrCtx = {
    analysis: Analysis<'android' | 'ios', 'emulator', SupportedCapability<'android'>[]>;
    appAnalysis: AppAnalysis<'android' | 'ios', 'emulator', SupportedCapability<'android'>[]>;
    trafficCollectionOptions: Parameters<ListrCtx['analysis']['startTrafficCollection']>[0];
    appIdOrPath: string | `${string}.apk`[];
    currentTrafficCollectionName?: string;
};

export default class RecordTraffic extends Command {
    static override summary = 'Record the traffic of an Android or iOS app in HAR format.';
    static override description = `The app will be started automatically on the device or emulator. Its traffic will be then recorded until the user stops the collection or for the specified duration and saved as a HAR file at the end. You can either record the traffic of the entire system or only the specified app (default on Android, currently unsupported on iOS).

The app can optionally be uninstalled automatically afterwards.`;

    // To allow multiple arguments.
    static override strict = false;

    static override examples = [
        {
            description:
                'Record the traffic of the Android app `app.apk` on a physical device. Wait for the user to stop the collection.',
            command: '<%= config.bin %> <%= command.id %> app.apk',
        },
        {
            description: 'Record the traffic of the app with the ID `org.example.app` on a physical Android device.',
            command: '<%= config.bin %> <%= command.id %> org.example.app --platform android',
        },
        {
            description:
                'Record the traffic of the iOS app `app.ipa` for 60 seconds on the physical iPhone with the IP 10.0.0.2. The host that runs the proxy has the IP 10.0.0.2.',
            command:
                '<%= config.bin %> <%= command.id %> app.ipa --timeout 60 --ios-ip 10.0.0.3 --ios-proxy-ip 10.0.0.2',
        },
        {
            description:
                'Record the traffic of `app.apk` in multiple chunks. Wait for the user to start and stop each chunk. Each chunk is saved as a separate HAR file, with the chunk name appended to filename.',
            command: '<%= config.bin %> <%= command.id %> app.apk --multiple-collections',
        },
        {
            description: 'Record the traffic of an Android app consisting of multiple split APKs.',
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
            description:
                'The platform to run the app on (will be inferred from the first app file if not specified). Required if you provide an app ID instead of files.',
            required: false,
            options: ['android', 'ios'],

            relationships: [
                {
                    type: 'all',
                    flags: [{ name: 'ios-proxy-ip', when: async (f) => f['platform'] === 'ios' }],
                },
            ],
        }),

        'run-target': Flags.string({
            char: 't',
            description: 'The target to run the app on.',
            default: 'device',
            options: ['device', 'emulator'],
        }),

        timeout: Flags.integer({
            description:
                'By default, traffic is recorded until you manually end the collection. By providing this flag, you can set an explicit timeout (in seconds) after which the recording is stopped automatically. This is especially useful for automated analyses.',
            required: false,
        }),

        'multiple-collections': Flags.boolean({
            description:
                'By providing this flag, you can separate the recorded traffic into multiple named chunks. Each chunk is saved in a separate HAR file and you are interactively prompted to start, stop and name the chunks. This can for example be useful if you want to clearly differentiate between traffic from before interacting with a consent dialog and after.',
            required: false,
            exclusive: ['timeout'],
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
                'By default, only the traffic of the specified app is recorded on Android. Set this flag to record all traffic. On iOS, all system traffic is always recorded.',
            default: false,
        }),

        'uninstall-app': Flags.boolean({
            description: 'Whether to uninstall the app after the analysis.',
            default: false,
        }),

        'stop-app': Flags.boolean({
            description: 'Whether to stop the app after the analysis. Enabled by default.',
            default: true,
            allowNo: true,
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

        'ios-ip': Flags.string({
            description:
                'The IP address of the iOS device. If not specified, the connection will be forwarded via USB.',
            helpGroup: 'iOS',
        }),

        'ios-proxy-ip': Flags.string({
            description: 'The IP address of the host running the proxy to set up on the iOS device.',
            helpGroup: 'iOS',
        }),

        'ios-ssh-user': Flags.string({
            description: 'Which user to use when connecting to the iPhone via SSH. Make sure it can log in via SSH.',
            helpGroup: 'iOS',
            default: 'mobile',
            values: ['mobile', 'root'],
        }),

        'ios-ssh-pw': Flags.string({
            description: 'The password of the specified user on the iOS device.',
            helpGroup: 'iOS',
            default: 'alpine',
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
        '<app ID or app file(s)>': Args.string({
            description:
                "The app to analyze. Can either be the bundle ID of an app that is already installed on the device or the path to the app to analyze (.ipa on iOS, .apk on Android). You can specify multiple paths for split APKs on Android.\nWill prompt for an already installed app if not provided. If you don't specify an app path, you need to provide the --platform flag.",
            required: false,
        }),
    };

    async run() {
        const { argv, flags } = await this.parse(RecordTraffic);
        const providedApp = argv as string[];

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const useAppId = providedApp.length === 0 || (providedApp.length === 1 && !(await exists(providedApp[0]!)));
        if (useAppId && !flags.platform)
            throw new Error("You need to specify the --platform flag if you don't provide an app file.");

        const platform =
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            (flags.platform as 'ios' | 'android') ?? (providedApp[0]!.endsWith('.ipa') ? 'ios' : 'android');
        // If the platform is not specified explicitly, we unfortunately can't enforce this in the flags definition.
        if (platform === 'ios' && !flags['ios-proxy-ip'])
            throw new Error('You need to specify the --ios-proxy-ip flags for iOS.');

        await new Listr<ListrCtx>([
            {
                title: 'Setting up…',
                task: async (ctx, task) => {
                    if (flags['multiple-collections'])
                        ctx.currentTrafficCollectionName = await task.prompt({
                            type: 'input',
                            message: 'Enter a name for the first traffic collection:',
                            required: true,
                            initial: 'initial',
                        });

                    return task.newListr([
                        {
                            title: 'Starting analysis…',
                            task: async () => {
                                ctx.analysis = await startAnalysis({
                                    platform,
                                    runTarget: flags['run-target'] as 'emulator',
                                    capabilities: flags['bypass-certificate-pinning']
                                        ? ['certificate-pinning-bypass', 'frida']
                                        : [],
                                    targetOptions: {
                                        // Android
                                        startEmulatorOptions: {
                                            emulatorName: flags['emulator-name'],
                                            headless: flags['emulator-headless'],
                                            audio: !flags['emulator-no-audio'],
                                            ephemeral: flags['emulator-ephemeral'],
                                        },
                                        snapshotName: flags['emulator-snapshot-name'],

                                        // iOS
                                        username: flags['ios-ssh-user'],
                                        password: flags['ios-ssh-pw'],
                                        ip: flags['ios-ip'],
                                        proxyIp: flags['ios-proxy-ip'],
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    } as any,
                                });

                                ctx.appIdOrPath =
                                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                    providedApp.length === 1 ? providedApp[0]! : (providedApp as `${string}.apk`[]);
                            },
                        },
                        {
                            title: 'Checking tracking domain resolution…',
                            skip: () => flags['bypass-tracking-domain-resolution-check'],
                            task: () => ctx.analysis.ensureTrackingDomainResolution(),
                        },
                        {
                            title: 'Waiting for device…',
                            // If an emulator name is set, we start the emulator in `ensureDevice` and wait there.
                            // (fixed in https://github.com/tweaselORG/cli/pull/31)
                            enabled: () => !flags['emulator-name'],
                            task: async () => ctx.analysis.platform.waitForDevice(),
                        },
                        {
                            title: 'Checking device connection and setting up…',
                            task: () => ctx.analysis.ensureDevice(),
                        },
                        {
                            title: 'Resetting device…',
                            enabled: () => !!flags['emulator-snapshot-name'],
                            task: () => ctx.analysis.resetDevice(),
                        },
                        {
                            title: 'Listing apps on device…',
                            enabled: () => providedApp.length === 0,
                            task: async (_, task) => {
                                const installedApps = await ctx.analysis.platform.listApps();
                                if (installedApps.length === 0)
                                    throw new Error(
                                        'There are no apps installed on the device. Please install an app or specify an app file.'
                                    );
                                task.title = 'Waiting for app selection…';
                                ctx.appIdOrPath = await task.prompt({
                                    type: 'select',
                                    message: 'Select an app to analyze:',
                                    choices: installedApps,
                                    required: true,
                                });
                            },
                        },
                        {
                            title: 'Starting app analysis…',
                            task: async () => {
                                ctx.appAnalysis = await ctx.analysis.startAppAnalysis(ctx.appIdOrPath);
                            },
                        },
                    ]);
                },
            },
            {
                title: 'Installing app…',
                enabled: () => !useAppId,
                task: (ctx) => ctx.appAnalysis.installApp(),
            },
            {
                title: 'Granting permissions…',
                skip: () => !flags['grant-permissions'],
                task: (ctx) => ctx.appAnalysis.setAppPermissions(),
            },
            {
                title: 'Starting app and traffic collection…',
                task: async (ctx) => {
                    ctx.trafficCollectionOptions = flags['all-traffic']
                        ? undefined
                        : { mode: 'allowlist', apps: [ctx.appAnalysis.app.id] };

                    await ctx.analysis.startTrafficCollection(ctx.trafficCollectionOptions);
                    await ctx.appAnalysis.startApp();
                },
            },
            {
                title: `Collecting traffic for ${flags['timeout']} seconds…`,
                enabled: () => flags['timeout'] !== undefined,
                task: async (ctx) => {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    await pause(flags['timeout']! * 1000);

                    const traffic = await ctx.analysis.stopTrafficCollection();
                    await writeFile(flags.output || `${ctx.appAnalysis.app.id}.har`, JSON.stringify(traffic, null, 4));
                },
            },
            {
                title: 'Collecting traffic…',
                enabled: () => flags['timeout'] === undefined,
                task: async (ctx, task) => {
                    do {
                        await task.prompt({
                            message: 'Press enter to stop the traffic collection.',
                            required: false,
                            type: 'invisible',
                        });

                        const traffic = await ctx.analysis.stopTrafficCollection();
                        const outputSuffix = flags['multiple-collections']
                            ? `-${ctx.currentTrafficCollectionName}`
                            : '';
                        const output = flags.output
                            ? join(
                                  dirname(flags.output),
                                  `${basename(flags.output, extname(flags.output))}${outputSuffix}${extname(
                                      flags.output
                                  )}`
                              )
                            : `${ctx.appAnalysis.app.id}${outputSuffix}.har`;
                        await writeFile(output, JSON.stringify(traffic, null, 4));

                        if (!flags['multiple-collections']) break;
                        ctx.currentTrafficCollectionName = await task.prompt({
                            type: 'input',
                            message: 'Enter a name for the next traffic collection (leave empty to stop):',
                            required: false,
                        });
                        if (!ctx.currentTrafficCollectionName?.trim()) break;

                        await ctx.analysis.startTrafficCollection(ctx.trafficCollectionOptions);
                    } while (flags['multiple-collections']);
                },
            },
            {
                title: 'Stopping app…',
                enabled: () => flags['stop-app'],
                task: async (ctx) => ctx.appAnalysis.stopApp(),
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
