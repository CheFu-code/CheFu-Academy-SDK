#!/usr/bin/env node

const { runOnboarding } = require('../bin/chefu-academy.cjs');

function shouldSkip() {
    return (
        process.env.CI === 'true' ||
        process.env.CHEFU_SDK_SKIP_AUTH === '1' ||
        process.env.CHEFU_SDK_SKIP_AUTH === 'true' ||
        !process.stdin.isTTY ||
        !process.stdout.isTTY
    );
}

async function main() {
    if (shouldSkip()) {
        console.log(
            'CheFu Academy SDK installed. Run "npx chefu-academy login" or "npx chefu-academy register" to set up an account.',
        );
        return;
    }

    await runOnboarding({ source: 'postinstall' });
}

main().catch((error) => {
    const message =
        typeof error.format === 'function' ? error.format() : error.message || error;

    console.warn('CheFu Academy SDK account setup could not finish.');
    console.warn(message);
    console.warn('Run "npx chefu-academy login" when you are ready.');
});
