import { Args, Command } from '@oclif/core';
import { runAndroidDevTool } from 'andromatic';

export default class AndroidEmulatorSnapshotDelete extends Command {
    static override summary = 'Delete the snapshot with the specified name for the currently running emulator.';

    static override examples = [
        {
            description: 'Delete the snapshot called `clean`.',
            command: '<%= config.bin %> <%= command.id %> clean',
        },
    ];

    static override args = {
        '<name>': Args.string({
            description: 'The name of the snapshot to delete.',
            required: true,
        }),
    };

    async run() {
        const { args } = await this.parse(AndroidEmulatorSnapshotDelete);

        await runAndroidDevTool('adb', ['emu', 'avd', 'snapshot', 'delete', args['<name>']]);
    }
}
