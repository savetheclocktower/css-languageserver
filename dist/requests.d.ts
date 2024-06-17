import { RequestType, Connection } from 'vscode-languageserver';
import { RuntimeEnvironment } from './main';
export declare namespace FsContentRequest {
    const type: RequestType<{
        uri: string;
        encoding?: string;
    }, string, any>;
}
export declare namespace FsStatRequest {
    const type: RequestType<string, FileStat, any>;
}
export declare namespace FsReadDirRequest {
    const type: RequestType<string, [string, FileType][], any>;
}
export declare enum FileType {
    /**
     * The file type is unknown.
     */
    Unknown = 0,
    /**
     * A regular file.
     */
    File = 1,
    /**
     * A directory.
     */
    Directory = 2,
    /**
     * A symbolic link to a file.
     */
    SymbolicLink = 64
}
export interface FileStat {
    /**
     * The type of the file, e.g. is a regular file, a directory, or symbolic link
     * to a file.
     */
    type: FileType;
    /**
     * The creation timestamp in milliseconds elapsed since January 1, 1970 00:00:00 UTC.
     */
    ctime: number;
    /**
     * The modification timestamp in milliseconds elapsed since January 1, 1970 00:00:00 UTC.
     */
    mtime: number;
    /**
     * The size in bytes.
     */
    size: number;
}
export interface RequestService {
    getContent(uri: string, encoding?: string): Promise<string>;
    stat(uri: string): Promise<FileStat>;
    readDirectory(uri: string): Promise<[string, FileType][]>;
}
export declare function getRequestService(handledSchemas: string[], connection: Connection, runtime: RuntimeEnvironment): RequestService;
