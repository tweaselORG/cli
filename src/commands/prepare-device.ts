import { Command, Flags } from '@oclif/core';
import type { Analysis, SupportedCapability } from 'cyanoacrylate';
import { startAnalysis } from 'cyanoacrylate';
import { readFile } from 'fs/promises';
import { Listr } from 'listr2';
// import { z } from 'zod';

type ListrCtx = {
    analysis: Analysis<'android' | 'ios', 'emulator', SupportedCapability<'android'>[]>;
};

export default class PrepareDevice extends Command {
    static override summary = 'Prepare a device for use with Tweasel tools and optionally place honey data.';
    static override description = `The device or emulator will be configured for traffic collection using Tweasel tools and necessary dependencies will be installed on the device. This preparation would otherwise happen at the start of an analysis, so this command is especially useful when preparing emulator snapshots.

If you pass a JSON with honey data values in the following format (all properties are optional), they will be placed on the device:

{
    "deviceName": "Kim’s iPhone 3G",
    "clipboard": "honeypotdontcopy",
    "calendarEvents": [
        {
            "title": "Secret meeting",
            "startDate": "2024-01-01T12:00:00",
            "endDate": "2024-01-01T12:12:00"
        }
    ],
    "contacts": [
        {
            "firstName": "Kim",
            "lastName": "Doe",
            "email": "kim.doe@example.org",
            "phoneNumber": "0123456789",
        }
    ]
}
`;

    // TODO
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
            description: 'The platform of the device.',
            required: true,
            options: ['android', 'ios'],
        }),

        'run-target': Flags.string({
            char: 't',
            description:
                'The device type (physical device or emulator). Only needs to be provided if you want an emulator to be started automatically.',
            default: 'device',
            options: ['device', 'emulator'],
        }),

        'honey-data': Flags.string({
            description:
                'You can provide honey data values as JSON in the format described above (either inline or as a path to a JSON file) that will then be placed on the device.',
            parse: async (input) => {
                try {
                    return JSON.parse(input);
                } catch {
                    return JSON.parse(await readFile(input, 'utf-8'));
                }
            },
        }),

        'ios-ip': Flags.string({
            description:
                'The IP address of the iOS device. If not specified, the connection will be forwarded via USB.',
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
    };

    async run() {
        const { flags } = await this.parse(PrepareDevice);

        // const honeyData = z
        //     .object({
        //         deviceName: z.string().optional(),
        //         clipboard: z.string().optional(),
        //         calendarEvents: z
        //             .array(
        //                 z.object({
        //                     title: z.string(),
        //                     startDate: z.date(),
        //                     endDate: z.date(),
        //                 })
        //             )
        //             .optional(),
        //         contacts: z
        //             .array(
        //                 z.object({
        //                     firstName: z.string().optional(),
        //                     lastName: z.string(),
        //                     email: z.string().optional(),
        //                     phoneNumber: z.string().optional(),
        //                 })
        //             )
        //             .optional(),
        //     })
        //     .or(z.undefined())
        //     .parse(flags['honey-data']);

        await new Listr<ListrCtx>([
            {
                title: 'Setting up…',
                task: async (ctx) => {
                    ctx.analysis = await startAnalysis({
                        platform: flags.platform as 'android' | 'ios',
                        runTarget: flags['run-target'] as 'emulator',
                        capabilities: ['certificate-pinning-bypass', 'frida'],
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
                },
            },
            {
                title: 'Waiting for device…',
                // If an emulator name is set, we start the emulator in `ensureDevice` and wait there.
                // (fixed in https://github.com/tweaselORG/cli/pull/31)
                enabled: () => !flags['emulator-name'],
                task: async (ctx) => ctx.analysis.platform.waitForDevice(),
            },
            {
                title: 'Checking device connection and setting up…',
                task: (ctx) => ctx.analysis.ensureDevice(),
            },
            // {
            //     title: 'Setting device name…',
            //     enabled: () => !!honeyData?.deviceName,
            //     // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            //     task: (ctx) => ctx.analysis.platform.setDeviceName(honeyData!.deviceName!),
            // },
            // {
            //     title: 'Setting clipboard contents…',
            //     enabled: () => !!honeyData?.clipboard,
            //     // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            //     task: (ctx) => ctx.analysis.platform.setClipboard(honeyData!.clipboard!),
            // },
            // {
            //     title: 'Adding calendar events…',
            //     enabled: () => !!honeyData?.calendarEvents,
            //     task: async (ctx) => {
            //         // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            //         for (const event of honeyData!.calendarEvents!) await ctx.analysis.platform.addCalendarEvent(event);
            //     },
            // },
            // {
            //     title: 'Adding contacts…',
            //     enabled: () => !!honeyData?.contacts,
            //     task: async (ctx) => {
            //         // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            //         for (const contact of honeyData!.contacts!) await ctx.analysis.platform.addContact(contact);
            //     },
            // },
            {
                title: 'Cleaning up…',
                task: (ctx) => ctx.analysis.stop(),
            },
        ]).run();
    }
}
