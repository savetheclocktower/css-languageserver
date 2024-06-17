"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRequestService = exports.FileType = exports.FsReadDirRequest = exports.FsStatRequest = exports.FsContentRequest = void 0;
const vscode_languageserver_1 = require("vscode-languageserver");
var FsContentRequest;
(function (FsContentRequest) {
    FsContentRequest.type = new vscode_languageserver_1.RequestType('fs/content');
})(FsContentRequest || (exports.FsContentRequest = FsContentRequest = {}));
var FsStatRequest;
(function (FsStatRequest) {
    FsStatRequest.type = new vscode_languageserver_1.RequestType('fs/stat');
})(FsStatRequest || (exports.FsStatRequest = FsStatRequest = {}));
var FsReadDirRequest;
(function (FsReadDirRequest) {
    FsReadDirRequest.type = new vscode_languageserver_1.RequestType('fs/readDir');
})(FsReadDirRequest || (exports.FsReadDirRequest = FsReadDirRequest = {}));
var FileType;
(function (FileType) {
    /**
     * The file type is unknown.
     */
    FileType[FileType["Unknown"] = 0] = "Unknown";
    /**
     * A regular file.
     */
    FileType[FileType["File"] = 1] = "File";
    /**
     * A directory.
     */
    FileType[FileType["Directory"] = 2] = "Directory";
    /**
     * A symbolic link to a file.
     */
    FileType[FileType["SymbolicLink"] = 64] = "SymbolicLink";
})(FileType || (exports.FileType = FileType = {}));
function getRequestService(handledSchemas, connection, runtime) {
    const builtInHandlers = {};
    for (const protocol of handledSchemas) {
        if (protocol === 'file') {
            builtInHandlers[protocol] = runtime.file;
        }
        else if (protocol === 'http' || protocol === 'https') {
            builtInHandlers[protocol] = runtime.http;
        }
    }
    return {
        stat(uri) {
            return __awaiter(this, void 0, void 0, function* () {
                const handler = builtInHandlers[getScheme(uri)];
                if (handler) {
                    return handler.stat(uri);
                }
                const res = yield connection.sendRequest(FsStatRequest.type, uri.toString());
                return res;
            });
        },
        readDirectory(uri) {
            const handler = builtInHandlers[getScheme(uri)];
            if (handler) {
                return handler.readDirectory(uri);
            }
            return connection.sendRequest(FsReadDirRequest.type, uri.toString());
        },
        getContent(uri, encoding) {
            const handler = builtInHandlers[getScheme(uri)];
            if (handler) {
                return handler.getContent(uri, encoding);
            }
            return connection.sendRequest(FsContentRequest.type, { uri: uri.toString(), encoding });
        }
    };
}
exports.getRequestService = getRequestService;
function getScheme(uri) {
    return uri.substr(0, uri.indexOf(':'));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxdWVzdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvcmVxdWVzdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7QUFFaEcsaUVBQWdFO0FBR2hFLElBQWlCLGdCQUFnQixDQUVoQztBQUZELFdBQWlCLGdCQUFnQjtJQUNuQixxQkFBSSxHQUFpRSxJQUFJLG1DQUFXLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDakgsQ0FBQyxFQUZnQixnQkFBZ0IsZ0NBQWhCLGdCQUFnQixRQUVoQztBQUNELElBQWlCLGFBQWEsQ0FFN0I7QUFGRCxXQUFpQixhQUFhO0lBQ2hCLGtCQUFJLEdBQXVDLElBQUksbUNBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNwRixDQUFDLEVBRmdCLGFBQWEsNkJBQWIsYUFBYSxRQUU3QjtBQUVELElBQWlCLGdCQUFnQixDQUVoQztBQUZELFdBQWlCLGdCQUFnQjtJQUNuQixxQkFBSSxHQUFtRCxJQUFJLG1DQUFXLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDbkcsQ0FBQyxFQUZnQixnQkFBZ0IsZ0NBQWhCLGdCQUFnQixRQUVoQztBQUVELElBQVksUUFpQlg7QUFqQkQsV0FBWSxRQUFRO0lBQ25COztPQUVHO0lBQ0gsNkNBQVcsQ0FBQTtJQUNYOztPQUVHO0lBQ0gsdUNBQVEsQ0FBQTtJQUNSOztPQUVHO0lBQ0gsaURBQWEsQ0FBQTtJQUNiOztPQUVHO0lBQ0gsd0RBQWlCLENBQUE7QUFDbEIsQ0FBQyxFQWpCVyxRQUFRLHdCQUFSLFFBQVEsUUFpQm5CO0FBNkJELFNBQWdCLGlCQUFpQixDQUFDLGNBQXdCLEVBQUUsVUFBc0IsRUFBRSxPQUEyQjtJQUM5RyxNQUFNLGVBQWUsR0FBdUQsRUFBRSxDQUFDO0lBQy9FLEtBQUssTUFBTSxRQUFRLElBQUksY0FBYyxFQUFFLENBQUM7UUFDdkMsSUFBSSxRQUFRLEtBQUssTUFBTSxFQUFFLENBQUM7WUFDekIsZUFBZSxDQUFDLFFBQVEsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUM7UUFDMUMsQ0FBQzthQUFNLElBQUksUUFBUSxLQUFLLE1BQU0sSUFBSSxRQUFRLEtBQUssT0FBTyxFQUFFLENBQUM7WUFDeEQsZUFBZSxDQUFDLFFBQVEsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUM7UUFDMUMsQ0FBQztJQUNGLENBQUM7SUFDRCxPQUFPO1FBQ0EsSUFBSSxDQUFDLEdBQVc7O2dCQUNyQixNQUFNLE9BQU8sR0FBRyxlQUFlLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hELElBQUksT0FBTyxFQUFFLENBQUM7b0JBQ2IsT0FBTyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUMxQixDQUFDO2dCQUNELE1BQU0sR0FBRyxHQUFHLE1BQU0sVUFBVSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO2dCQUM3RSxPQUFPLEdBQUcsQ0FBQztZQUNaLENBQUM7U0FBQTtRQUNELGFBQWEsQ0FBQyxHQUFXO1lBQ3hCLE1BQU0sT0FBTyxHQUFHLGVBQWUsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNoRCxJQUFJLE9BQU8sRUFBRSxDQUFDO2dCQUNiLE9BQU8sT0FBTyxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNuQyxDQUFDO1lBQ0QsT0FBTyxVQUFVLENBQUMsV0FBVyxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUN0RSxDQUFDO1FBQ0QsVUFBVSxDQUFDLEdBQVcsRUFBRSxRQUFpQjtZQUN4QyxNQUFNLE9BQU8sR0FBRyxlQUFlLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDaEQsSUFBSSxPQUFPLEVBQUUsQ0FBQztnQkFDYixPQUFPLE9BQU8sQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzFDLENBQUM7WUFDRCxPQUFPLFVBQVUsQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxRQUFRLEVBQUUsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ3pGLENBQUM7S0FDRCxDQUFDO0FBQ0gsQ0FBQztBQWpDRCw4Q0FpQ0M7QUFFRCxTQUFTLFNBQVMsQ0FBQyxHQUFXO0lBQzdCLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ3hDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICogIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS4gU2VlIExpY2Vuc2UudHh0IGluIHRoZSBwcm9qZWN0IHJvb3QgZm9yIGxpY2Vuc2UgaW5mb3JtYXRpb24uXG4gKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuaW1wb3J0IHsgUmVxdWVzdFR5cGUsIENvbm5lY3Rpb24gfSBmcm9tICd2c2NvZGUtbGFuZ3VhZ2VzZXJ2ZXInO1xuaW1wb3J0IHsgUnVudGltZUVudmlyb25tZW50IH0gZnJvbSAnLi9tYWluJztcblxuZXhwb3J0IG5hbWVzcGFjZSBGc0NvbnRlbnRSZXF1ZXN0IHtcblx0ZXhwb3J0IGNvbnN0IHR5cGU6IFJlcXVlc3RUeXBlPHsgdXJpOiBzdHJpbmc7IGVuY29kaW5nPzogc3RyaW5nIH0sIHN0cmluZywgYW55PiA9IG5ldyBSZXF1ZXN0VHlwZSgnZnMvY29udGVudCcpO1xufVxuZXhwb3J0IG5hbWVzcGFjZSBGc1N0YXRSZXF1ZXN0IHtcblx0ZXhwb3J0IGNvbnN0IHR5cGU6IFJlcXVlc3RUeXBlPHN0cmluZywgRmlsZVN0YXQsIGFueT4gPSBuZXcgUmVxdWVzdFR5cGUoJ2ZzL3N0YXQnKTtcbn1cblxuZXhwb3J0IG5hbWVzcGFjZSBGc1JlYWREaXJSZXF1ZXN0IHtcblx0ZXhwb3J0IGNvbnN0IHR5cGU6IFJlcXVlc3RUeXBlPHN0cmluZywgW3N0cmluZywgRmlsZVR5cGVdW10sIGFueT4gPSBuZXcgUmVxdWVzdFR5cGUoJ2ZzL3JlYWREaXInKTtcbn1cblxuZXhwb3J0IGVudW0gRmlsZVR5cGUge1xuXHQvKipcblx0ICogVGhlIGZpbGUgdHlwZSBpcyB1bmtub3duLlxuXHQgKi9cblx0VW5rbm93biA9IDAsXG5cdC8qKlxuXHQgKiBBIHJlZ3VsYXIgZmlsZS5cblx0ICovXG5cdEZpbGUgPSAxLFxuXHQvKipcblx0ICogQSBkaXJlY3RvcnkuXG5cdCAqL1xuXHREaXJlY3RvcnkgPSAyLFxuXHQvKipcblx0ICogQSBzeW1ib2xpYyBsaW5rIHRvIGEgZmlsZS5cblx0ICovXG5cdFN5bWJvbGljTGluayA9IDY0XG59XG5leHBvcnQgaW50ZXJmYWNlIEZpbGVTdGF0IHtcblx0LyoqXG5cdCAqIFRoZSB0eXBlIG9mIHRoZSBmaWxlLCBlLmcuIGlzIGEgcmVndWxhciBmaWxlLCBhIGRpcmVjdG9yeSwgb3Igc3ltYm9saWMgbGlua1xuXHQgKiB0byBhIGZpbGUuXG5cdCAqL1xuXHR0eXBlOiBGaWxlVHlwZTtcblx0LyoqXG5cdCAqIFRoZSBjcmVhdGlvbiB0aW1lc3RhbXAgaW4gbWlsbGlzZWNvbmRzIGVsYXBzZWQgc2luY2UgSmFudWFyeSAxLCAxOTcwIDAwOjAwOjAwIFVUQy5cblx0ICovXG5cdGN0aW1lOiBudW1iZXI7XG5cdC8qKlxuXHQgKiBUaGUgbW9kaWZpY2F0aW9uIHRpbWVzdGFtcCBpbiBtaWxsaXNlY29uZHMgZWxhcHNlZCBzaW5jZSBKYW51YXJ5IDEsIDE5NzAgMDA6MDA6MDAgVVRDLlxuXHQgKi9cblx0bXRpbWU6IG51bWJlcjtcblx0LyoqXG5cdCAqIFRoZSBzaXplIGluIGJ5dGVzLlxuXHQgKi9cblx0c2l6ZTogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJlcXVlc3RTZXJ2aWNlIHtcblx0Z2V0Q29udGVudCh1cmk6IHN0cmluZywgZW5jb2Rpbmc/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz47XG5cblx0c3RhdCh1cmk6IHN0cmluZyk6IFByb21pc2U8RmlsZVN0YXQ+O1xuXHRyZWFkRGlyZWN0b3J5KHVyaTogc3RyaW5nKTogUHJvbWlzZTxbc3RyaW5nLCBGaWxlVHlwZV1bXT47XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFJlcXVlc3RTZXJ2aWNlKGhhbmRsZWRTY2hlbWFzOiBzdHJpbmdbXSwgY29ubmVjdGlvbjogQ29ubmVjdGlvbiwgcnVudGltZTogUnVudGltZUVudmlyb25tZW50KTogUmVxdWVzdFNlcnZpY2Uge1xuXHRjb25zdCBidWlsdEluSGFuZGxlcnM6IHsgW3Byb3RvY29sOiBzdHJpbmddOiBSZXF1ZXN0U2VydmljZSB8IHVuZGVmaW5lZCB9ID0ge307XG5cdGZvciAoY29uc3QgcHJvdG9jb2wgb2YgaGFuZGxlZFNjaGVtYXMpIHtcblx0XHRpZiAocHJvdG9jb2wgPT09ICdmaWxlJykge1xuXHRcdFx0YnVpbHRJbkhhbmRsZXJzW3Byb3RvY29sXSA9IHJ1bnRpbWUuZmlsZTtcblx0XHR9IGVsc2UgaWYgKHByb3RvY29sID09PSAnaHR0cCcgfHwgcHJvdG9jb2wgPT09ICdodHRwcycpIHtcblx0XHRcdGJ1aWx0SW5IYW5kbGVyc1twcm90b2NvbF0gPSBydW50aW1lLmh0dHA7XG5cdFx0fVxuXHR9XG5cdHJldHVybiB7XG5cdFx0YXN5bmMgc3RhdCh1cmk6IHN0cmluZyk6IFByb21pc2U8RmlsZVN0YXQ+IHtcblx0XHRcdGNvbnN0IGhhbmRsZXIgPSBidWlsdEluSGFuZGxlcnNbZ2V0U2NoZW1lKHVyaSldO1xuXHRcdFx0aWYgKGhhbmRsZXIpIHtcblx0XHRcdFx0cmV0dXJuIGhhbmRsZXIuc3RhdCh1cmkpO1xuXHRcdFx0fVxuXHRcdFx0Y29uc3QgcmVzID0gYXdhaXQgY29ubmVjdGlvbi5zZW5kUmVxdWVzdChGc1N0YXRSZXF1ZXN0LnR5cGUsIHVyaS50b1N0cmluZygpKTtcblx0XHRcdHJldHVybiByZXM7XG5cdFx0fSxcblx0XHRyZWFkRGlyZWN0b3J5KHVyaTogc3RyaW5nKTogUHJvbWlzZTxbc3RyaW5nLCBGaWxlVHlwZV1bXT4ge1xuXHRcdFx0Y29uc3QgaGFuZGxlciA9IGJ1aWx0SW5IYW5kbGVyc1tnZXRTY2hlbWUodXJpKV07XG5cdFx0XHRpZiAoaGFuZGxlcikge1xuXHRcdFx0XHRyZXR1cm4gaGFuZGxlci5yZWFkRGlyZWN0b3J5KHVyaSk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gY29ubmVjdGlvbi5zZW5kUmVxdWVzdChGc1JlYWREaXJSZXF1ZXN0LnR5cGUsIHVyaS50b1N0cmluZygpKTtcblx0XHR9LFxuXHRcdGdldENvbnRlbnQodXJpOiBzdHJpbmcsIGVuY29kaW5nPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcblx0XHRcdGNvbnN0IGhhbmRsZXIgPSBidWlsdEluSGFuZGxlcnNbZ2V0U2NoZW1lKHVyaSldO1xuXHRcdFx0aWYgKGhhbmRsZXIpIHtcblx0XHRcdFx0cmV0dXJuIGhhbmRsZXIuZ2V0Q29udGVudCh1cmksIGVuY29kaW5nKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBjb25uZWN0aW9uLnNlbmRSZXF1ZXN0KEZzQ29udGVudFJlcXVlc3QudHlwZSwgeyB1cmk6IHVyaS50b1N0cmluZygpLCBlbmNvZGluZyB9KTtcblx0XHR9XG5cdH07XG59XG5cbmZ1bmN0aW9uIGdldFNjaGVtZSh1cmk6IHN0cmluZykge1xuXHRyZXR1cm4gdXJpLnN1YnN0cigwLCB1cmkuaW5kZXhPZignOicpKTtcbn1cbiJdfQ==