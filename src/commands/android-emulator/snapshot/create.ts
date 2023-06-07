import { Args, Command } from '@oclif/core';
import { runAndroidDevTool } from 'andromatic';

export default class AndroidEmulatorSnapshotCreate extends Command {
    static override summary = 'Create a snapshot for the currently running emulator.';

    static override examples = [
        {
            description: 'Create a snapshot called `clean`.',
            command: '<%= config.bin %> <%= command.id %> clean',
        },
    ];

    static override args = {
        '<name>': Args.string({
            description: 'The name of the snapshot to create.',
            required: true,
        }),
    };

    async run() {
        const { args } = await this.parse(AndroidEmulatorSnapshotCreate);

        await runAndroidDevTool('adb', ['emu', 'avd', 'snapshot', 'save', args['<name>']]);
    }
}
