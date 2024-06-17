import { ResponseError, CancellationToken } from 'vscode-languageserver';
import { RuntimeEnvironment } from '../main';
export declare function formatError(message: string, err: any): string;
export declare function runSafeAsync<T>(runtime: RuntimeEnvironment, func: () => Thenable<T>, errorVal: T, errorMessage: string, token: CancellationToken): Thenable<T | ResponseError<any>>;
