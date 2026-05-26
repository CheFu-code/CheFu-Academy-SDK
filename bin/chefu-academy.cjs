#!/usr/bin/env node

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const readline = require('node:readline');
const readlinePromises = require('node:readline/promises');

const DEFAULT_BASE_URL = 'https://api.chefuinc.com/api';
const CONFIG_DIR = path.join(os.homedir(), '.chefu-academy');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

function getBaseUrl() {
    return (
        process.env.CHEFU_API_BASE_URL ||
        process.env.CHEFU_ACADEMY_API_URL ||
        DEFAULT_BASE_URL
    ).replace(/\/+$/, '');
}

function isLocalApiUrl() {
    try {
        const hostname = new URL(getBaseUrl()).hostname;
        return hostname === 'localhost' || hostname === '127.0.0.1';
    } catch {
        return false;
    }
}

function writeLine(message = '') {
    process.stdout.write(`${message}\n`);
}

class CheFuCliError extends Error {
    constructor(message, nextSteps = []) {
        super(message);
        this.name = 'CheFuCliError';
        this.nextSteps = nextSteps;
    }

    format() {
        if (!this.nextSteps.length) return this.message;

        return [
            this.message,
            '',
            'What you can do:',
            ...this.nextSteps.map((step) => `- ${step}`),
        ].join('\n');
    }
}

function createPrompt(input = process.stdin, output = process.stdout) {
    return readlinePromises.createInterface({ input, output });
}

async function ask(question, options = {}) {
    const rl = createPrompt(options.input, options.output);

    try {
        return (await rl.question(question)).trim();
    } finally {
        rl.close();
    }
}

async function askPassword(question, input = process.stdin, output = process.stdout) {
    if (!input.isTTY || typeof input.setRawMode !== 'function') {
        return ask(question, { input, output });
    }

    return new Promise((resolve, reject) => {
        let value = '';
        const previousRawMode = Boolean(input.isRaw);

        function cleanup() {
            input.off('keypress', onKeypress);
            input.setRawMode(previousRawMode);
            input.pause();
        }

        function finish() {
            cleanup();
            output.write('\n');
            resolve(value);
        }

        function cancel() {
            cleanup();
            output.write('\n');
            reject(new Error('Cancelled.'));
        }

        function onKeypress(character, key = {}) {
            if (key.ctrl && key.name === 'c') {
                cancel();
                return;
            }

            if (key.name === 'return' || key.name === 'enter') {
                finish();
                return;
            }

            if (key.name === 'backspace') {
                if (value.length > 0) {
                    value = value.slice(0, -1);
                    output.write('\b \b');
                }
                return;
            }

            if (!character || key.ctrl || key.meta) return;

            value += character;
            output.write('*');
        }

        output.write(question);
        readline.emitKeypressEvents(input);
        input.setRawMode(true);
        input.resume();
        input.on('keypress', onKeypress);
    });
}

async function request(pathname, body) {
    const url = `${getBaseUrl()}${pathname}`;
    let response;

    try {
        response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
    } catch {
        throw new CheFuCliError('Could not reach the CheFu Academy API.', [
            'Check your internet connection.',
            `Make sure the API URL is correct: ${getBaseUrl()}`,
            ...(isLocalApiUrl()
                ? ['Make sure your local CheFu Inc backend is running.']
                : ['Try again in a few minutes.']),
        ]);
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const message = Array.isArray(data.message)
            ? data.message.join(' ')
            : data.message || data.error || 'Request failed.';
        throw friendlyHttpError(pathname, response.status, message);
    }

    return data;
}

function friendlyHttpError(pathname, statusCode, serverMessage) {
    const isLogin = pathname.includes('/auth/login');
    const isRegister = pathname.includes('/auth/register');

    if (statusCode === 401 && isLogin) {
        return new CheFuCliError(
            'We could not sign you in. The email or password looks incorrect.',
            [
                'Check the email and password, then run "npx chefu-academy login" again.',
                'If you do not have an account yet, run "npx chefu-academy register".',
            ],
        );
    }

    if (statusCode === 409 && isRegister) {
        return new CheFuCliError('That email already has a CheFu Academy account.', [
            'Run "npx chefu-academy login" instead.',
            'Use a different email if you want to create a new account.',
        ]);
    }

    if (statusCode === 422) {
        return new CheFuCliError('Some account details need a quick fix.', [
            serverMessage,
            'Passwords must be at least 6 characters.',
            'Run the command again when you are ready.',
        ]);
    }

    if (statusCode === 429) {
        return new CheFuCliError('Too many attempts. Please wait a little before trying again.', [
            'Try again in a few minutes.',
        ]);
    }

    if (statusCode >= 500 && (isLogin || isRegister)) {
        return new CheFuCliError(
            'CheFu Academy account setup is temporarily unavailable.',
            [
                'Please try again in a few minutes.',
                ...(isLocalApiUrl()
                    ? [
                          'Make sure your local CheFu Inc backend is running.',
                          'Make sure the backend has Firebase auth configured.',
                      ]
                    : [
                          'If this keeps happening, contact CheFu support and mention that SDK login returned a server error.',
                      ]),
            ],
        );
    }

    if (statusCode === 404) {
        return new CheFuCliError('The CheFu Academy auth endpoint was not found.', [
            `Current API URL: ${getBaseUrl()}`,
            ...(isLocalApiUrl()
                ? ['Make sure your local CheFu Inc backend is running on that URL.']
                : ['Please update the SDK or try again later.']),
        ]);
    }

    return new CheFuCliError(serverMessage || 'CheFu Academy request failed.', [
        `Status code: ${statusCode}`,
        'Please try again.',
    ]);
}

function saveSession(session) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(
        CONFIG_FILE,
        JSON.stringify(
            {
                baseURL: getBaseUrl(),
                token: session.token,
                user: session.user,
                savedAt: new Date().toISOString(),
            },
            null,
            2,
        ),
        { mode: 0o600 },
    );
}

function readSession() {
    if (!fs.existsSync(CONFIG_FILE)) return null;

    try {
        return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } catch {
        return null;
    }
}

function deleteSession() {
    if (fs.existsSync(CONFIG_FILE)) {
        fs.unlinkSync(CONFIG_FILE);
    }
}

async function login() {
    const email = await ask('Email: ');
    const password = await askPassword('Password: ');
    const session = await request('/auth/login', { email, password });

    saveSession(session);
    writeLine(`Logged in as ${session.user?.email || email}.`);
}

async function register() {
    const fullname = await ask('Full name: ');
    const email = await ask('Email: ');
    const password = await askPassword('Password: ');
    const response = await request('/auth/register', {
        fullname,
        email,
        password,
    });

    writeLine(response.message || 'Registration successful.');
    writeLine('You can now log in.');
    await login();
}

async function runOnboarding({ source = 'cli' } = {}) {
    writeLine('CheFu Academy SDK');
    writeLine('Choose an account setup option:');
    writeLine('1. Login');
    writeLine('2. Register new account');
    writeLine('3. Skip');

    const choice = await ask('Select 1, 2, or 3: ');

    if (choice === '1') {
        await login();
        return;
    }

    if (choice === '2') {
        await register();
        return;
    }

    writeLine(
        source === 'postinstall'
            ? 'Skipped. Run "npx chefu-academy login" when you are ready.'
            : 'Skipped.',
    );
}

async function run(argv = process.argv.slice(2)) {
    const command = argv[0] || 'auth';

    if (command === 'auth' || command === 'setup') {
        await runOnboarding();
        return;
    }

    if (command === 'login') {
        await login();
        return;
    }

    if (command === 'register') {
        await register();
        return;
    }

    if (command === 'logout') {
        deleteSession();
        writeLine('Logged out.');
        return;
    }

    if (command === 'whoami') {
        const session = readSession();
        writeLine(session?.user?.email || 'Not logged in.');
        return;
    }

    writeLine('Usage: chefu-academy [auth|login|register|logout|whoami]');
}

if (require.main === module) {
    run().catch((error) => {
        console.error(
            typeof error.format === 'function'
                ? error.format()
                : error.message || error,
        );
        process.exitCode = 1;
    });
}

module.exports = {
    run,
    runOnboarding,
};
