#!/usr/bin/env node

import oclif from '@oclif/core';

oclif
    // eslint-disable-next-line no-undef
    .run(process.argv.slice(2), import.meta.url)
    .then(oclif.flush)
    .catch(oclif.Errors.handle);
