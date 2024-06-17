"use strict";
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
exports.startServer = void 0;
const node_1 = require("vscode-languageserver/node");
const vscode_uri_1 = require("vscode-uri");
const vscode_css_languageservice_1 = require("vscode-css-languageservice");
const validation_1 = require("./utils/validation");
const runner_1 = require("./utils/runner");
const languageModelCache_1 = require("./languageModelCache");
const customData_1 = require("./customData");
const requests_1 = require("./requests");
const documentContext_1 = require("./utils/documentContext");
// `TextDocument` is an instance of the `vscode-languageserver-textdocument` class.
// Here we're keeping track of a whole set via some sort of enhanced map.
// This probably represents all open documents, but perhaps even all possible
// documents in the project.
const documents = new node_1.TextDocuments(vscode_css_languageservice_1.TextDocument);
var CustomDataChangedNotification;
(function (CustomDataChangedNotification) {
    CustomDataChangedNotification.type = new node_1.NotificationType('css/customDataChanged');
})(CustomDataChangedNotification || (CustomDataChangedNotification = {}));
function startServer(connection, runtime) {
    // Create a text document manager.
    const documents = new node_1.TextDocuments(vscode_css_languageservice_1.TextDocument);
    // Make the text document manager listen on the connection
    // for open, change and close text document events
    documents.listen(connection);
    const stylesheets = (0, languageModelCache_1.getLanguageModelCache)(10, 60, document => getLanguageService(document).parseStylesheet(document));
    documents.onDidClose(e => {
        stylesheets.onDocumentRemoved(e.document);
    });
    connection.onShutdown(() => {
        stylesheets.dispose();
    });
    let scopedSettingsSupport = false;
    let foldingRangeLimit = Number.MAX_VALUE;
    let workspaceFolders;
    let formatterMaxNumberOfEdits = Number.MAX_VALUE;
    let dataProvidersReady = Promise.resolve();
    let diagnosticsSupport;
    const languageServices = {};
    const notReady = () => Promise.reject('Not Ready');
    let requestService = { getContent: notReady, stat: notReady, readDirectory: notReady };
    // After the server has started the client sends an initialize request. The server receives
    // in the passed params the rootPath of the workspace plus the client capabilities.
    connection.onInitialize((params) => {
        var _a, _b;
        const initializationOptions = params.initializationOptions || {};
        workspaceFolders = params.workspaceFolders;
        if (!Array.isArray(workspaceFolders)) {
            workspaceFolders = [];
            if (params.rootPath) {
                workspaceFolders.push({ name: '', uri: vscode_uri_1.URI.file(params.rootPath).toString(true) });
            }
        }
        requestService = (0, requests_1.getRequestService)((initializationOptions === null || initializationOptions === void 0 ? void 0 : initializationOptions.handledSchemas) || ['file'], connection, runtime);
        function getClientCapability(name, def) {
            const keys = name.split('.');
            let c = params.capabilities;
            for (let i = 0; c && i < keys.length; i++) {
                if (!c.hasOwnProperty(keys[i])) {
                    return def;
                }
                c = c[keys[i]];
            }
            return c;
        }
        const snippetSupport = !!getClientCapability('textDocument.completion.completionItem.snippetSupport', false);
        scopedSettingsSupport = !!getClientCapability('workspace.configuration', false);
        foldingRangeLimit = getClientCapability('textDocument.foldingRange.rangeLimit', Number.MAX_VALUE);
        formatterMaxNumberOfEdits = ((_b = (_a = initializationOptions === null || initializationOptions === void 0 ? void 0 : initializationOptions.customCapabilities) === null || _a === void 0 ? void 0 : _a.rangeFormatting) === null || _b === void 0 ? void 0 : _b.editLimit) || Number.MAX_VALUE;
        languageServices.css = (0, vscode_css_languageservice_1.getCSSLanguageService)({ fileSystemProvider: requestService, clientCapabilities: params.capabilities });
        languageServices.scss = (0, vscode_css_languageservice_1.getSCSSLanguageService)({ fileSystemProvider: requestService, clientCapabilities: params.capabilities });
        languageServices.less = (0, vscode_css_languageservice_1.getLESSLanguageService)({ fileSystemProvider: requestService, clientCapabilities: params.capabilities });
        const supportsDiagnosticPull = getClientCapability('textDocument.diagnostic', undefined);
        if (supportsDiagnosticPull === undefined) {
            diagnosticsSupport = (0, validation_1.registerDiagnosticsPushSupport)(documents, connection, runtime, validateTextDocument);
        }
        else {
            diagnosticsSupport = (0, validation_1.registerDiagnosticsPullSupport)(documents, connection, runtime, validateTextDocument);
        }
        const capabilities = {
            textDocumentSync: node_1.TextDocumentSyncKind.Incremental,
            completionProvider: snippetSupport ? { resolveProvider: false, triggerCharacters: ['/', '-', ':'] } : undefined,
            hoverProvider: true,
            documentSymbolProvider: true,
            referencesProvider: true,
            definitionProvider: true,
            documentHighlightProvider: true,
            documentLinkProvider: {
                resolveProvider: false
            },
            codeActionProvider: true,
            renameProvider: true,
            colorProvider: {},
            foldingRangeProvider: true,
            selectionRangeProvider: true,
            diagnosticProvider: {
                documentSelector: null,
                interFileDependencies: false,
                workspaceDiagnostics: false
            },
            documentRangeFormattingProvider: (initializationOptions === null || initializationOptions === void 0 ? void 0 : initializationOptions.provideFormatter) === true,
            documentFormattingProvider: (initializationOptions === null || initializationOptions === void 0 ? void 0 : initializationOptions.provideFormatter) === true,
        };
        return { capabilities };
    });
    function getLanguageService(document) {
        let service = languageServices[document.languageId];
        if (!service) {
            connection.console.log('Document type is ' + document.languageId + ', using css instead.');
            service = languageServices['css'];
        }
        return service;
    }
    let documentSettings = {};
    // remove document settings on close
    documents.onDidClose(e => {
        delete documentSettings[e.document.uri];
    });
    function getDocumentSettings(textDocument) {
        if (scopedSettingsSupport) {
            let promise = documentSettings[textDocument.uri];
            if (!promise) {
                const configRequestParam = { items: [{ scopeUri: textDocument.uri, section: textDocument.languageId }] };
                promise = connection.sendRequest(node_1.ConfigurationRequest.type, configRequestParam).then(s => s[0]);
                documentSettings[textDocument.uri] = promise;
            }
            return promise;
        }
        return Promise.resolve(undefined);
    }
    // The settings have changed. Is send on server activation as well.
    connection.onDidChangeConfiguration(change => {
        updateConfiguration(change.settings);
    });
    function updateConfiguration(settings) {
        for (const languageId in languageServices) {
            languageServices[languageId].configure(settings[languageId]);
        }
        // reset all document settings
        documentSettings = {};
        diagnosticsSupport === null || diagnosticsSupport === void 0 ? void 0 : diagnosticsSupport.requestRefresh();
    }
    function validateTextDocument(textDocument) {
        return __awaiter(this, void 0, void 0, function* () {
            const settingsPromise = getDocumentSettings(textDocument);
            const [settings] = yield Promise.all([settingsPromise, dataProvidersReady]);
            const stylesheet = stylesheets.get(textDocument);
            return getLanguageService(textDocument).doValidation(textDocument, stylesheet, settings);
        });
    }
    function updateDataProviders(dataPaths) {
        dataProvidersReady = (0, customData_1.fetchDataProviders)(dataPaths, requestService).then(customDataProviders => {
            for (const lang in languageServices) {
                languageServices[lang].setDataProviders(true, customDataProviders);
            }
        });
    }
    connection.onCompletion((textDocumentPosition, token) => {
        return (0, runner_1.runSafeAsync)(runtime, () => __awaiter(this, void 0, void 0, function* () {
            const document = documents.get(textDocumentPosition.textDocument.uri);
            if (document) {
                const [settings,] = yield Promise.all([getDocumentSettings(document), dataProvidersReady]);
                const styleSheet = stylesheets.get(document);
                const documentContext = (0, documentContext_1.getDocumentContext)(document.uri, workspaceFolders);
                return getLanguageService(document).doComplete2(document, textDocumentPosition.position, styleSheet, documentContext, settings === null || settings === void 0 ? void 0 : settings.completion);
            }
            return null;
        }), null, `Error while computing completions for ${textDocumentPosition.textDocument.uri}`, token);
    });
    connection.onHover((textDocumentPosition, token) => {
        return (0, runner_1.runSafeAsync)(runtime, () => __awaiter(this, void 0, void 0, function* () {
            const document = documents.get(textDocumentPosition.textDocument.uri);
            if (document) {
                const [settings,] = yield Promise.all([getDocumentSettings(document), dataProvidersReady]);
                const styleSheet = stylesheets.get(document);
                return getLanguageService(document).doHover(document, textDocumentPosition.position, styleSheet, settings === null || settings === void 0 ? void 0 : settings.hover);
            }
            return null;
        }), null, `Error while computing hover for ${textDocumentPosition.textDocument.uri}`, token);
    });
    connection.onDocumentSymbol((documentSymbolParams, token) => {
        return (0, runner_1.runSafeAsync)(runtime, () => __awaiter(this, void 0, void 0, function* () {
            const document = documents.get(documentSymbolParams.textDocument.uri);
            if (document) {
                yield dataProvidersReady;
                const stylesheet = stylesheets.get(document);
                return getLanguageService(document).findDocumentSymbols2(document, stylesheet);
            }
            return [];
        }), [], `Error while computing document symbols for ${documentSymbolParams.textDocument.uri}`, token);
    });
    connection.onDefinition((documentDefinitionParams, token) => {
        return (0, runner_1.runSafeAsync)(runtime, () => __awaiter(this, void 0, void 0, function* () {
            const document = documents.get(documentDefinitionParams.textDocument.uri);
            if (document) {
                yield dataProvidersReady;
                const stylesheet = stylesheets.get(document);
                return getLanguageService(document).findDefinition(document, documentDefinitionParams.position, stylesheet);
            }
            return null;
        }), null, `Error while computing definitions for ${documentDefinitionParams.textDocument.uri}`, token);
    });
    connection.onDocumentHighlight((documentHighlightParams, token) => {
        return (0, runner_1.runSafeAsync)(runtime, () => __awaiter(this, void 0, void 0, function* () {
            const document = documents.get(documentHighlightParams.textDocument.uri);
            if (document) {
                yield dataProvidersReady;
                const stylesheet = stylesheets.get(document);
                return getLanguageService(document).findDocumentHighlights(document, documentHighlightParams.position, stylesheet);
            }
            return [];
        }), [], `Error while computing document highlights for ${documentHighlightParams.textDocument.uri}`, token);
    });
    connection.onDocumentLinks((documentLinkParams, token) => __awaiter(this, void 0, void 0, function* () {
        return (0, runner_1.runSafeAsync)(runtime, () => __awaiter(this, void 0, void 0, function* () {
            const document = documents.get(documentLinkParams.textDocument.uri);
            if (document) {
                yield dataProvidersReady;
                const documentContext = (0, documentContext_1.getDocumentContext)(document.uri, workspaceFolders);
                const stylesheet = stylesheets.get(document);
                return getLanguageService(document).findDocumentLinks2(document, stylesheet, documentContext);
            }
            return [];
        }), [], `Error while computing document links for ${documentLinkParams.textDocument.uri}`, token);
    }));
    connection.onReferences((referenceParams, token) => {
        return (0, runner_1.runSafeAsync)(runtime, () => __awaiter(this, void 0, void 0, function* () {
            const document = documents.get(referenceParams.textDocument.uri);
            if (document) {
                yield dataProvidersReady;
                const stylesheet = stylesheets.get(document);
                return getLanguageService(document).findReferences(document, referenceParams.position, stylesheet);
            }
            return [];
        }), [], `Error while computing references for ${referenceParams.textDocument.uri}`, token);
    });
    connection.onCodeAction((codeActionParams, token) => {
        return (0, runner_1.runSafeAsync)(runtime, () => __awaiter(this, void 0, void 0, function* () {
            const document = documents.get(codeActionParams.textDocument.uri);
            if (document) {
                yield dataProvidersReady;
                const stylesheet = stylesheets.get(document);
                return getLanguageService(document).doCodeActions(document, codeActionParams.range, codeActionParams.context, stylesheet);
            }
            return [];
        }), [], `Error while computing code actions for ${codeActionParams.textDocument.uri}`, token);
    });
    connection.onDocumentColor((params, token) => {
        return (0, runner_1.runSafeAsync)(runtime, () => __awaiter(this, void 0, void 0, function* () {
            const document = documents.get(params.textDocument.uri);
            if (document) {
                yield dataProvidersReady;
                const stylesheet = stylesheets.get(document);
                return getLanguageService(document).findDocumentColors(document, stylesheet);
            }
            return [];
        }), [], `Error while computing document colors for ${params.textDocument.uri}`, token);
    });
    connection.onColorPresentation((params, token) => {
        return (0, runner_1.runSafeAsync)(runtime, () => __awaiter(this, void 0, void 0, function* () {
            const document = documents.get(params.textDocument.uri);
            if (document) {
                yield dataProvidersReady;
                const stylesheet = stylesheets.get(document);
                return getLanguageService(document).getColorPresentations(document, stylesheet, params.color, params.range);
            }
            return [];
        }), [], `Error while computing color presentations for ${params.textDocument.uri}`, token);
    });
    connection.onRenameRequest((renameParameters, token) => {
        return (0, runner_1.runSafeAsync)(runtime, () => __awaiter(this, void 0, void 0, function* () {
            const document = documents.get(renameParameters.textDocument.uri);
            if (document) {
                yield dataProvidersReady;
                const stylesheet = stylesheets.get(document);
                return getLanguageService(document).doRename(document, renameParameters.position, renameParameters.newName, stylesheet);
            }
            return null;
        }), null, `Error while computing renames for ${renameParameters.textDocument.uri}`, token);
    });
    connection.onFoldingRanges((params, token) => {
        return (0, runner_1.runSafeAsync)(runtime, () => __awaiter(this, void 0, void 0, function* () {
            const document = documents.get(params.textDocument.uri);
            if (document) {
                yield dataProvidersReady;
                return getLanguageService(document).getFoldingRanges(document, { rangeLimit: foldingRangeLimit });
            }
            return null;
        }), null, `Error while computing folding ranges for ${params.textDocument.uri}`, token);
    });
    connection.onSelectionRanges((params, token) => {
        return (0, runner_1.runSafeAsync)(runtime, () => __awaiter(this, void 0, void 0, function* () {
            const document = documents.get(params.textDocument.uri);
            const positions = params.positions;
            if (document) {
                yield dataProvidersReady;
                const stylesheet = stylesheets.get(document);
                return getLanguageService(document).getSelectionRanges(document, positions, stylesheet);
            }
            return [];
        }), [], `Error while computing selection ranges for ${params.textDocument.uri}`, token);
    });
    function onFormat(textDocument, range, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const document = documents.get(textDocument.uri);
            if (document) {
                const edits = getLanguageService(document).format(document, range !== null && range !== void 0 ? range : getFullRange(document), options);
                if (edits.length > formatterMaxNumberOfEdits) {
                    const newText = vscode_css_languageservice_1.TextDocument.applyEdits(document, edits);
                    return [node_1.TextEdit.replace(getFullRange(document), newText)];
                }
                return edits;
            }
            return [];
        });
    }
    connection.onDocumentRangeFormatting((formatParams, token) => {
        return (0, runner_1.runSafeAsync)(runtime, () => onFormat(formatParams.textDocument, formatParams.range, formatParams.options), [], `Error while formatting range for ${formatParams.textDocument.uri}`, token);
    });
    connection.onDocumentFormatting((formatParams, token) => {
        return (0, runner_1.runSafeAsync)(runtime, () => onFormat(formatParams.textDocument, undefined, formatParams.options), [], `Error while formatting ${formatParams.textDocument.uri}`, token);
    });
    connection.onNotification(CustomDataChangedNotification.type, updateDataProviders);
    // Listen on the connection
    connection.listen();
}
exports.startServer = startServer;
function getFullRange(document) {
    return node_1.Range.create(vscode_css_languageservice_1.Position.create(0, 0), document.positionAt(document.getText().length));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL2xpYi9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUNBLHFEQUVvQztBQUNwQywyQ0FBaUM7QUFFakMsMkVBQTBMO0FBRTFMLG1EQUF3SDtBQUN4SCwyQ0FBOEM7QUFDOUMsNkRBQTZEO0FBQzdELDZDQUFrRDtBQUNsRCx5Q0FBK0Q7QUFDL0QsNkRBQTZEO0FBRzdELG1GQUFtRjtBQUNuRix5RUFBeUU7QUFFekUsNkVBQTZFO0FBQzdFLDRCQUE0QjtBQUM1QixNQUFNLFNBQVMsR0FBZ0MsSUFBSSxvQkFBYSxDQUFDLHlDQUFZLENBQUMsQ0FBQTtBQUU5RSxJQUFVLDZCQUE2QixDQUV0QztBQUZELFdBQVUsNkJBQTZCO0lBQ3pCLGtDQUFJLEdBQStCLElBQUksdUJBQWdCLENBQUMsdUJBQXVCLENBQUMsQ0FBQztBQUMvRixDQUFDLEVBRlMsNkJBQTZCLEtBQTdCLDZCQUE2QixRQUV0QztBQWlCRCxTQUFnQixXQUFXLENBQUMsVUFBc0IsRUFBRSxPQUEyQjtJQUU5RSxrQ0FBa0M7SUFDbEMsTUFBTSxTQUFTLEdBQUcsSUFBSSxvQkFBYSxDQUFDLHlDQUFZLENBQUMsQ0FBQztJQUNsRCwwREFBMEQ7SUFDMUQsa0RBQWtEO0lBQ2xELFNBQVMsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7SUFFN0IsTUFBTSxXQUFXLEdBQUcsSUFBQSwwQ0FBcUIsRUFBYSxFQUFFLEVBQUUsRUFBRSxFQUFFLFFBQVEsQ0FBQyxFQUFFLENBQUMsa0JBQWtCLENBQUMsUUFBUSxDQUFDLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDbEksU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRTtRQUN4QixXQUFXLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzNDLENBQUMsQ0FBQyxDQUFDO0lBQ0gsVUFBVSxD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QUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDaEwsQ0FBQyxDQUFDLENBQUM7SUFFSCxVQUFVLENBQUMsY0FBYyxDQUFDLDZCQUE2QixDQUFDLElBQUksRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO0lBRW5GLDJCQUEyQjtJQUMzQixVQUFVLENBQUMsTUFBTSxFQUFFLENBQUM7QUFFckIsQ0FBQztBQXpWRCxrQ0F5VkM7QUFFRCxTQUFTLFlBQVksQ0FBQyxRQUFzQjtJQUMzQyxPQUFPLFlBQUssQ0FBQyxNQUFNLENBQUMscUNBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDNUYsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIlxuaW1wb3J0IHtcblx0Q29ubmVjdGlvbiwgVGV4dERvY3VtZW50cywgSW5pdGlhbGl6ZVBhcmFtcywgSW5pdGlhbGl6ZVJlc3VsdCwgU2VydmVyQ2FwYWJpbGl0aWVzLCBDb25maWd1cmF0aW9uUmVxdWVzdCwgV29ya3NwYWNlRm9sZGVyLCBUZXh0RG9jdW1lbnRTeW5jS2luZCwgTm90aWZpY2F0aW9uVHlwZSwgRGlzcG9zYWJsZSwgVGV4dERvY3VtZW50SWRlbnRpZmllciwgUmFuZ2UsIEZvcm1hdHRpbmdPcHRpb25zLCBUZXh0RWRpdCwgRGlhZ25vc3RpY1xufSBmcm9tICd2c2NvZGUtbGFuZ3VhZ2VzZXJ2ZXIvbm9kZSc7XG5pbXBvcnQgeyBVUkkgfSBmcm9tICd2c2NvZGUtdXJpJztcblxuaW1wb3J0IHsgZ2V0Q1NTTGFuZ3VhZ2VTZXJ2aWNlLCBnZXRTQ1NTTGFuZ3VhZ2VTZXJ2aWNlLCBnZXRMRVNTTGFuZ3VhZ2VTZXJ2aWNlLCBMYW5ndWFnZVNldHRpbmdzLCBMYW5ndWFnZVNlcnZpY2UsIFN0eWxlc2hlZXQsIFRleHREb2N1bWVudCwgUG9zaXRpb24gfSBmcm9tICd2c2NvZGUtY3NzLWxhbmd1YWdlc2VydmljZSc7XG5cbmltcG9ydCB7IERpYWdub3N0aWNzU3VwcG9ydCwgcmVnaXN0ZXJEaWFnbm9zdGljc1B1bGxTdXBwb3J0LCByZWdpc3RlckRpYWdub3N0aWNzUHVzaFN1cHBvcnQgfSBmcm9tICcuL3V0aWxzL3ZhbGlkYXRpb24nO1xuaW1wb3J0IHsgcnVuU2FmZUFzeW5jIH0gZnJvbSAnLi91dGlscy9ydW5uZXInO1xuaW1wb3J0IHsgZ2V0TGFuZ3VhZ2VNb2RlbENhY2hlIH0gZnJvbSAnLi9sYW5ndWFnZU1vZGVsQ2FjaGUnO1xuaW1wb3J0IHsgZmV0Y2hEYXRhUHJvdmlkZXJzIH0gZnJvbSAnLi9jdXN0b21EYXRhJztcbmltcG9ydCB7IFJlcXVlc3RTZXJ2aWNlLCBnZXRSZXF1ZXN0U2VydmljZSB9IGZyb20gJy4vcmVxdWVzdHMnO1xuaW1wb3J0IHsgZ2V0RG9jdW1lbnRDb250ZXh0IH0gZnJvbSAnLi91dGlscy9kb2N1bWVudENvbnRleHQnO1xuXG5cbi8vIGBUZXh0RG9jdW1lbnRgIGlzIGFuIGluc3RhbmNlIG9mIHRoZSBgdnNjb2RlLWxhbmd1YWdlc2VydmVyLXRleHRkb2N1bWVudGAgY2xhc3MuXG4vLyBIZXJlIHdlJ3JlIGtlZXBpbmcgdHJhY2sgb2YgYSB3aG9sZSBzZXQgdmlhIHNvbWUgc29ydCBvZiBlbmhhbmNlZCBtYXAuXG5cbi8vIFRoaXMgcHJvYmFibHkgcmVwcmVzZW50cyBhbGwgb3BlbiBkb2N1bWVudHMsIGJ1dCBwZXJoYXBzIGV2ZW4gYWxsIHBvc3NpYmxlXG4vLyBkb2N1bWVudHMgaW4gdGhlIHByb2plY3QuXG5jb25zdCBkb2N1bWVudHM6IFRleHREb2N1bWVudHM8VGV4dERvY3VtZW50PiA9IG5ldyBUZXh0RG9jdW1lbnRzKFRleHREb2N1bWVudClcblxubmFtZXNwYWNlIEN1c3RvbURhdGFDaGFuZ2VkTm90aWZpY2F0aW9uIHtcblx0ZXhwb3J0IGNvbnN0IHR5cGU6IE5vdGlmaWNhdGlvblR5cGU8c3RyaW5nW10+ID0gbmV3IE5vdGlmaWNhdGlvblR5cGUoJ2Nzcy9jdXN0b21EYXRhQ2hhbmdlZCcpO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNldHRpbmdzIHtcblx0Y3NzOiBMYW5ndWFnZVNldHRpbmdzO1xuXHRsZXNzOiBMYW5ndWFnZVNldHRpbmdzO1xuXHRzY3NzOiBMYW5ndWFnZVNldHRpbmdzO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJ1bnRpbWVFbnZpcm9ubWVudCB7XG5cdHJlYWRvbmx5IGZpbGU/OiBSZXF1ZXN0U2VydmljZTtcblx0cmVhZG9ubHkgaHR0cD86IFJlcXVlc3RTZXJ2aWNlO1xuXHRyZWFkb25seSB0aW1lcjoge1xuXHRcdHNldEltbWVkaWF0ZShjYWxsYmFjazogKC4uLmFyZ3M6IGFueVtdKSA9PiB2b2lkLCAuLi5hcmdzOiBhbnlbXSk6IERpc3Bvc2FibGU7XG5cdFx0c2V0VGltZW91dChjYWxsYmFjazogKC4uLmFyZ3M6IGFueVtdKSA9PiB2b2lkLCBtczogbnVtYmVyLCAuLi5hcmdzOiBhbnlbXSk6IERpc3Bvc2FibGU7XG5cdH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdGFydFNlcnZlcihjb25uZWN0aW9uOiBDb25uZWN0aW9uLCBydW50aW1lOiBSdW50aW1lRW52aXJvbm1lbnQpIHtcblxuXHQvLyBDcmVhdGUgYSB0ZXh0IGRvY3VtZW50IG1hbmFnZXIuXG5cdGNvbnN0IGRvY3VtZW50cyA9IG5ldyBUZXh0RG9jdW1lbnRzKFRleHREb2N1bWVudCk7XG5cdC8vIE1ha2UgdGhlIHRleHQgZG9jdW1lbnQgbWFuYWdlciBsaXN0ZW4gb24gdGhlIGNvbm5lY3Rpb25cblx0Ly8gZm9yIG9wZW4sIGNoYW5nZSBhbmQgY2xvc2UgdGV4dCBkb2N1bWVudCBldmVudHNcblx0ZG9jdW1lbnRzLmxpc3Rlbihjb25uZWN0aW9uKTtcblxuXHRjb25zdCBzdHlsZXNoZWV0cyA9IGdldExhbmd1YWdlTW9kZWxDYWNoZTxTdHlsZXNoZWV0PigxMCwgNjAsIGRvY3VtZW50ID0+IGdldExhbmd1YWdlU2VydmljZShkb2N1bWVudCkucGFyc2VTdHlsZXNoZWV0KGRvY3VtZW50KSk7XG5cdGRvY3VtZW50cy5vbkRpZENsb3NlKGUgPT4ge1xuXHRcdHN0eWxlc2hlZXRzLm9uRG9jdW1lbnRSZW1vdmVkKGUuZG9jdW1lbnQpO1xuXHR9KTtcblx0Y29ubmVjdGlvbi5vblNodXRkb3duKCgpID0+IHtcblx0XHRzdHlsZXNoZWV0cy5kaXNwb3NlKCk7XG5cdH0pO1xuXG5cdGxldCBzY29wZWRTZXR0aW5nc1N1cHBvcnQgPSBmYWxzZTtcblx0bGV0IGZvbGRpbmdSYW5nZUxpbWl0ID0gTnVtYmVyLk1BWF9WQUxVRTtcblx0bGV0IHdvcmtzcGFjZUZvbGRlcnM6IFdvcmtzcGFjZUZvbGRlcltdO1xuXHRsZXQgZm9ybWF0dGVyTWF4TnVtYmVyT2ZFZGl0cyA9IE51bWJlci5NQVhfVkFMVUU7XG5cblx0bGV0IGRhdGFQcm92aWRlcnNSZWFkeTogUHJvbWlzZTxhbnk+ID0gUHJvbWlzZS5yZXNvbHZlKCk7XG5cblx0bGV0IGRpYWdub3N0aWNzU3VwcG9ydDogRGlhZ25vc3RpY3NTdXBwb3J0IHwgdW5kZWZpbmVkO1xuXG5cdGNvbnN0IGxhbmd1YWdlU2VydmljZXM6IHsgW2lkOiBzdHJpbmddOiBMYW5ndWFnZVNlcnZpY2UgfSA9IHt9O1xuXG5cdGNvbnN0IG5vdFJlYWR5ID0gKCkgPT4gUHJvbWlzZS5yZWplY3QoJ05vdCBSZWFkeScpO1xuXHRsZXQgcmVxdWVzdFNlcnZpY2U6IFJlcXVlc3RTZXJ2aWNlID0geyBnZXRDb250ZW50OiBub3RSZWFkeSwgc3RhdDogbm90UmVhZHksIHJlYWREaXJlY3Rvcnk6IG5vdFJlYWR5IH07XG5cblx0Ly8gQWZ0ZXIgdGhlIHNlcnZlciBoYXMgc3RhcnRlZCB0aGUgY2xpZW50IHNlbmRzIGFuIGluaXRpYWxpemUgcmVxdWVzdC4gVGhlIHNlcnZlciByZWNlaXZlc1xuXHQvLyBpbiB0aGUgcGFzc2VkIHBhcmFtcyB0aGUgcm9vdFBhdGggb2YgdGhlIHdvcmtzcGFjZSBwbHVzIHRoZSBjbGllbnQgY2FwYWJpbGl0aWVzLlxuXHRjb25uZWN0aW9uLm9uSW5pdGlhbGl6ZSgocGFyYW1zOiBJbml0aWFsaXplUGFyYW1zKTogSW5pdGlhbGl6ZVJlc3VsdCA9PiB7XG5cblx0XHRjb25zdCBpbml0aWFsaXphdGlvbk9wdGlvbnMgPSBwYXJhbXMuaW5pdGlhbGl6YXRpb25PcHRpb25zIGFzIGFueSB8fCB7fTtcblxuXHRcdHdvcmtzcGFjZUZvbGRlcnMgPSAoPGFueT5wYXJhbXMpLndvcmtzcGFjZUZvbGRlcnM7XG5cdFx0aWYgKCFBcnJheS5pc0FycmF5KHdvcmtzcGFjZUZvbGRlcnMpKSB7XG5cdFx0XHR3b3Jrc3BhY2VGb2xkZXJzID0gW107XG5cdFx0XHRpZiAocGFyYW1zLnJvb3RQYXRoKSB7XG5cdFx0XHRcdHdvcmtzcGFjZUZvbGRlcnMucHVzaCh7IG5hbWU6ICcnLCB1cmk6IFVSSS5maWxlKHBhcmFtcy5yb290UGF0aCkudG9TdHJpbmcodHJ1ZSkgfSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmVxdWVzdFNlcnZpY2UgPSBnZXRSZXF1ZXN0U2VydmljZShpbml0aWFsaXphdGlvbk9wdGlvbnM/LmhhbmRsZWRTY2hlbWFzIHx8IFsnZmlsZSddLCBjb25uZWN0aW9uLCBydW50aW1lKTtcblxuXHRcdGZ1bmN0aW9uIGdldENsaWVudENhcGFiaWxpdHk8VD4obmFtZTogc3RyaW5nLCBkZWY6IFQpIHtcblx0XHRcdGNvbnN0IGtleXMgPSBuYW1lLnNwbGl0KCcuJyk7XG5cdFx0XHRsZXQgYzogYW55ID0gcGFyYW1zLmNhcGFiaWxpdGllcztcblx0XHRcdGZvciAobGV0IGkgPSAwOyBjICYmIGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGlmICghYy5oYXNPd25Qcm9wZXJ0eShrZXlzW2ldKSkge1xuXHRcdFx0XHRcdHJldHVybiBkZWY7XG5cdFx0XHRcdH1cblx0XHRcdFx0YyA9IGNba2V5c1tpXV07XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gYztcblx0XHR9XG5cdFx0Y29uc3Qgc25pcHBldFN1cHBvcnQgPSAhIWdldENsaWVudENhcGFiaWxpdHkoJ3RleHREb2N1bWVudC5jb21wbGV0aW9uLmNvbXBsZXRpb25JdGVtLnNuaXBwZXRTdXBwb3J0JywgZmFsc2UpO1xuXHRcdHNjb3BlZFNldHRpbmdzU3VwcG9ydCA9ICEhZ2V0Q2xpZW50Q2FwYWJpbGl0eSgnd29ya3NwYWNlLmNvbmZpZ3VyYXRpb24nLCBmYWxzZSk7XG5cdFx0Zm9sZGluZ1JhbmdlTGltaXQgPSBnZXRDbGllbnRDYXBhYmlsaXR5KCd0ZXh0RG9jdW1lbnQuZm9sZGluZ1JhbmdlLnJhbmdlTGltaXQnLCBOdW1iZXIuTUFYX1ZBTFVFKTtcblxuXHRcdGZvcm1hdHRlck1heE51bWJlck9mRWRpdHMgPSBpbml0aWFsaXphdGlvbk9wdGlvbnM/LmN1c3RvbUNhcGFiaWxpdGllcz8ucmFuZ2VGb3JtYXR0aW5nPy5lZGl0TGltaXQgfHwgTnVtYmVyLk1BWF9WQUxVRTtcblxuXHRcdGxhbmd1YWdlU2VydmljZXMuY3NzID0gZ2V0Q1NTTGFuZ3VhZ2VTZXJ2aWNlKHsgZmlsZVN5c3RlbVByb3ZpZGVyOiByZXF1ZXN0U2VydmljZSwgY2xpZW50Q2FwYWJpbGl0aWVzOiBwYXJhbXMuY2FwYWJpbGl0aWVzIH0pO1xuXHRcdGxhbmd1YWdlU2VydmljZXMuc2NzcyA9IGdldFNDU1NMYW5ndWFnZVNlcnZpY2UoeyBmaWxlU3lzdGVtUHJvdmlkZXI6IHJlcXVlc3RTZXJ2aWNlLCBjbGllbnRDYXBhYmlsaXRpZXM6IHBhcmFtcy5jYXBhYmlsaXRpZXMgfSk7XG5cdFx0bGFuZ3VhZ2VTZXJ2aWNlcy5sZXNzID0gZ2V0TEVTU0xhbmd1YWdlU2VydmljZSh7IGZpbGVTeXN0ZW1Qcm92aWRlcjogcmVxdWVzdFNlcnZpY2UsIGNsaWVudENhcGFiaWxpdGllczogcGFyYW1zLmNhcGFiaWxpdGllcyB9KTtcblxuXHRcdGNvbnN0IHN1cHBvcnRzRGlhZ25vc3RpY1B1bGwgPSBnZXRDbGllbnRDYXBhYmlsaXR5KCd0ZXh0RG9jdW1lbnQuZGlhZ25vc3RpYycsIHVuZGVmaW5lZCk7XG5cdFx0aWYgKHN1cHBvcnRzRGlhZ25vc3RpY1B1bGwgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0ZGlhZ25vc3RpY3NTdXBwb3J0ID0gcmVnaXN0ZXJEaWFnbm9zdGljc1B1c2hTdXBwb3J0KGRvY3VtZW50cywgY29ubmVjdGlvbiwgcnVudGltZSwgdmFsaWRhdGVUZXh0RG9jdW1lbnQpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRkaWFnbm9zdGljc1N1cHBvcnQgPSByZWdpc3RlckRpYWdub3N0aWNzUHVsbFN1cHBvcnQoZG9jdW1lbnRzLCBjb25uZWN0aW9uLCBydW50aW1lLCB2YWxpZGF0ZVRleHREb2N1bWVudCk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgY2FwYWJpbGl0aWVzOiBTZXJ2ZXJDYXBhYmlsaXRpZXMgPSB7XG5cdFx0XHR0ZXh0RG9jdW1lbnRTeW5jOiBUZXh0RG9jdW1lbnRTeW5jS2luZC5JbmNyZW1lbnRhbCxcblx0XHRcdGNvbXBsZXRpb25Qcm92aWRlcjogc25pcHBldFN1cHBvcnQgPyB7IHJlc29sdmVQcm92aWRlcjogZmFsc2UsIHRyaWdnZXJDaGFyYWN0ZXJzOiBbJy8nLCAnLScsICc6J10gfSA6IHVuZGVmaW5lZCxcblx0XHRcdGhvdmVyUHJvdmlkZXI6IHRydWUsXG5cdFx0XHRkb2N1bWVudFN5bWJvbFByb3ZpZGVyOiB0cnVlLFxuXHRcdFx0cmVmZXJlbmNlc1Byb3ZpZGVyOiB0cnVlLFxuXHRcdFx0ZGVmaW5pdGlvblByb3ZpZGVyOiB0cnVlLFxuXHRcdFx0ZG9jdW1lbnRIaWdobGlnaHRQcm92aWRlcjogdHJ1ZSxcblx0XHRcdGRvY3VtZW50TGlua1Byb3ZpZGVyOiB7XG5cdFx0XHRcdHJlc29sdmVQcm92aWRlcjogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRjb2RlQWN0aW9uUHJvdmlkZXI6IHRydWUsXG5cdFx0XHRyZW5hbWVQcm92aWRlcjogdHJ1ZSxcblx0XHRcdGNvbG9yUHJvdmlkZXI6IHt9LFxuXHRcdFx0Zm9sZGluZ1JhbmdlUHJvdmlkZXI6IHRydWUsXG5cdFx0XHRzZWxlY3Rpb25SYW5nZVByb3ZpZGVyOiB0cnVlLFxuXHRcdFx0ZGlhZ25vc3RpY1Byb3ZpZGVyOiB7XG5cdFx0XHRcdGRvY3VtZW50U2VsZWN0b3I6IG51bGwsXG5cdFx0XHRcdGludGVyRmlsZURlcGVuZGVuY2llczogZmFsc2UsXG5cdFx0XHRcdHdvcmtzcGFjZURpYWdub3N0aWNzOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGRvY3VtZW50UmFuZ2VGb3JtYXR0aW5nUHJvdmlkZXI6IGluaXRpYWxpemF0aW9uT3B0aW9ucz8ucHJvdmlkZUZvcm1hdHRlciA9PT0gdHJ1ZSxcblx0XHRcdGRvY3VtZW50Rm9ybWF0dGluZ1Byb3ZpZGVyOiBpbml0aWFsaXphdGlvbk9wdGlvbnM/LnByb3ZpZGVGb3JtYXR0ZXIgPT09IHRydWUsXG5cdFx0fTtcblx0XHRyZXR1cm4geyBjYXBhYmlsaXRpZXMgfTtcblx0fSk7XG5cblx0ZnVuY3Rpb24gZ2V0TGFuZ3VhZ2VTZXJ2aWNlKGRvY3VtZW50OiBUZXh0RG9jdW1lbnQpIHtcblx0XHRsZXQgc2VydmljZSA9IGxhbmd1YWdlU2VydmljZXNbZG9jdW1lbnQubGFuZ3VhZ2VJZF07XG5cdFx0aWYgKCFzZXJ2aWNlKSB7XG5cdFx0XHRjb25uZWN0aW9uLmNvbnNvbGUubG9nKCdEb2N1bWVudCB0eXBlIGlzICcgKyBkb2N1bWVudC5sYW5ndWFnZUlkICsgJywgdXNpbmcgY3NzIGluc3RlYWQuJyk7XG5cdFx0XHRzZXJ2aWNlID0gbGFuZ3VhZ2VTZXJ2aWNlc1snY3NzJ107XG5cdFx0fVxuXHRcdHJldHVybiBzZXJ2aWNlO1xuXHR9XG5cblx0bGV0IGRvY3VtZW50U2V0dGluZ3M6IHsgW2tleTogc3RyaW5nXTogVGhlbmFibGU8TGFuZ3VhZ2VTZXR0aW5ncyB8IHVuZGVmaW5lZD4gfSA9IHt9O1xuXHQvLyByZW1vdmUgZG9jdW1lbnQgc2V0dGluZ3Mgb24gY2xvc2Vcblx0ZG9jdW1lbnRzLm9uRGlkQ2xvc2UoZSA9PiB7XG5cdFx0ZGVsZXRlIGRvY3VtZW50U2V0dGluZ3NbZS5kb2N1bWVudC51cmldO1xuXHR9KTtcblx0ZnVuY3Rpb24gZ2V0RG9jdW1lbnRTZXR0aW5ncyh0ZXh0RG9jdW1lbnQ6IFRleHREb2N1bWVudCk6IFRoZW5hYmxlPExhbmd1YWdlU2V0dGluZ3MgfCB1bmRlZmluZWQ+IHtcblx0XHRpZiAoc2NvcGVkU2V0dGluZ3NTdXBwb3J0KSB7XG5cdFx0XHRsZXQgcHJvbWlzZSA9IGRvY3VtZW50U2V0dGluZ3NbdGV4dERvY3VtZW50LnVyaV07XG5cdFx0XHRpZiAoIXByb21pc2UpIHtcblx0XHRcdFx0Y29uc3QgY29uZmlnUmVxdWVzdFBhcmFtID0geyBpdGVtczogW3sgc2NvcGVVcmk6IHRleHREb2N1bWVudC51cmksIHNlY3Rpb246IHRleHREb2N1bWVudC5sYW5ndWFnZUlkIH1dIH07XG5cdFx0XHRcdHByb21pc2UgPSBjb25uZWN0aW9uLnNlbmRSZXF1ZXN0KENvbmZpZ3VyYXRpb25SZXF1ZXN0LnR5cGUsIGNvbmZpZ1JlcXVlc3RQYXJhbSkudGhlbihzID0+IHNbMF0gYXMgTGFuZ3VhZ2VTZXR0aW5ncyB8IHVuZGVmaW5lZCk7XG5cdFx0XHRcdGRvY3VtZW50U2V0dGluZ3NbdGV4dERvY3VtZW50LnVyaV0gPSBwcm9taXNlO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHByb21pc2U7XG5cdFx0fVxuXHRcdHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcblx0fVxuXG5cdC8vIFRoZSBzZXR0aW5ncyBoYXZlIGNoYW5nZWQuIElzIHNlbmQgb24gc2VydmVyIGFjdGl2YXRpb24gYXMgd2VsbC5cblx0Y29ubmVjdGlvbi5vbkRpZENoYW5nZUNvbmZpZ3VyYXRpb24oY2hhbmdlID0+IHtcblx0XHR1cGRhdGVDb25maWd1cmF0aW9uKGNoYW5nZS5zZXR0aW5ncyBhcyBhbnkpO1xuXHR9KTtcblxuXHRmdW5jdGlvbiB1cGRhdGVDb25maWd1cmF0aW9uKHNldHRpbmdzOiBhbnkpIHtcblx0XHRmb3IgKGNvbnN0IGxhbmd1YWdlSWQgaW4gbGFuZ3VhZ2VTZXJ2aWNlcykge1xuXHRcdFx0bGFuZ3VhZ2VTZXJ2aWNlc1tsYW5ndWFnZUlkXS5jb25maWd1cmUoc2V0dGluZ3NbbGFuZ3VhZ2VJZF0pO1xuXHRcdH1cblx0XHQvLyByZXNldCBhbGwgZG9jdW1lbnQgc2V0dGluZ3Ncblx0XHRkb2N1bWVudFNldHRpbmdzID0ge307XG5cdFx0ZGlhZ25vc3RpY3NTdXBwb3J0Py5yZXF1ZXN0UmVmcmVzaCgpO1xuXHR9XG5cblx0YXN5bmMgZnVuY3Rpb24gdmFsaWRhdGVUZXh0RG9jdW1lbnQodGV4dERvY3VtZW50OiBUZXh0RG9jdW1lbnQpOiBQcm9taXNlPERpYWdub3N0aWNbXT4ge1xuXHRcdGNvbnN0IHNldHRpbmdzUHJvbWlzZSA9IGdldERvY3VtZW50U2V0dGluZ3ModGV4dERvY3VtZW50KTtcblx0XHRjb25zdCBbc2V0dGluZ3NdID0gYXdhaXQgUHJvbWlzZS5hbGwoW3NldHRpbmdzUHJvbWlzZSwgZGF0YVByb3ZpZGVyc1JlYWR5XSk7XG5cblx0XHRjb25zdCBzdHlsZXNoZWV0ID0gc3R5bGVzaGVldHMuZ2V0KHRleHREb2N1bWVudCk7XG5cdFx0cmV0dXJuIGdldExhbmd1YWdlU2VydmljZSh0ZXh0RG9jdW1lbnQpLmRvVmFsaWRhdGlvbih0ZXh0RG9jdW1lbnQsIHN0eWxlc2hlZXQsIHNldHRpbmdzKTtcblx0fVxuXG5cdGZ1bmN0aW9uIHVwZGF0ZURhdGFQcm92aWRlcnMoZGF0YVBhdGhzOiBzdHJpbmdbXSkge1xuXHRcdGRhdGFQcm92aWRlcnNSZWFkeSA9IGZldGNoRGF0YVByb3ZpZGVycyhkYXRhUGF0aHMsIHJlcXVlc3RTZXJ2aWNlKS50aGVuKGN1c3RvbURhdGFQcm92aWRlcnMgPT4ge1xuXHRcdFx0Zm9yIChjb25zdCBsYW5nIGluIGxhbmd1YWdlU2VydmljZXMpIHtcblx0XHRcdFx0bGFuZ3VhZ2VTZXJ2aWNlc1tsYW5nXS5zZXREYXRhUHJvdmlkZXJzKHRydWUsIGN1c3RvbURhdGFQcm92aWRlcnMpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cblx0Y29ubmVjdGlvbi5vbkNvbXBsZXRpb24oKHRleHREb2N1bWVudFBvc2l0aW9uLCB0b2tlbikgPT4ge1xuXHRcdHJldHVybiBydW5TYWZlQXN5bmMocnVudGltZSwgYXN5bmMgKCkgPT4ge1xuXHRcdFx0Y29uc3QgZG9jdW1lbnQgPSBkb2N1bWVudHMuZ2V0KHRleHREb2N1bWVudFBvc2l0aW9uLnRleHREb2N1bWVudC51cmkpO1xuXHRcdFx0aWYgKGRvY3VtZW50KSB7XG5cdFx0XHRcdGNvbnN0IFtzZXR0aW5ncyxdID0gYXdhaXQgUHJvbWlzZS5hbGwoW2dldERvY3VtZW50U2V0dGluZ3MoZG9jdW1lbnQpLCBkYXRhUHJvdmlkZXJzUmVhZHldKTtcblx0XHRcdFx0Y29uc3Qgc3R5bGVTaGVldCA9IHN0eWxlc2hlZXRzLmdldChkb2N1bWVudCk7XG5cdFx0XHRcdGNvbnN0IGRvY3VtZW50Q29udGV4dCA9IGdldERvY3VtZW50Q29udGV4dChkb2N1bWVudC51cmksIHdvcmtzcGFjZUZvbGRlcnMpO1xuXHRcdFx0XHRyZXR1cm4gZ2V0TGFuZ3VhZ2VTZXJ2aWNlKGRvY3VtZW50KS5kb0NvbXBsZXRlMihkb2N1bWVudCwgdGV4dERvY3VtZW50UG9zaXRpb24ucG9zaXRpb24sIHN0eWxlU2hlZXQsIGRvY3VtZW50Q29udGV4dCwgc2V0dGluZ3M/LmNvbXBsZXRpb24pO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0fSwgbnVsbCwgYEVycm9yIHdoaWxlIGNvbXB1dGluZyBjb21wbGV0aW9ucyBmb3IgJHt0ZXh0RG9jdW1lbnRQb3NpdGlvbi50ZXh0RG9jdW1lbnQudXJpfWAsIHRva2VuKTtcblx0fSk7XG5cblx0Y29ubmVjdGlvbi5vbkhvdmVyKCh0ZXh0RG9jdW1lbnRQb3NpdGlvbiwgdG9rZW4pID0+IHtcblx0XHRyZXR1cm4gcnVuU2FmZUFzeW5jKHJ1bnRpbWUsIGFzeW5jICgpID0+IHtcblx0XHRcdGNvbnN0IGRvY3VtZW50ID0gZG9jdW1lbnRzLmdldCh0ZXh0RG9jdW1lbnRQb3NpdGlvbi50ZXh0RG9jdW1lbnQudXJpKTtcblx0XHRcdGlmIChkb2N1bWVudCkge1xuXHRcdFx0XHRjb25zdCBbc2V0dGluZ3MsXSA9IGF3YWl0IFByb21pc2UuYWxsKFtnZXREb2N1bWVudFNldHRpbmdzKGRvY3VtZW50KSwgZGF0YVByb3ZpZGVyc1JlYWR5XSk7XG5cdFx0XHRcdGNvbnN0IHN0eWxlU2hlZXQgPSBzdHlsZXNoZWV0cy5nZXQoZG9jdW1lbnQpO1xuXHRcdFx0XHRyZXR1cm4gZ2V0TGFuZ3VhZ2VTZXJ2aWNlKGRvY3VtZW50KS5kb0hvdmVyKGRvY3VtZW50LCB0ZXh0RG9jdW1lbnRQb3NpdGlvbi5wb3NpdGlvbiwgc3R5bGVTaGVldCwgc2V0dGluZ3M/LmhvdmVyKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBudWxsO1xuXHRcdH0sIG51bGwsIGBFcnJvciB3aGlsZSBjb21wdXRpbmcgaG92ZXIgZm9yICR7dGV4dERvY3VtZW50UG9zaXRpb24udGV4dERvY3VtZW50LnVyaX1gLCB0b2tlbik7XG5cdH0pO1xuXG5cdGNvbm5lY3Rpb24ub25Eb2N1bWVudFN5bWJvbCgoZG9jdW1lbnRTeW1ib2xQYXJhbXMsIHRva2VuKSA9PiB7XG5cdFx0cmV0dXJuIHJ1blNhZmVBc3luYyhydW50aW1lLCBhc3luYyAoKSA9PiB7XG5cdFx0XHRjb25zdCBkb2N1bWVudCA9IGRvY3VtZW50cy5nZXQoZG9jdW1lbnRTeW1ib2xQYXJhbXMudGV4dERvY3VtZW50LnVyaSk7XG5cdFx0XHRpZiAoZG9jdW1lbnQpIHtcblx0XHRcdFx0YXdhaXQgZGF0YVByb3ZpZGVyc1JlYWR5O1xuXHRcdFx0XHRjb25zdCBzdHlsZXNoZWV0ID0gc3R5bGVzaGVldHMuZ2V0KGRvY3VtZW50KTtcblx0XHRcdFx0cmV0dXJuIGdldExhbmd1YWdlU2VydmljZShkb2N1bWVudCkuZmluZERvY3VtZW50U3ltYm9sczIoZG9jdW1lbnQsIHN0eWxlc2hlZXQpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIFtdO1xuXHRcdH0sIFtdLCBgRXJyb3Igd2hpbGUgY29tcHV0aW5nIGRvY3VtZW50IHN5bWJvbHMgZm9yICR7ZG9jdW1lbnRTeW1ib2xQYXJhbXMudGV4dERvY3VtZW50LnVyaX1gLCB0b2tlbik7XG5cdH0pO1xuXG5cdGNvbm5lY3Rpb24ub25EZWZpbml0aW9uKChkb2N1bWVudERlZmluaXRpb25QYXJhbXMsIHRva2VuKSA9PiB7XG5cdFx0cmV0dXJuIHJ1blNhZmVBc3luYyhydW50aW1lLCBhc3luYyAoKSA9PiB7XG5cdFx0XHRjb25zdCBkb2N1bWVudCA9IGRvY3VtZW50cy5nZXQoZG9jdW1lbnREZWZpbml0aW9uUGFyYW1zLnRleHREb2N1bWVudC51cmkpO1xuXHRcdFx0aWYgKGRvY3VtZW50KSB7XG5cdFx0XHRcdGF3YWl0IGRhdGFQcm92aWRlcnNSZWFkeTtcblx0XHRcdFx0Y29uc3Qgc3R5bGVzaGVldCA9IHN0eWxlc2hlZXRzLmdldChkb2N1bWVudCk7XG5cdFx0XHRcdHJldHVybiBnZXRMYW5ndWFnZVNlcnZpY2UoZG9jdW1lbnQpLmZpbmREZWZpbml0aW9uKGRvY3VtZW50LCBkb2N1bWVudERlZmluaXRpb25QYXJhbXMucG9zaXRpb24sIHN0eWxlc2hlZXQpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0fSwgbnVsbCwgYEVycm9yIHdoaWxlIGNvbXB1dGluZyBkZWZpbml0aW9ucyBmb3IgJHtkb2N1bWVudERlZmluaXRpb25QYXJhbXMudGV4dERvY3VtZW50LnVyaX1gLCB0b2tlbik7XG5cdH0pO1xuXG5cdGNvbm5lY3Rpb24ub25Eb2N1bWVudEhpZ2hsaWdodCgoZG9jdW1lbnRIaWdobGlnaHRQYXJhbXMsIHRva2VuKSA9PiB7XG5cdFx0cmV0dXJuIHJ1blNhZmVBc3luYyhydW50aW1lLCBhc3luYyAoKSA9PiB7XG5cdFx0XHRjb25zdCBkb2N1bWVudCA9IGRvY3VtZW50cy5nZXQoZG9jdW1lbnRIaWdobGlnaHRQYXJhbXMudGV4dERvY3VtZW50LnVyaSk7XG5cdFx0XHRpZiAoZG9jdW1lbnQpIHtcblx0XHRcdFx0YXdhaXQgZGF0YVByb3ZpZGVyc1JlYWR5O1xuXHRcdFx0XHRjb25zdCBzdHlsZXNoZWV0ID0gc3R5bGVzaGVldHMuZ2V0KGRvY3VtZW50KTtcblx0XHRcdFx0cmV0dXJuIGdldExhbmd1YWdlU2VydmljZShkb2N1bWVudCkuZmluZERvY3VtZW50SGlnaGxpZ2h0cyhkb2N1bWVudCwgZG9jdW1lbnRIaWdobGlnaHRQYXJhbXMucG9zaXRpb24sIHN0eWxlc2hlZXQpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIFtdO1xuXHRcdH0sIFtdLCBgRXJyb3Igd2hpbGUgY29tcHV0aW5nIGRvY3VtZW50IGhpZ2hsaWdodHMgZm9yICR7ZG9jdW1lbnRIaWdobGlnaHRQYXJhbXMudGV4dERvY3VtZW50LnVyaX1gLCB0b2tlbik7XG5cdH0pO1xuXG5cblx0Y29ubmVjdGlvbi5vbkRvY3VtZW50TGlua3MoYXN5bmMgKGRvY3VtZW50TGlua1BhcmFtcywgdG9rZW4pID0+IHtcblx0XHRyZXR1cm4gcnVuU2FmZUFzeW5jKHJ1bnRpbWUsIGFzeW5jICgpID0+IHtcblx0XHRcdGNvbnN0IGRvY3VtZW50ID0gZG9jdW1lbnRzLmdldChkb2N1bWVudExpbmtQYXJhbXMudGV4dERvY3VtZW50LnVyaSk7XG5cdFx0XHRpZiAoZG9jdW1lbnQpIHtcblx0XHRcdFx0YXdhaXQgZGF0YVByb3ZpZGVyc1JlYWR5O1xuXHRcdFx0XHRjb25zdCBkb2N1bWVudENvbnRleHQgPSBnZXREb2N1bWVudENvbnRleHQoZG9jdW1lbnQudXJpLCB3b3Jrc3BhY2VGb2xkZXJzKTtcblx0XHRcdFx0Y29uc3Qgc3R5bGVzaGVldCA9IHN0eWxlc2hlZXRzLmdldChkb2N1bWVudCk7XG5cdFx0XHRcdHJldHVybiBnZXRMYW5ndWFnZVNlcnZpY2UoZG9jdW1lbnQpLmZpbmREb2N1bWVudExpbmtzMihkb2N1bWVudCwgc3R5bGVzaGVldCwgZG9jdW1lbnRDb250ZXh0KTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBbXTtcblx0XHR9LCBbXSwgYEVycm9yIHdoaWxlIGNvbXB1dGluZyBkb2N1bWVudCBsaW5rcyBmb3IgJHtkb2N1bWVudExpbmtQYXJhbXMudGV4dERvY3VtZW50LnVyaX1gLCB0b2tlbik7XG5cdH0pO1xuXG5cblx0Y29ubmVjdGlvbi5vblJlZmVyZW5jZXMoKHJlZmVyZW5jZVBhcmFtcywgdG9rZW4pID0+IHtcblx0XHRyZXR1cm4gcnVuU2FmZUFzeW5jKHJ1bnRpbWUsIGFzeW5jICgpID0+IHtcblx0XHRcdGNvbnN0IGRvY3VtZW50ID0gZG9jdW1lbnRzLmdldChyZWZlcmVuY2VQYXJhbXMudGV4dERvY3VtZW50LnVyaSk7XG5cdFx0XHRpZiAoZG9jdW1lbnQpIHtcblx0XHRcdFx0YXdhaXQgZGF0YVByb3ZpZGVyc1JlYWR5O1xuXHRcdFx0XHRjb25zdCBzdHlsZXNoZWV0ID0gc3R5bGVzaGVldHMuZ2V0KGRvY3VtZW50KTtcblx0XHRcdFx0cmV0dXJuIGdldExhbmd1YWdlU2VydmljZShkb2N1bWVudCkuZmluZFJlZmVyZW5jZXMoZG9jdW1lbnQsIHJlZmVyZW5jZVBhcmFtcy5wb3NpdGlvbiwgc3R5bGVzaGVldCk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gW107XG5cdFx0fSwgW10sIGBFcnJvciB3aGlsZSBjb21wdXRpbmcgcmVmZXJlbmNlcyBmb3IgJHtyZWZlcmVuY2VQYXJhbXMudGV4dERvY3VtZW50LnVyaX1gLCB0b2tlbik7XG5cdH0pO1xuXG5cdGNvbm5lY3Rpb24ub25Db2RlQWN0aW9uKChjb2RlQWN0aW9uUGFyYW1zLCB0b2tlbikgPT4ge1xuXHRcdHJldHVybiBydW5TYWZlQXN5bmMocnVudGltZSwgYXN5bmMgKCkgPT4ge1xuXHRcdFx0Y29uc3QgZG9jdW1lbnQgPSBkb2N1bWVudHMuZ2V0KGNvZGVBY3Rpb25QYXJhbXMudGV4dERvY3VtZW50LnVyaSk7XG5cdFx0XHRpZiAoZG9jdW1lbnQpIHtcblx0XHRcdFx0YXdhaXQgZGF0YVByb3ZpZGVyc1JlYWR5O1xuXHRcdFx0XHRjb25zdCBzdHlsZXNoZWV0ID0gc3R5bGVzaGVldHMuZ2V0KGRvY3VtZW50KTtcblx0XHRcdFx0cmV0dXJuIGdldExhbmd1YWdlU2VydmljZShkb2N1bWVudCkuZG9Db2RlQWN0aW9ucyhkb2N1bWVudCwgY29kZUFjdGlvblBhcmFtcy5yYW5nZSwgY29kZUFjdGlvblBhcmFtcy5jb250ZXh0LCBzdHlsZXNoZWV0KTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBbXTtcblx0XHR9LCBbXSwgYEVycm9yIHdoaWxlIGNvbXB1dGluZyBjb2RlIGFjdGlvbnMgZm9yICR7Y29kZUFjdGlvblBhcmFtcy50ZXh0RG9jdW1lbnQudXJpfWAsIHRva2VuKTtcblx0fSk7XG5cblx0Y29ubmVjdGlvbi5vbkRvY3VtZW50Q29sb3IoKHBhcmFtcywgdG9rZW4pID0+IHtcblx0XHRyZXR1cm4gcnVuU2FmZUFzeW5jKHJ1bnRpbWUsIGFzeW5jICgpID0+IHtcblx0XHRcdGNvbnN0IGRvY3VtZW50ID0gZG9jdW1lbnRzLmdldChwYXJhbXMudGV4dERvY3VtZW50LnVyaSk7XG5cdFx0XHRpZiAoZG9jdW1lbnQpIHtcblx0XHRcdFx0YXdhaXQgZGF0YVByb3ZpZGVyc1JlYWR5O1xuXHRcdFx0XHRjb25zdCBzdHlsZXNoZWV0ID0gc3R5bGVzaGVldHMuZ2V0KGRvY3VtZW50KTtcblx0XHRcdFx0cmV0dXJuIGdldExhbmd1YWdlU2VydmljZShkb2N1bWVudCkuZmluZERvY3VtZW50Q29sb3JzKGRvY3VtZW50LCBzdHlsZXNoZWV0KTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBbXTtcblx0XHR9LCBbXSwgYEVycm9yIHdoaWxlIGNvbXB1dGluZyBkb2N1bWVudCBjb2xvcnMgZm9yICR7cGFyYW1zLnRleHREb2N1bWVudC51cml9YCwgdG9rZW4pO1xuXHR9KTtcblxuXHRjb25uZWN0aW9uLm9uQ29sb3JQcmVzZW50YXRpb24oKHBhcmFtcywgdG9rZW4pID0+IHtcblx0XHRyZXR1cm4gcnVuU2FmZUFzeW5jKHJ1bnRpbWUsIGFzeW5jICgpID0+IHtcblx0XHRcdGNvbnN0IGRvY3VtZW50ID0gZG9jdW1lbnRzLmdldChwYXJhbXMudGV4dERvY3VtZW50LnVyaSk7XG5cdFx0XHRpZiAoZG9jdW1lbnQpIHtcblx0XHRcdFx0YXdhaXQgZGF0YVByb3ZpZGVyc1JlYWR5O1xuXHRcdFx0XHRjb25zdCBzdHlsZXNoZWV0ID0gc3R5bGVzaGVldHMuZ2V0KGRvY3VtZW50KTtcblx0XHRcdFx0cmV0dXJuIGdldExhbmd1YWdlU2VydmljZShkb2N1bWVudCkuZ2V0Q29sb3JQcmVzZW50YXRpb25zKGRvY3VtZW50LCBzdHlsZXNoZWV0LCBwYXJhbXMuY29sb3IsIHBhcmFtcy5yYW5nZSk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gW107XG5cdFx0fSwgW10sIGBFcnJvciB3aGlsZSBjb21wdXRpbmcgY29sb3IgcHJlc2VudGF0aW9ucyBmb3IgJHtwYXJhbXMudGV4dERvY3VtZW50LnVyaX1gLCB0b2tlbik7XG5cdH0pO1xuXG5cdGNvbm5lY3Rpb24ub25SZW5hbWVSZXF1ZXN0KChyZW5hbWVQYXJhbWV0ZXJzLCB0b2tlbikgPT4ge1xuXHRcdHJldHVybiBydW5TYWZlQXN5bmMocnVudGltZSwgYXN5bmMgKCkgPT4ge1xuXHRcdFx0Y29uc3QgZG9jdW1lbnQgPSBkb2N1bWVudHMuZ2V0KHJlbmFtZVBhcmFtZXRlcnMudGV4dERvY3VtZW50LnVyaSk7XG5cdFx0XHRpZiAoZG9jdW1lbnQpIHtcblx0XHRcdFx0YXdhaXQgZGF0YVByb3ZpZGVyc1JlYWR5O1xuXHRcdFx0XHRjb25zdCBzdHlsZXNoZWV0ID0gc3R5bGVzaGVldHMuZ2V0KGRvY3VtZW50KTtcblx0XHRcdFx0cmV0dXJuIGdldExhbmd1YWdlU2VydmljZShkb2N1bWVudCkuZG9SZW5hbWUoZG9jdW1lbnQsIHJlbmFtZVBhcmFtZXRlcnMucG9zaXRpb24sIHJlbmFtZVBhcmFtZXRlcnMubmV3TmFtZSwgc3R5bGVzaGVldCk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gbnVsbDtcblx0XHR9LCBudWxsLCBgRXJyb3Igd2hpbGUgY29tcHV0aW5nIHJlbmFtZXMgZm9yICR7cmVuYW1lUGFyYW1ldGVycy50ZXh0RG9jdW1lbnQudXJpfWAsIHRva2VuKTtcblx0fSk7XG5cblx0Y29ubmVjdGlvbi5vbkZvbGRpbmdSYW5nZXMoKHBhcmFtcywgdG9rZW4pID0+IHtcblx0XHRyZXR1cm4gcnVuU2FmZUFzeW5jKHJ1bnRpbWUsIGFzeW5jICgpID0+IHtcblx0XHRcdGNvbnN0IGRvY3VtZW50ID0gZG9jdW1lbnRzLmdldChwYXJhbXMudGV4dERvY3VtZW50LnVyaSk7XG5cdFx0XHRpZiAoZG9jdW1lbnQpIHtcblx0XHRcdFx0YXdhaXQgZGF0YVByb3ZpZGVyc1JlYWR5O1xuXHRcdFx0XHRyZXR1cm4gZ2V0TGFuZ3VhZ2VTZXJ2aWNlKGRvY3VtZW50KS5nZXRGb2xkaW5nUmFuZ2VzKGRvY3VtZW50LCB7IHJhbmdlTGltaXQ6IGZvbGRpbmdSYW5nZUxpbWl0IH0pO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0fSwgbnVsbCwgYEVycm9yIHdoaWxlIGNvbXB1dGluZyBmb2xkaW5nIHJhbmdlcyBmb3IgJHtwYXJhbXMudGV4dERvY3VtZW50LnVyaX1gLCB0b2tlbik7XG5cdH0pO1xuXG5cdGNvbm5lY3Rpb24ub25TZWxlY3Rpb25SYW5nZXMoKHBhcmFtcywgdG9rZW4pID0+IHtcblx0XHRyZXR1cm4gcnVuU2FmZUFzeW5jKHJ1bnRpbWUsIGFzeW5jICgpID0+IHtcblx0XHRcdGNvbnN0IGRvY3VtZW50ID0gZG9jdW1lbnRzLmdldChwYXJhbXMudGV4dERvY3VtZW50LnVyaSk7XG5cdFx0XHRjb25zdCBwb3NpdGlvbnM6IFBvc2l0aW9uW10gPSBwYXJhbXMucG9zaXRpb25zO1xuXG5cdFx0XHRpZiAoZG9jdW1lbnQpIHtcblx0XHRcdFx0YXdhaXQgZGF0YVByb3ZpZGVyc1JlYWR5O1xuXHRcdFx0XHRjb25zdCBzdHlsZXNoZWV0ID0gc3R5bGVzaGVldHMuZ2V0KGRvY3VtZW50KTtcblx0XHRcdFx0cmV0dXJuIGdldExhbmd1YWdlU2VydmljZShkb2N1bWVudCkuZ2V0U2VsZWN0aW9uUmFuZ2VzKGRvY3VtZW50LCBwb3NpdGlvbnMsIHN0eWxlc2hlZXQpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIFtdO1xuXHRcdH0sIFtdLCBgRXJyb3Igd2hpbGUgY29tcHV0aW5nIHNlbGVjdGlvbiByYW5nZXMgZm9yICR7cGFyYW1zLnRleHREb2N1bWVudC51cml9YCwgdG9rZW4pO1xuXHR9KTtcblxuXHRhc3luYyBmdW5jdGlvbiBvbkZvcm1hdCh0ZXh0RG9jdW1lbnQ6IFRleHREb2N1bWVudElkZW50aWZpZXIsIHJhbmdlOiBSYW5nZSB8IHVuZGVmaW5lZCwgb3B0aW9uczogRm9ybWF0dGluZ09wdGlvbnMpOiBQcm9taXNlPFRleHRFZGl0W10+IHtcblx0XHRjb25zdCBkb2N1bWVudCA9IGRvY3VtZW50cy5nZXQodGV4dERvY3VtZW50LnVyaSk7XG5cdFx0aWYgKGRvY3VtZW50KSB7XG5cdFx0XHRjb25zdCBlZGl0cyA9IGdldExhbmd1YWdlU2VydmljZShkb2N1bWVudCkuZm9ybWF0KGRvY3VtZW50LCByYW5nZSA/PyBnZXRGdWxsUmFuZ2UoZG9jdW1lbnQpLCBvcHRpb25zKTtcblx0XHRcdGlmIChlZGl0cy5sZW5ndGggPiBmb3JtYXR0ZXJNYXhOdW1iZXJPZkVkaXRzKSB7XG5cdFx0XHRcdGNvbnN0IG5ld1RleHQgPSBUZXh0RG9jdW1lbnQuYXBwbHlFZGl0cyhkb2N1bWVudCwgZWRpdHMpO1xuXHRcdFx0XHRyZXR1cm4gW1RleHRFZGl0LnJlcGxhY2UoZ2V0RnVsbFJhbmdlKGRvY3VtZW50KSwgbmV3VGV4dCldO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGVkaXRzO1xuXHRcdH1cblx0XHRyZXR1cm4gW107XG5cdH1cblxuXHRjb25uZWN0aW9uLm9uRG9jdW1lbnRSYW5nZUZvcm1hdHRpbmcoKGZvcm1hdFBhcmFtcywgdG9rZW4pID0+IHtcblx0XHRyZXR1cm4gcnVuU2FmZUFzeW5jKHJ1bnRpbWUsICgpID0+IG9uRm9ybWF0KGZvcm1hdFBhcmFtcy50ZXh0RG9jdW1lbnQsIGZvcm1hdFBhcmFtcy5yYW5nZSwgZm9ybWF0UGFyYW1zLm9wdGlvbnMpLCBbXSwgYEVycm9yIHdoaWxlIGZvcm1hdHRpbmcgcmFuZ2UgZm9yICR7Zm9ybWF0UGFyYW1zLnRleHREb2N1bWVudC51cml9YCwgdG9rZW4pO1xuXHR9KTtcblxuXHRjb25uZWN0aW9uLm9uRG9jdW1lbnRGb3JtYXR0aW5nKChmb3JtYXRQYXJhbXMsIHRva2VuKSA9PiB7XG5cdFx0cmV0dXJuIHJ1blNhZmVBc3luYyhydW50aW1lLCAoKSA9PiBvbkZvcm1hdChmb3JtYXRQYXJhbXMudGV4dERvY3VtZW50LCB1bmRlZmluZWQsIGZvcm1hdFBhcmFtcy5vcHRpb25zKSwgW10sIGBFcnJvciB3aGlsZSBmb3JtYXR0aW5nICR7Zm9ybWF0UGFyYW1zLnRleHREb2N1bWVudC51cml9YCwgdG9rZW4pO1xuXHR9KTtcblxuXHRjb25uZWN0aW9uLm9uTm90aWZpY2F0aW9uKEN1c3RvbURhdGFDaGFuZ2VkTm90aWZpY2F0aW9uLnR5cGUsIHVwZGF0ZURhdGFQcm92aWRlcnMpO1xuXG5cdC8vIExpc3RlbiBvbiB0aGUgY29ubmVjdGlvblxuXHRjb25uZWN0aW9uLmxpc3RlbigpO1xuXG59XG5cbmZ1bmN0aW9uIGdldEZ1bGxSYW5nZShkb2N1bWVudDogVGV4dERvY3VtZW50KTogUmFuZ2Uge1xuXHRyZXR1cm4gUmFuZ2UuY3JlYXRlKFBvc2l0aW9uLmNyZWF0ZSgwLCAwKSwgZG9jdW1lbnQucG9zaXRpb25BdChkb2N1bWVudC5nZXRUZXh0KCkubGVuZ3RoKSk7XG59XG4iXX0=