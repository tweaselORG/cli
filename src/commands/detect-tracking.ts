import { Args, Command, Flags, ux } from '@oclif/core';
import chalk from 'chalk';
import { readFile } from 'fs/promises';
import type { Har } from 'har-format';
import link from 'terminal-link';
import { process } from 'trackhar';

export default class DetectTracking extends Command {
    static override enableJsonFlag = true;

    static override summary = 'Detect tracking data transmissions from traffic in HAR format.';
    static override description = `By default, this will output a human-readable table of the detected tracking data for each requests. You can use various flags to adjust the way the tables are displayed. If you instead want a machine-readable output, use the --json flag.

To show requests not matched by any adapter, use the --no-hide-unmatched flag.`;

    static override examples = [
        {
            description:
                'Detect tracking data transmissions in `app.har` and display them in table form, hiding requests to unsupported endpoints.',
            command: '<%= config.bin %> <%= command.id %> app.har',
        },
        {
            description:
                'Detect tracking data transmissions in `app.har` and display them in table form, but show requests to unsupported endpoints.',
            command: '<%= config.bin %> <%= command.id %> app.har --no-hide-unmatched',
        },
        {
            description:
                'Detect tracking data transmissions in `app.har` and display them in table form with additional details.',
            command: '<%= config.bin %> <%= command.id %> app.har --extended',
        },
        {
            description: 'Detect tracking data transmissions in `app.har` and output them as JSON.',
            command: '<%= config.bin %> <%= command.id %> app.har --json',
        },
    ];

    static override flags = {
        'hide-unmatched': Flags.boolean({
            description: 'Hide requests that were not matched by any adapter.',
            allowNo: true,
            default: true,
        }),

        ...ux.table.flags(),
    };

    static override args = {
        '<har file>': Args.string({
            description: 'The path to the HAR file to analyze.',
            required: true,
        }),
    };

    async run() {
        const { args, flags } = await this.parse(DetectTracking);
        const harPath = args['<har file>'];

        const har = JSON.parse(await readFile(harPath, 'utf-8')) as Har;
        const data = await process(har);

        for (let i = 0; i < data.length; i++) {
            const requestTrackingData = data[i];
            const request = har.log.entries[i]?.request;

            if (!requestTrackingData && flags['hide-unmatched']) continue;

            this.log(`${chalk.bold(request?.method)} ${request?.url}`);

            if (!requestTrackingData) this.log(chalk.italic('unsupported endpoint'));
            else {
                const adapter = requestTrackingData[0]?.adapter;
                if (adapter)
                    this.log('was matched by adapter: ', link(adapter, `https://trackers.tweasel.org/t/${adapter}`));
                this.log('');
                ux.table(
                    requestTrackingData,
                    {
                        property: {},
                        context: {},
                        path: {},
                        value: {},
                        reasoning: { extended: true },
                    },
                    { ...flags }
                );
            }

            this.log('\n');
        }

        return data.filter((r) => !flags['hide-unmatched'] || r);
    }
}
