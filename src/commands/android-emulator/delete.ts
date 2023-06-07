import { Args, Command } from '@oclif/core';
import { runAndroidDevTool } from 'andromatic';

export default class AndroidEmulatorDelete extends Command {
    static override summary = 'Delete the specified emulator.';

    static override examples = [
        {
            description: 'Delete the emulator called `my-emulator`.',
            command: '<%= config.bin %> <%= command.id %> my-emulator',
        },
    ];

    static override args = {
        '<name>': Args.string({
            description: 'The name of the emulator to delete.',
            required: true,
        }),
    };

    async run() {
        const { args } = await this.parse(AndroidEmulatorDelete);

        await runAndroidDevTool('avdmanager', ['delete', 'avd', '--name', args['<name>']]);
    }
}
