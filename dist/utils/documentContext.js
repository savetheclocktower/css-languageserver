"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDocumentContext = void 0;
const vscode_uri_1 = require("vscode-uri");
function getDocumentContext(documentUri, workspaceFolders) {
    function getRootFolder() {
        for (const folder of workspaceFolders) {
            let folderURI = folder.uri;
            if (!folderURI.endsWith('/')) {
                folderURI = folderURI + '/';
            }
            if (documentUri.startsWith(folderURI)) {
                return folderURI;
            }
        }
        return undefined;
    }
    return {
        resolveReference: (ref, base = documentUri) => {
            if (ref[0] === '/') { // resolve absolute path against the current workspace folder
                const folderUri = getRootFolder();
                if (folderUri) {
                    return folderUri + ref.substring(1);
                }
            }
            const baseUri = vscode_uri_1.URI.parse(base);
            const baseUriDir = baseUri.path.endsWith('/') ? baseUri : vscode_uri_1.Utils.dirname(baseUri);
            return vscode_uri_1.Utils.resolvePath(baseUriDir, ref).toString(true);
        },
    };
}
exports.getDocumentContext = getDocumentContext;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jdW1lbnRDb250ZXh0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL3V0aWxzL2RvY3VtZW50Q29udGV4dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztnR0FHZ0c7OztBQUloRywyQ0FBd0M7QUFFeEMsU0FBZ0Isa0JBQWtCLENBQUMsV0FBbUIsRUFBRSxnQkFBbUM7SUFDMUYsU0FBUyxhQUFhO1FBQ3JCLEtBQUssTUFBTSxNQUFNLElBQUksZ0JBQWdCLEVBQUUsQ0FBQztZQUN2QyxJQUFJLFNBQVMsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDO1lBQzNCLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQzlCLFNBQVMsR0FBRyxTQUFTLEdBQUcsR0FBRyxDQUFDO1lBQzdCLENBQUM7WUFDRCxJQUFJLFdBQVcsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztnQkFDdkMsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztRQUNGLENBQUM7UUFDRCxPQUFPLFNBQVMsQ0FBQztJQUNsQixDQUFDO0lBRUQsT0FBTztRQUNOLGdCQUFnQixFQUFFLENBQUMsR0FBVyxFQUFFLElBQUksR0FBRyxXQUFXLEVBQUUsRUFBRTtZQUNyRCxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQyxDQUFDLDZEQUE2RDtnQkFDbEYsTUFBTSxTQUFTLEdBQUcsYUFBYSxFQUFFLENBQUM7Z0JBQ2xDLElBQUksU0FBUyxFQUFFLENBQUM7b0JBQ2YsT0FBTyxTQUFTLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDckMsQ0FBQztZQUNGLENBQUM7WUFDRCxNQUFNLE9BQU8sR0FBRyxnQkFBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNoQyxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxrQkFBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNqRixPQUFPLGtCQUFLLENBQUMsV0FBVyxDQUFDLFVBQVUsRUFBRSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDMUQsQ0FBQztLQUNELENBQUM7QUFDSCxDQUFDO0FBM0JELGdEQTJCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiAgQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLiBTZWUgTGljZW5zZS50eHQgaW4gdGhlIHByb2plY3Qgcm9vdCBmb3IgbGljZW5zZSBpbmZvcm1hdGlvbi5cbiAqLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5pbXBvcnQgeyBEb2N1bWVudENvbnRleHQgfSBmcm9tICd2c2NvZGUtY3NzLWxhbmd1YWdlc2VydmljZSc7XG5pbXBvcnQgeyBXb3Jrc3BhY2VGb2xkZXIgfSBmcm9tICd2c2NvZGUtbGFuZ3VhZ2VzZXJ2ZXInO1xuaW1wb3J0IHsgVXRpbHMsIFVSSSB9IGZyb20gJ3ZzY29kZS11cmknO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RG9jdW1lbnRDb250ZXh0KGRvY3VtZW50VXJpOiBzdHJpbmcsIHdvcmtzcGFjZUZvbGRlcnM6IFdvcmtzcGFjZUZvbGRlcltdKTogRG9jdW1lbnRDb250ZXh0IHtcblx0ZnVuY3Rpb24gZ2V0Um9vdEZvbGRlcigpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuXHRcdGZvciAoY29uc3QgZm9sZGVyIG9mIHdvcmtzcGFjZUZvbGRlcnMpIHtcblx0XHRcdGxldCBmb2xkZXJVUkkgPSBmb2xkZXIudXJpO1xuXHRcdFx0aWYgKCFmb2xkZXJVUkkuZW5kc1dpdGgoJy8nKSkge1xuXHRcdFx0XHRmb2xkZXJVUkkgPSBmb2xkZXJVUkkgKyAnLyc7XG5cdFx0XHR9XG5cdFx0XHRpZiAoZG9jdW1lbnRVcmkuc3RhcnRzV2l0aChmb2xkZXJVUkkpKSB7XG5cdFx0XHRcdHJldHVybiBmb2xkZXJVUkk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdH1cblxuXHRyZXR1cm4ge1xuXHRcdHJlc29sdmVSZWZlcmVuY2U6IChyZWY6IHN0cmluZywgYmFzZSA9IGRvY3VtZW50VXJpKSA9PiB7XG5cdFx0XHRpZiAocmVmWzBdID09PSAnLycpIHsgLy8gcmVzb2x2ZSBhYnNvbHV0ZSBwYXRoIGFnYWluc3QgdGhlIGN1cnJlbnQgd29ya3NwYWNlIGZvbGRlclxuXHRcdFx0XHRjb25zdCBmb2xkZXJVcmkgPSBnZXRSb290Rm9sZGVyKCk7XG5cdFx0XHRcdGlmIChmb2xkZXJVcmkpIHtcblx0XHRcdFx0XHRyZXR1cm4gZm9sZGVyVXJpICsgcmVmLnN1YnN0cmluZygxKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0Y29uc3QgYmFzZVVyaSA9IFVSSS5wYXJzZShiYXNlKTtcblx0XHRcdGNvbnN0IGJhc2VVcmlEaXIgPSBiYXNlVXJpLnBhdGguZW5kc1dpdGgoJy8nKSA/IGJhc2VVcmkgOiBVdGlscy5kaXJuYW1lKGJhc2VVcmkpO1xuXHRcdFx0cmV0dXJuIFV0aWxzLnJlc29sdmVQYXRoKGJhc2VVcmlEaXIsIHJlZikudG9TdHJpbmcodHJ1ZSk7XG5cdFx0fSxcblx0fTtcbn1cbiJdfQ==