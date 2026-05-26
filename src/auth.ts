// CheFu-Academy-sdk/src/auth.ts


import { CheFuAcademyClient, CheFuAcademyError } from './client';
import validator from 'validator';

export interface LoginResponse {
    token: string;
    idToken?: string;
    refreshToken?: string;
    expiresIn?: string;
    customToken?: string;
    user: {
        id: string;
        email: string;
        fullname: string;
    };
}

export interface RegisterResponse {
    message: string;
    user: {
        id: string;
        email: string;
        fullname: string;
    };
}

export interface TerminalLoginOptions {
    email?: string;
    input?: NodeJS.ReadableStream;
    output?: NodeJS.WritableStream;
    maskPassword?: boolean;
}

type KeypressEvent = {
    name?: string;
    ctrl?: boolean;
    meta?: boolean;
};

type RawModeStream = NodeJS.ReadableStream & {
    isTTY?: boolean;
    isRaw?: boolean;
    setRawMode?: (mode: boolean) => void;
};

export class Auth {
    private client: CheFuAcademyClient;

    constructor(client: CheFuAcademyClient) {
        this.client = client;
    }

    /**
     * Login user
     */
    async login(email: string, password: string): Promise<LoginResponse> {
        // Enhanced input validation and sanitization
        if (!email || !password) {
            throw new CheFuAcademyError(
                'Email and password are required.',
                422,
            );
        }
        const trimmedEmail = validator.trim(email);
        if (!validator.isEmail(trimmedEmail)) {
            throw new CheFuAcademyError('Invalid email format.', 422);
        }
        if (typeof password !== 'string' || password.length < 6) {
            throw new CheFuAcademyError('Password must be at least 6 characters long.', 422);
        }
        // Never log or expose passwords
        try {
            const session = await this.client.post<LoginResponse>('/auth/login', {
                email: trimmedEmail,
                password,
            });
            this.client.setAuthToken(session.idToken || session.token);
            return session;
        } catch (error: any) {
            this.handleAuthError(error, 'login');
        }
    }

    /**
     * Prompt for credentials in a Node.js terminal, then log in.
     */
    async loginWithTerminal(
        options: TerminalLoginOptions = {},
    ): Promise<LoginResponse> {
        this.assertTerminalRuntime();

        const input = options.input ?? process.stdin;
        const output = options.output ?? process.stdout;
        const email =
            options.email ??
            (await this.promptVisible('Email: ', input, output));
        const password =
            options.maskPassword === false
                ? await this.promptVisible('Password: ', input, output)
                : await this.promptPassword('Password: ', input, output);

        return this.login(email, password);
    }

    /**
     * Alias for loginWithTerminal().
     */
    async loginFromTerminal(
        options: TerminalLoginOptions = {},
    ): Promise<LoginResponse> {
        return this.loginWithTerminal(options);
    }

    /**
     * Register user
     */
    async register(
        email: string,
        password: string,
        fullname: string,
    ): Promise<RegisterResponse> {
        // Enhanced input validation and sanitization
        if (!email) {
            throw new CheFuAcademyError(
                'Email is required.',
                422,
            );
        }
        if (!password) {
            throw new CheFuAcademyError(
                'Password is required.',
                422,
            );
        }
        if (!fullname) {
            throw new CheFuAcademyError(
                'Full name is required.',
                422,
            );
        }
        const sanitizedEmail = validator.trim(validator.escape(email));
        if (!validator.isEmail(sanitizedEmail)) {
            throw new CheFuAcademyError('Invalid email format.', 422);
        }
        if (typeof password !== 'string' || password.length < 6) {
            throw new CheFuAcademyError('Password must be at least 6 characters long.', 422);
        }
        const sanitizedFullname = validator.trim(fullname);
        if (sanitizedFullname.length < 2) {
            throw new CheFuAcademyError('Full name must be at least 2 characters long.', 422);
        }
        // Never log or expose passwords
        try {
            return await this.client.post<RegisterResponse>(
                '/auth/register',
                { email: sanitizedEmail, password, fullname: sanitizedFullname },
            );
        } catch (error: any) {
            this.handleAuthError(error, 'register');
        }
    }

    /**
     * Auth-specific error mapping
     */
    private handleAuthError(error: CheFuAcademyError, action: 'login' | 'register'): never {
        // Never leak sensitive error details
        if (error instanceof CheFuAcademyError) {
            switch (error.statusCode) {
                case 401:
                    throw new CheFuAcademyError(
                        'Invalid email or password.',
                        401,
                    );
                case 409:
                    throw new CheFuAcademyError(
                        'An account with this email already exists.',
                        409,
                    );
                case 422:
                    throw new CheFuAcademyError(
                        'Invalid input. Please check your details.',
                        422,
                    );
                case 429:
                    throw new CheFuAcademyError(
                        'Too many attempts. Please try again later.',
                        429,
                    );
                default:
                    throw new CheFuAcademyError(
                        `Failed to ${action}. Please try again.`,
                        error.statusCode,
                    );
            }
        }
        throw new CheFuAcademyError(
            `Unexpected error during ${action}.`,
        );
    }

    private assertTerminalRuntime() {
        if (
            typeof process === 'undefined' ||
            !process.stdin ||
            !process.stdout
        ) {
            throw new CheFuAcademyError(
                'Terminal login is only available in Node.js.',
                400,
            );
        }
    }

    private async promptVisible(
        prompt: string,
        input: NodeJS.ReadableStream,
        output: NodeJS.WritableStream,
    ) {
        const readline = await import('node:readline/promises');
        const rl = readline.createInterface({ input, output });

        try {
            return (await rl.question(prompt)).trim();
        } finally {
            rl.close();
        }
    }

    private async promptPassword(
        prompt: string,
        input: NodeJS.ReadableStream,
        output: NodeJS.WritableStream,
    ) {
        const rawInput = input as RawModeStream;
        const setRawMode = rawInput.setRawMode?.bind(rawInput);

        if (!rawInput.isTTY || !setRawMode) {
            return this.promptVisible(prompt, input, output);
        }

        const readline = await import('node:readline');

        return new Promise<string>((resolve, reject) => {
            let password = '';
            const previousRawMode = Boolean(rawInput.isRaw);

            const cleanup = () => {
                input.off('keypress', onKeypress);
                setRawMode(previousRawMode);
                input.pause();
            };

            const finish = () => {
                cleanup();
                output.write('\n');
                resolve(password);
            };

            const cancel = () => {
                cleanup();
                output.write('\n');
                reject(new CheFuAcademyError('Terminal login cancelled.', 499));
            };

            const onKeypress = (character: string, key: KeypressEvent = {}) => {
                if (key.ctrl && key.name === 'c') {
                    cancel();
                    return;
                }

                if (key.name === 'return' || key.name === 'enter') {
                    finish();
                    return;
                }

                if (key.name === 'backspace') {
                    if (password.length > 0) {
                        password = password.slice(0, -1);
                        output.write('\b \b');
                    }
                    return;
                }

                if (!character || key.ctrl || key.meta) return;

                password += character;
                output.write('*');
            };

            output.write(prompt);
            readline.emitKeypressEvents(input);
            setRawMode(true);
            input.resume();
            input.on('keypress', onKeypress);
        });
    }
}
