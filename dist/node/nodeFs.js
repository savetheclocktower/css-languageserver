"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNodeFSRequestService = void 0;
const vscode_uri_1 = require("vscode-uri");
const fs = __importStar(require("fs"));
const vscode_css_languageservice_1 = require("vscode-css-languageservice");
function getNodeFSRequestService() {
    function ensureFileUri(location) {
        if (!location.startsWith('file://')) {
            throw new Error('fileRequestService can only handle file URLs');
        }
    }
    return {
        getContent(location, encoding) {
            ensureFileUri(location);
            return new Promise((c, e) => {
                const uri = vscode_uri_1.URI.parse(location);
                fs.readFile(uri.fsPath, encoding, (err, buf) => {
                    if (err) {
                        return e(err);
                    }
                    c(buf.toString());
                });
            });
        },
        stat(location) {
            ensureFileUri(location);
            return new Promise((c, e) => {
                const uri = vscode_uri_1.URI.parse(location);
                fs.stat(uri.fsPath, (err, stats) => {
                    if (err) {
                        if (err.code === 'ENOENT') {
                            return c({ type: vscode_css_languageservice_1.FileType.Unknown, ctime: -1, mtime: -1, size: -1 });
                        }
                        else {
                            return e(err);
                        }
                    }
                    let type = vscode_css_languageservice_1.FileType.Unknown;
                    if (stats.isFile()) {
                        type = vscode_css_languageservice_1.FileType.File;
                    }
                    else if (stats.isDirectory()) {
                        type = vscode_css_languageservice_1.FileType.Directory;
                    }
                    else if (stats.isSymbolicLink()) {
                        type = vscode_css_languageservice_1.FileType.SymbolicLink;
                    }
                    c({
                        type,
                        ctime: stats.ctime.getTime(),
                        mtime: stats.mtime.getTime(),
                        size: stats.size
                    });
                });
            });
        },
        readDirectory(location) {
            ensureFileUri(location);
            return new Promise((c, e) => {
                const path = vscode_uri_1.URI.parse(location).fsPath;
                fs.readdir(path, { withFileTypes: true }, (err, children) => {
                    if (err) {
                        return e(err);
                    }
                    c(children.map(stat => {
                        if (stat.isSymbolicLink()) {
                            return [stat.name, vscode_css_languageservice_1.FileType.SymbolicLink];
                        }
                        else if (stat.isDirectory()) {
                            return [stat.name, vscode_css_languageservice_1.FileType.Directory];
                        }
                        else if (stat.isFile()) {
                            return [stat.name, vscode_css_languageservice_1.FileType.File];
                        }
                        else {
                            return [stat.name, vscode_css_languageservice_1.FileType.Unknown];
                        }
                    }));
                });
            });
        }
    };
}
exports.getNodeFSRequestService = getNodeFSRequestService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZUZzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL25vZGUvbm9kZUZzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFHaEcsMkNBQXdDO0FBRXhDLHVDQUF5QjtBQUN6QiwyRUFBc0Q7QUFFdEQsU0FBZ0IsdUJBQXVCO0lBQ3RDLFNBQVMsYUFBYSxDQUFDLFFBQWdCO1FBQ3RDLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7WUFDckMsTUFBTSxJQUFJLEtBQUssQ0FBQyw4Q0FBOEMsQ0FBQyxDQUFDO1FBQ2pFLENBQUM7SUFDRixDQUFDO0lBQ0QsT0FBTztRQUNOLFVBQVUsQ0FBQyxRQUFnQixFQUFFLFFBQXlCO1lBQ3JELGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN4QixPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUMzQixNQUFNLEdBQUcsR0FBRyxnQkFBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDaEMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRTtvQkFDOUMsSUFBSSxHQUFHLEVBQUUsQ0FBQzt3QkFDVCxPQUFPLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDZixDQUFDO29CQUNELENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztnQkFFbkIsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFDRCxJQUFJLENBQUMsUUFBZ0I7WUFDcEIsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3hCLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxF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Q3RDLENBQUM7b0JBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDTCxDQUFDLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztLQUNELENBQUM7QUFDSCxDQUFDO0FBM0VELDBEQTJFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiAgQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLiBTZWUgTGljZW5zZS50eHQgaW4gdGhlIHByb2plY3Qgcm9vdCBmb3IgbGljZW5zZSBpbmZvcm1hdGlvbi5cbiAqLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5pbXBvcnQgeyBSZXF1ZXN0U2VydmljZSB9IGZyb20gJy4uL3JlcXVlc3RzJztcbmltcG9ydCB7IFVSSSBhcyBVcmkgfSBmcm9tICd2c2NvZGUtdXJpJztcblxuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHsgRmlsZVR5cGUgfSBmcm9tICd2c2NvZGUtY3NzLWxhbmd1YWdlc2VydmljZSc7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXROb2RlRlNSZXF1ZXN0U2VydmljZSgpOiBSZXF1ZXN0U2VydmljZSB7XG5cdGZ1bmN0aW9uIGVuc3VyZUZpbGVVcmkobG9jYXRpb246IHN0cmluZykge1xuXHRcdGlmICghbG9jYXRpb24uc3RhcnRzV2l0aCgnZmlsZTovLycpKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ2ZpbGVSZXF1ZXN0U2VydmljZSBjYW4gb25seSBoYW5kbGUgZmlsZSBVUkxzJyk7XG5cdFx0fVxuXHR9XG5cdHJldHVybiB7XG5cdFx0Z2V0Q29udGVudChsb2NhdGlvbjogc3RyaW5nLCBlbmNvZGluZz86IEJ1ZmZlckVuY29kaW5nKSB7XG5cdFx0XHRlbnN1cmVGaWxlVXJpKGxvY2F0aW9uKTtcblx0XHRcdHJldHVybiBuZXcgUHJvbWlzZSgoYywgZSkgPT4ge1xuXHRcdFx0XHRjb25zdCB1cmkgPSBVcmkucGFyc2UobG9jYXRpb24pO1xuXHRcdFx0XHRmcy5yZWFkRmlsZSh1cmkuZnNQYXRoLCBlbmNvZGluZywgKGVyciwgYnVmKSA9PiB7XG5cdFx0XHRcdFx0aWYgKGVycikge1xuXHRcdFx0XHRcdFx0cmV0dXJuIGUoZXJyKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0YyhidWYudG9TdHJpbmcoKSk7XG5cblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0XHR9LFxuXHRcdHN0YXQobG9jYXRpb246IHN0cmluZykge1xuXHRcdFx0ZW5zdXJlRmlsZVVyaShsb2NhdGlvbik7XG5cdFx0XHRyZXR1cm4gbmV3IFByb21pc2UoKGMsIGUpID0+IHtcblx0XHRcdFx0Y29uc3QgdXJpID0gVXJpLnBhcnNlKGxvY2F0aW9uKTtcblx0XHRcdFx0ZnMuc3RhdCh1cmkuZnNQYXRoLCAoZXJyLCBzdGF0cykgPT4ge1xuXHRcdFx0XHRcdGlmIChlcnIpIHtcblx0XHRcdFx0XHRcdGlmIChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIGMoeyB0eXBlOiBGaWxlVHlwZS5Vbmtub3duLCBjdGltZTogLTEsIG10aW1lOiAtMSwgc2l6ZTogLTEgfSk7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gZShlcnIpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGxldCB0eXBlID0gRmlsZVR5cGUuVW5rbm93bjtcblx0XHRcdFx0XHRpZiAoc3RhdHMuaXNGaWxlKCkpIHtcblx0XHRcdFx0XHRcdHR5cGUgPSBGaWxlVHlwZS5GaWxlO1xuXHRcdFx0XHRcdH0gZWxzZSBpZiAoc3RhdHMuaXNEaXJlY3RvcnkoKSkge1xuXHRcdFx0XHRcdFx0dHlwZSA9IEZpbGVUeXBlLkRpcmVjdG9yeTtcblx0XHRcdFx0XHR9IGVsc2UgaWYgKHN0YXRzLmlzU3ltYm9saWNMaW5rKCkpIHtcblx0XHRcdFx0XHRcdHR5cGUgPSBGaWxlVHlwZS5TeW1ib2xpY0xpbms7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Yyh7XG5cdFx0XHRcdFx0XHR0eXBlLFxuXHRcdFx0XHRcdFx0Y3RpbWU6IHN0YXRzLmN0aW1lLmdldFRpbWUoKSxcblx0XHRcdFx0XHRcdG10aW1lOiBzdGF0cy5tdGltZS5nZXRUaW1lKCksXG5cdFx0XHRcdFx0XHRzaXplOiBzdGF0cy5zaXplXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdFx0fSxcblx0XHRyZWFkRGlyZWN0b3J5KGxvY2F0aW9uOiBzdHJpbmcpIHtcblx0XHRcdGVuc3VyZUZpbGVVcmkobG9jYXRpb24pO1xuXHRcdFx0cmV0dXJuIG5ldyBQcm9taXNlKChjLCBlKSA9PiB7XG5cdFx0XHRcdGNvbnN0IHBhdGggPSBVcmkucGFyc2UobG9jYXRpb24pLmZzUGF0aDtcblxuXHRcdFx0XHRmcy5yZWFkZGlyKHBhdGgsIHsgd2l0aEZpbGVUeXBlczogdHJ1ZSB9LCAoZXJyLCBjaGlsZHJlbikgPT4ge1xuXHRcdFx0XHRcdGlmIChlcnIpIHtcblx0XHRcdFx0XHRcdHJldHVybiBlKGVycik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGMoY2hpbGRyZW4ubWFwKHN0YXQgPT4ge1xuXHRcdFx0XHRcdFx0aWYgKHN0YXQuaXNTeW1ib2xpY0xpbmsoKSkge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gW3N0YXQubmFtZSwgRmlsZVR5cGUuU3ltYm9saWNMaW5rXTtcblx0XHRcdFx0XHRcdH0gZWxzZSBpZiAoc3RhdC5pc0RpcmVjdG9yeSgpKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBbc3RhdC5uYW1lLCBGaWxlVHlwZS5EaXJlY3RvcnldO1xuXHRcdFx0XHRcdFx0fSBlbHNlIGlmIChzdGF0LmlzRmlsZSgpKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBbc3RhdC5uYW1lLCBGaWxlVHlwZS5GaWxlXTtcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBbc3RhdC5uYW1lLCBGaWxlVHlwZS5Vbmtub3duXTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9O1xufVxuIl19