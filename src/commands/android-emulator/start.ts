import { Args, Command } from '@oclif/core';
import { runAndroidDevTool } from 'andromatic';

export default class AndroidEmulatorStart extends Command {
    static override summary = 'Start the specified emulator.';

    static override examples = [
        {
            description: 'Start the emulator called `my-emulator`.',
            command: '<%= config.bin %> <%= command.id %> my-emulator',
        },
    ];

    static override args = {
        '<name>': Args.string({
            description: 'The name of the emulator to start.',
            required: true,
        }),
    };

    async run() {
        const { args } = await this.parse(AndroidEmulatorStart);

        await runAndroidDevTool('emulator', ['-avd', args['<name>']]);
    }
}
