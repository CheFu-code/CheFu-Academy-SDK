#!/usr/bin/env node

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const readline = require('node:readline');
const readlinePromises = require('node:readline/promises');

const DEFAULT_BASE_URL = 'https://api.chefuinc.com/api';
const CONFIG_DIR = path.join(os.homedir(), '.chefu-academy');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;
const COLOR_ENABLED =
    process.stdout.isTTY &&
    !process.env.NO_COLOR &&
    process.env.CHEFU_CLI_COLOR !== '0';

const styles = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
};

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

function color(text, ...tokens) {
    if (!COLOR_ENABLED) return String(text);

    return `${tokens.map((token) => styles[token] || '').join('')}${text}${styles.reset}`;
}

function stripAnsi(value) {
    return String(value).replace(/\x1b\[[0-9;]*m/g, '');
}

function visibleLength(value) {
    return stripAnsi(value).length;
}

function padVisible(value, width) {
    return `${value}${' '.repeat(Math.max(0, width - visibleLength(value)))}`;
}

function brandTitle(title = 'CheFu Academy SDK') {
    return color(title, 'bold', 'cyan');
}

function printHeader(title, subtitle) {
    writeLine('');
    writeLine(brandTitle(title));
    if (subtitle) writeLine(color(subtitle, 'dim'));
    writeLine(color('-'.repeat(Math.max(28, visibleLength(title))), 'gray'));
}

function printPanel(title, lines = []) {
    const normalized = lines.map((line) => String(line));
    const width = Math.max(
        visibleLength(title),
        ...normalized.map(visibleLength),
        24,
    );
    const border = `+-${'-'.repeat(width)}-+`;

    writeLine(color(border, 'cyan'));
    writeLine(`${color('|', 'cyan')} ${padVisible(color(title, 'bold'), width)} ${color('|', 'cyan')}`);
    if (normalized.length) {
        writeLine(color(`+-${'-'.repeat(width)}-+`, 'cyan'));
        normalized.forEach((line) => {
            writeLine(`${color('|', 'cyan')} ${padVisible(line, width)} ${color('|', 'cyan')}`);
        });
    }
    writeLine(color(border, 'cyan'));
}

function printSuccess(message, lines = []) {
    printPanel(color('Success', 'green'), [message, ...lines]);
}

function printWarning(message, lines = []) {
    printPanel(color('Notice', 'yellow'), [message, ...lines]);
}

function printTable(headers, rows) {
    const widths = headers.map((header, index) =>
        Math.max(
            visibleLength(header),
            ...rows.map((row) => visibleLength(row[index] || '')),
        ),
    );
    const divider = widths.map((width) => '-'.repeat(width)).join('-+-');

    writeLine(headers.map((header, index) => padVisible(color(header, 'bold', 'cyan'), widths[index])).join(' | '));
    writeLine(color(divider, 'gray'));
    rows.forEach((row) => {
        writeLine(row.map((cell, index) => padVisible(cell || '', widths[index])).join(' | '));
    });
}

function startSpinner(message) {
    if (!process.stderr.isTTY) {
        return {
            succeed() {},
            fail() {},
            stop() {},
        };
    }

    const frames = ['-', '\\', '|', '/'];
    let frameIndex = 0;
    const render = () => {
        readline.clearLine(process.stderr, 0);
        readline.cursorTo(process.stderr, 0);
        process.stderr.write(`${color(frames[frameIndex], 'cyan')} ${message}`);
        frameIndex = (frameIndex + 1) % frames.length;
    };
    const timer = setInterval(render, 80);
    render();

    function done(label, statusColor) {
        clearInterval(timer);
        readline.clearLine(process.stderr, 0);
        readline.cursorTo(process.stderr, 0);
        process.stderr.write(`${color(label, statusColor)} ${message}\n`);
    }

    return {
        succeed() {
            done('OK', 'green');
        },
        fail() {
            done('FAIL', 'red');
        },
        stop() {
            clearInterval(timer);
            readline.clearLine(process.stderr, 0);
            readline.cursorTo(process.stderr, 0);
        },
    };
}

function decodeJwtPayload(token) {
    if (!token || typeof token !== 'string') return null;

    const [, payload] = token.split('.');
    if (!payload) return null;

    try {
        const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalized.padEnd(
            normalized.length + ((4 - (normalized.length % 4)) % 4),
            '=',
        );
        return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
    } catch {
        return null;
    }
}

function isFirebaseIdToken(token) {
    const payload = decodeJwtPayload(token);
    return (
        typeof payload?.iss === 'string' &&
        payload.iss.startsWith('https://securetoken.google.com/') &&
        typeof payload?.aud === 'string'
    );
}

class CheFuCliError extends Error {
    constructor(message, nextSteps = [], statusCode) {
        super(message);
        this.name = 'CheFuCliError';
        this.nextSteps = nextSteps;
        this.statusCode = statusCode;
    }

    format() {
        if (!this.nextSteps.length) return color(this.message, 'red', 'bold');

        return [
            color(this.message, 'red', 'bold'),
            '',
            color('What you can do:', 'cyan', 'bold'),
            ...this.nextSteps.map((step) => `${color('-', 'cyan')} ${step}`),
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

async function askMenu(message, options, input = process.stdin, output = process.stdout) {
    if (!input.isTTY || !output.isTTY || typeof input.setRawMode !== 'function') {
        writeLine(color(message, 'bold', 'cyan'));
        options.forEach((option, index) => {
            writeLine(`${color(index + 1, 'cyan')}. ${option.label}`);
        });

        const choice = await ask(color(`Select 1-${options.length}: `, 'cyan'), { input, output });
        const selectedIndex = Number(choice) - 1;
        return options[selectedIndex]?.value ?? options[options.length - 1].value;
    }

    return new Promise((resolve, reject) => {
        let selectedIndex = 0;
        let rendered = false;
        const previousRawMode = Boolean(input.isRaw);

        function cleanup() {
            input.off('keypress', onKeypress);
            input.setRawMode(previousRawMode);
            input.pause();
            output.write('\x1B[?25h');
        }

        function render() {
            if (rendered) {
                readline.moveCursor(output, 0, -options.length);
            } else {
                writeLine(color(message, 'bold', 'cyan'));
                writeLine(color('Use Up/Down arrows and press Enter.', 'dim'));
                output.write('\x1B[?25l');
            }

            options.forEach((option, index) => {
                readline.clearLine(output, 0);
                readline.cursorTo(output, 0);
                const selected = index === selectedIndex;
                const marker = selected ? color('>', 'cyan', 'bold') : ' ';
                const label = selected
                    ? color(option.label, 'bold', 'cyan')
                    : color(option.label, 'dim');
                output.write(`${marker} ${label}\n`);
            });
            rendered = true;
        }

        function finish() {
            const selected = options[selectedIndex];
            cleanup();
            resolve(selected.value);
        }

        function cancel() {
            cleanup();
            output.write('\n');
            reject(new Error('Cancelled.'));
        }

        function move(direction) {
            selectedIndex =
                (selectedIndex + direction + options.length) % options.length;
            render();
        }

        function onKeypress(character, key = {}) {
            if (key.ctrl && key.name === 'c') {
                cancel();
                return;
            }

            if (key.name === 'up' || character === 'k') {
                move(-1);
                return;
            }

            if (key.name === 'down' || character === 'j') {
                move(1);
                return;
            }

            if (key.name === 'return' || key.name === 'enter') {
                finish();
                return;
            }

            const numericChoice = Number(character);
            if (
                Number.isInteger(numericChoice) &&
                numericChoice >= 1 &&
                numericChoice <= options.length
            ) {
                selectedIndex = numericChoice - 1;
                render();
                finish();
            }
        }

        readline.emitKeypressEvents(input);
        input.setRawMode(true);
        input.resume();
        input.on('keypress', onKeypress);
        render();
    });
}

async function request(pathname, body) {
    return apiRequest(pathname, {
        method: 'POST',
        body,
        friendly: true,
    });
}

async function apiRequest(pathname, options = {}) {
    const url = `${getBaseUrl()}${pathname}`;
    let response;
    const method = options.method || 'GET';
    const headers = {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    };

    try {
        response = await fetch(url, {
            method,
            headers,
            body: options.body ? JSON.stringify(options.body) : undefined,
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
        throw options.friendly
            ? friendlyHttpError(pathname, response.status, message)
            : new CheFuCliError(message, [
                  `Status code: ${response.status}`,
                  'Please try again.',
              ], response.status);
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
                'Check the email and password, then run "chefu-academy login" again.',
                'If you do not have an account yet, run "chefu-academy register".',
            ],
        );
    }

    if (statusCode === 401 && pathname.includes('/keys/')) {
        return new CheFuCliError(
            'Your CheFu Academy login session cannot manage API keys yet.',
            [
                'Run "chefu-academy logout", then run "chefu-academy login" again.',
                'If this keeps happening, the CheFu API needs the latest auth refresh deployment.',
            ],
            401,
        );
    }

    if (statusCode === 409 && isRegister) {
        return new CheFuCliError('That email already has a CheFu Academy account.', [
            'Run "chefu-academy login" instead.',
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
    const expiresInSeconds = Number(session.expiresIn || 0);
    const expiresAt = expiresInSeconds
        ? new Date(Date.now() + expiresInSeconds * 1000).toISOString()
        : session.expiresAt || null;

    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(
        CONFIG_FILE,
        JSON.stringify(
            {
                baseURL: getBaseUrl(),
                token: session.idToken || session.token,
                idToken: session.idToken || session.token,
                refreshToken: session.refreshToken || '',
                expiresAt,
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

function parseOption(argv, longName, shortName) {
    const longEquals = `--${longName}=`;
    const equalsValue = argv.find((item) => item.startsWith(longEquals));
    if (equalsValue) return equalsValue.slice(longEquals.length);

    const longIndex = argv.indexOf(`--${longName}`);
    if (longIndex >= 0) return argv[longIndex + 1];

    if (shortName) {
        const shortIndex = argv.indexOf(`-${shortName}`);
        if (shortIndex >= 0) return argv[shortIndex + 1];
    }

    return '';
}

function hasFlag(argv, longName, shortName) {
    return argv.includes(`--${longName}`) || Boolean(shortName && argv.includes(`-${shortName}`));
}

function sessionExpiresSoon(session) {
    const expiresAt = Date.parse(session?.expiresAt || '');
    if (!Number.isFinite(expiresAt)) return Boolean(session?.refreshToken);

    return expiresAt <= Date.now() + TOKEN_REFRESH_BUFFER_MS;
}

async function refreshSession(session) {
    if (!session?.refreshToken) {
        throw new CheFuCliError('Your CheFu Academy login session has expired.', [
            'Run "chefu-academy login" again.',
        ]);
    }

    const refreshed = await apiRequest('/auth/refresh', {
        method: 'POST',
        body: { refreshToken: session.refreshToken },
        friendly: true,
    });
    const nextSession = {
        ...session,
        ...refreshed,
        user: session.user,
    };

    saveSession(nextSession);
    return readSession();
}

async function requireSession() {
    let session = readSession();

    if (!session?.token && !session?.idToken) {
        throw new CheFuCliError('You are not logged in to CheFu Academy.', [
            'Run "chefu-academy login" first.',
        ]);
    }

    if (!isFirebaseIdToken(session.idToken || session.token)) {
        if (session.refreshToken) {
            session = await refreshSession(session);
        } else {
            throw new CheFuCliError(
                'Your saved CheFu Academy session is from an older login format.',
                [
                    'Run "chefu-academy logout".',
                    'Run "chefu-academy login" again after the latest backend is deployed.',
                ],
            );
        }
    }

    if (sessionExpiresSoon(session)) {
        session = await refreshSession(session);
    }

    return session;
}

async function authenticatedRequest(pathname, options = {}) {
    let session = await requireSession();

    try {
        return await apiRequest(pathname, {
            ...options,
            token: session.idToken || session.token,
        });
    } catch (error) {
        if (
            error instanceof CheFuCliError &&
            session.refreshToken &&
            error.statusCode === 401
        ) {
            session = await refreshSession(session);
            return apiRequest(pathname, {
                ...options,
                token: session.idToken || session.token,
            });
        }

        throw error;
    }
}

async function login() {
    printHeader('CheFu Academy Login', 'Sign in to manage developer API keys.');
    const email = await ask(color('Email: ', 'cyan'));
    const password = await askPassword(color('Password: ', 'cyan'));
    const spinner = startSpinner('Signing in');
    let session;

    try {
        session = await request('/auth/login', { email, password });
        spinner.succeed();
    } catch (error) {
        spinner.fail();
        throw error;
    }

    saveSession(session);
    printSuccess(`Logged in as ${session.user?.email || email}.`, [
        `API: ${getBaseUrl()}`,
    ]);
}

async function register() {
    printHeader('Create CheFu Academy Account', 'Register a developer account for SDK access.');
    const fullname = await ask(color('Full name: ', 'cyan'));
    const email = await ask(color('Email: ', 'cyan'));
    const password = await askPassword(color('Password: ', 'cyan'));
    const spinner = startSpinner('Creating account');
    let response;

    try {
        response = await request('/auth/register', {
            fullname,
            email,
            password,
        });
        spinner.succeed();
    } catch (error) {
        spinner.fail();
        throw error;
    }

    printSuccess(response.message || 'Registration successful.', [
        'You can now log in.',
    ]);
    await login();
}

async function createKey(argv = []) {
    printHeader('Create API Key', 'Generate a developer key for course and video queries.');
    const name =
        parseOption(argv, 'name', 'n') ||
        (process.stdin.isTTY ? await ask(color('Key name: ', 'cyan')) : 'CLI key');
    const spinner = startSpinner('Creating API key');
    let response;

    try {
        response = await authenticatedRequest('/keys/create', {
            method: 'POST',
            body: { name },
        });
        spinner.succeed();
    } catch (error) {
        spinner.fail();
        throw error;
    }

    printPanel(color('API key created', 'green'), [
        'Save this key now. It will not be shown again.',
        '',
        color('API key:', 'bold'),
        response.apiKey,
        '',
        `${color('Public ID:', 'bold')} ${response.publicId}`,
    ]);
}

async function listKeys() {
    printHeader('API Keys', 'Developer keys linked to your CheFu Academy account.');
    const spinner = startSpinner('Loading API keys');
    let keys;

    try {
        keys = await authenticatedRequest('/keys/list', {
            method: 'GET',
        });
        spinner.succeed();
    } catch (error) {
        spinner.fail();
        throw error;
    }

    if (!Array.isArray(keys) || keys.length === 0) {
        printWarning('No API keys found.', [
            'Create one with: chefu-academy keys create --name "Local development"',
        ]);
        return;
    }

    printTable(
        ['ID', 'Status', 'Name', 'Last used'],
        keys.map((key) => [
            color(key.id, 'cyan'),
            key.active ? color('active', 'green') : color('revoked', 'red'),
            key.name || 'Untitled key',
            key.lastUsedAt ? formatValue(key.lastUsedAt) : color('never', 'dim'),
        ]),
    );
}

async function revokeKey(keyId, argv = []) {
    if (!keyId) {
        throw new CheFuCliError('API key ID is required.', [
            'Run "chefu-academy keys list" to find the key ID.',
            'Then run "chefu-academy keys revoke <keyId>".',
        ]);
    }

    if (!hasFlag(argv, 'yes', 'y')) {
        const answer = await ask(
            color(`Revoke API key ${keyId}? Type "yes" to confirm: `, 'yellow'),
        );
        if (answer.toLowerCase() !== 'yes') {
            printWarning('Cancelled.');
            return;
        }
    }

    const spinner = startSpinner('Revoking API key');
    try {
        await authenticatedRequest('/keys/revoke', {
            method: 'POST',
            body: { keyId },
        });
        spinner.succeed();
    } catch (error) {
        spinner.fail();
        throw error;
    }
    printSuccess(`Revoked API key ${keyId}.`);
}

function formatValue(value) {
    if (!value || typeof value !== 'object') return String(value || '');
    if (typeof value.toDate === 'function') return value.toDate().toISOString();
    if (typeof value._seconds === 'number') {
        return new Date(value._seconds * 1000).toISOString();
    }
    return JSON.stringify(value);
}

async function runKeysCommand(argv = []) {
    const subcommand = argv[0] || 'list';

    if (subcommand === 'create') {
        await createKey(argv.slice(1));
        return;
    }

    if (subcommand === 'list') {
        await listKeys();
        return;
    }

    if (subcommand === 'revoke') {
        await revokeKey(argv[1], argv.slice(2));
        return;
    }

    writeLine('Usage: chefu-academy keys [create|list|revoke]');
}

async function runOnboarding({ source = 'cli' } = {}) {
    printHeader('CheFu Academy SDK', 'Build with courses, videos, and developer API keys.');
    const choice = await askMenu('Choose an account setup option:', [
        { label: 'Login', value: 'login' },
        { label: 'Register new account', value: 'register' },
        { label: 'Skip', value: 'skip' },
    ]);

    if (choice === 'login') {
        await login();
        return;
    }

    if (choice === 'register') {
        await register();
        return;
    }

    writeLine(
        source === 'postinstall'
            ? color('Skipped. Run "chefu-academy login" when you are ready.', 'dim')
            : color('Skipped.', 'dim'),
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
        printSuccess('Logged out.');
        return;
    }

    if (command === 'keys') {
        await runKeysCommand(argv.slice(1));
        return;
    }

    if (command === 'whoami') {
        const session = readSession();
        if (session?.user?.email) {
            printPanel('Current session', [
                `${color('User:', 'bold')} ${session.user.email}`,
                `${color('API:', 'bold')} ${session.baseURL || getBaseUrl()}`,
            ]);
        } else {
            printWarning('Not logged in.', [
                'Run: chefu-academy login',
            ]);
        }
        return;
    }

    printPanel('Usage', [
        'chefu-academy auth',
        'chefu-academy login',
        'chefu-academy register',
        'chefu-academy logout',
        'chefu-academy whoami',
        'chefu-academy keys create --name "Local development"',
        'chefu-academy keys list',
        'chefu-academy keys revoke <keyId>',
    ]);
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
