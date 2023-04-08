#!/usr/bin/env ts-node

import oclif from '@oclif/core';
import path from 'node:path';
import url from 'node:url';
import { register } from 'ts-node';

// In dev mode -> use ts-node and dev plugins
// eslint-disable-next-line no-undef
process.env.NODE_ENV = 'development';

register({
    project: path.join(path.dirname(url.fileURLToPath(import.meta.url)), '..', 'tsconfig.json'),
});

// In dev mode, always show stack traces
oclif.settings.debug = true;

// Start the CLI
oclif
    // eslint-disable-next-line no-undef
    .run(process.argv.slice(2), import.meta.url)
    .then(oclif.flush)
    .catch(oclif.Errors.handle);
