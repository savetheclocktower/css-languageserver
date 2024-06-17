import { Connection, Disposable } from 'vscode-languageserver/node';
import { LanguageSettings } from 'vscode-css-languageservice';
import { RequestService } from './requests';
export interface Settings {
    css: LanguageSettings;
    less: LanguageSettings;
    scss: LanguageSettings;
}
export interface RuntimeEnvironment {
    readonly file?: RequestService;
    readonly http?: RequestService;
    readonly timer: {
        setImmediate(callback: (...args: any[]) => void, ...args: any[]): Disposable;
        setTimeout(callback: (...args: any[]) => void, ms: number, ...args: any[]): Disposable;
    };
}
export declare function startServer(connection: Connection, runtime: RuntimeEnvironment): void;
