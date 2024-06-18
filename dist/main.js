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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL2xpYi9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUNBLHFEQUVvQztBQUNwQywyQ0FBaUM7QUFFakMsMkVBQTBMO0FBRTFMLG1EQUF3SDtBQUN4SCwyQ0FBOEM7QUFDOUMsNkRBQTZEO0FBQzdELDZDQUFrRDtBQUNsRCx5Q0FBK0Q7QUFDL0QsNkRBQTZEO0FBRTdELElBQVUsNkJBQTZCLENBRXRDO0FBRkQsV0FBVSw2QkFBNkI7SUFDekIsa0NBQUksR0FBK0IsSUFBSSx1QkFBZ0IsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO0FBQy9GLENBQUMsRUFGUyw2QkFBNkIsS0FBN0IsNkJBQTZCLFFBRXRDO0FBaUJELFNBQWdCLFdBQVcsQ0FBQyxVQUFzQixFQUFFLE9BQTJCO0lBRTlFLGtDQUFrQztJQUNsQyxNQUFNLFNBQVMsR0FBRyxJQUFJLG9CQUFhLENBQUMseUNBQVksQ0FBQyxDQUFDO0lBQ2xELDBEQUEwRDtJQUMxRCxrREFBa0Q7SUFDbEQsU0FBUyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUU3QixNQUFNLFdBQVcsR0FBRyxJQUFBLDBDQUFxQixFQUFhLEVBQUUsRUFBRSxFQUFFLEVBQUUsUUFBUSxDQUFDLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUNsSSxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFO1FBQ3hCLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDM0MsQ0FBQyxDQUFDLENBQUM7SUFDSCxVQUFVLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRTtRQUMxQixXQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDdkIsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLHFCQUFxQixHQUFHLEtBQUssQ0FB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QUM7SUFFbkYsMkJBQTJCO0lBQzNCLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUVyQixDQUFDO0FBelZELGtDQXlWQztBQUVELFNBQVMsWUFBWSxDQUFDLFFBQXNCO0lBQzNDLE9BQU8sWUFBSyxDQUFDLE1BQU0sQ0FBQyxxQ0FBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztBQUM1RixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiXG5pbXBvcnQge1xuXHRDb25uZWN0aW9uLCBUZXh0RG9jdW1lbnRzLCBJbml0aWFsaXplUGFyYW1zLCBJbml0aWFsaXplUmVzdWx0LCBTZXJ2ZXJDYXBhYmlsaXRpZXMsIENvbmZpZ3VyYXRpb25SZXF1ZXN0LCBXb3Jrc3BhY2VGb2xkZXIsIFRleHREb2N1bWVudFN5bmNLaW5kLCBOb3RpZmljYXRpb25UeXBlLCBEaXNwb3NhYmxlLCBUZXh0RG9jdW1lbnRJZGVudGlmaWVyLCBSYW5nZSwgRm9ybWF0dGluZ09wdGlvbnMsIFRleHRFZGl0LCBEaWFnbm9zdGljXG59IGZyb20gJ3ZzY29kZS1sYW5ndWFnZXNlcnZlci9ub2RlJztcbmltcG9ydCB7IFVSSSB9IGZyb20gJ3ZzY29kZS11cmknO1xuXG5pbXBvcnQgeyBnZXRDU1NMYW5ndWFnZVNlcnZpY2UsIGdldFNDU1NMYW5ndWFnZVNlcnZpY2UsIGdldExFU1NMYW5ndWFnZVNlcnZpY2UsIExhbmd1YWdlU2V0dGluZ3MsIExhbmd1YWdlU2VydmljZSwgU3R5bGVzaGVldCwgVGV4dERvY3VtZW50LCBQb3NpdGlvbiB9IGZyb20gJ3ZzY29kZS1jc3MtbGFuZ3VhZ2VzZXJ2aWNlJztcblxuaW1wb3J0IHsgRGlhZ25vc3RpY3NTdXBwb3J0LCByZWdpc3RlckRpYWdub3N0aWNzUHVsbFN1cHBvcnQsIHJlZ2lzdGVyRGlhZ25vc3RpY3NQdXNoU3VwcG9ydCB9IGZyb20gJy4vdXRpbHMvdmFsaWRhdGlvbic7XG5pbXBvcnQgeyBydW5TYWZlQXN5bmMgfSBmcm9tICcuL3V0aWxzL3J1bm5lcic7XG5pbXBvcnQgeyBnZXRMYW5ndWFnZU1vZGVsQ2FjaGUgfSBmcm9tICcuL2xhbmd1YWdlTW9kZWxDYWNoZSc7XG5pbXBvcnQgeyBmZXRjaERhdGFQcm92aWRlcnMgfSBmcm9tICcuL2N1c3RvbURhdGEnO1xuaW1wb3J0IHsgUmVxdWVzdFNlcnZpY2UsIGdldFJlcXVlc3RTZXJ2aWNlIH0gZnJvbSAnLi9yZXF1ZXN0cyc7XG5pbXBvcnQgeyBnZXREb2N1bWVudENvbnRleHQgfSBmcm9tICcuL3V0aWxzL2RvY3VtZW50Q29udGV4dCc7XG5cbm5hbWVzcGFjZSBDdXN0b21EYXRhQ2hhbmdlZE5vdGlmaWNhdGlvbiB7XG5cdGV4cG9ydCBjb25zdCB0eXBlOiBOb3RpZmljYXRpb25UeXBlPHN0cmluZ1tdPiA9IG5ldyBOb3RpZmljYXRpb25UeXBlKCdjc3MvY3VzdG9tRGF0YUNoYW5nZWQnKTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTZXR0aW5ncyB7XG5cdGNzczogTGFuZ3VhZ2VTZXR0aW5ncztcblx0bGVzczogTGFuZ3VhZ2VTZXR0aW5ncztcblx0c2NzczogTGFuZ3VhZ2VTZXR0aW5ncztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSdW50aW1lRW52aXJvbm1lbnQge1xuXHRyZWFkb25seSBmaWxlPzogUmVxdWVzdFNlcnZpY2U7XG5cdHJlYWRvbmx5IGh0dHA/OiBSZXF1ZXN0U2VydmljZTtcblx0cmVhZG9ubHkgdGltZXI6IHtcblx0XHRzZXRJbW1lZGlhdGUoY2FsbGJhY2s6ICguLi5hcmdzOiBhbnlbXSkgPT4gdm9pZCwgLi4uYXJnczogYW55W10pOiBEaXNwb3NhYmxlO1xuXHRcdHNldFRpbWVvdXQoY2FsbGJhY2s6ICguLi5hcmdzOiBhbnlbXSkgPT4gdm9pZCwgbXM6IG51bWJlciwgLi4uYXJnczogYW55W10pOiBEaXNwb3NhYmxlO1xuXHR9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RhcnRTZXJ2ZXIoY29ubmVjdGlvbjogQ29ubmVjdGlvbiwgcnVudGltZTogUnVudGltZUVudmlyb25tZW50KSB7XG5cblx0Ly8gQ3JlYXRlIGEgdGV4dCBkb2N1bWVudCBtYW5hZ2VyLlxuXHRjb25zdCBkb2N1bWVudHMgPSBuZXcgVGV4dERvY3VtZW50cyhUZXh0RG9jdW1lbnQpO1xuXHQvLyBNYWtlIHRoZSB0ZXh0IGRvY3VtZW50IG1hbmFnZXIgbGlzdGVuIG9uIHRoZSBjb25uZWN0aW9uXG5cdC8vIGZvciBvcGVuLCBjaGFuZ2UgYW5kIGNsb3NlIHRleHQgZG9jdW1lbnQgZXZlbnRzXG5cdGRvY3VtZW50cy5saXN0ZW4oY29ubmVjdGlvbik7XG5cblx0Y29uc3Qgc3R5bGVzaGVldHMgPSBnZXRMYW5ndWFnZU1vZGVsQ2FjaGU8U3R5bGVzaGVldD4oMTAsIDYwLCBkb2N1bWVudCA9PiBnZXRMYW5ndWFnZVNlcnZpY2UoZG9jdW1lbnQpLnBhcnNlU3R5bGVzaGVldChkb2N1bWVudCkpO1xuXHRkb2N1bWVudHMub25EaWRDbG9zZShlID0+IHtcblx0XHRzdHlsZXNoZWV0cy5vbkRvY3VtZW50UmVtb3ZlZChlLmRvY3VtZW50KTtcblx0fSk7XG5cdGNvbm5lY3Rpb24ub25TaHV0ZG93bigoKSA9PiB7XG5cdFx0c3R5bGVzaGVldHMuZGlzcG9zZSgpO1xuXHR9KTtcblxuXHRsZXQgc2NvcGVkU2V0dGluZ3NTdXBwb3J0ID0gZmFsc2U7XG5cdGxldCBmb2xkaW5nUmFuZ2VMaW1pdCA9IE51bWJlci5NQVhfVkFMVUU7XG5cdGxldCB3b3Jrc3BhY2VGb2xkZXJzOiBXb3Jrc3BhY2VGb2xkZXJbXTtcblx0bGV0IGZvcm1hdHRlck1heE51bWJlck9mRWRpdHMgPSBOdW1iZXIuTUFYX1ZBTFVFO1xuXG5cdGxldCBkYXRhUHJvdmlkZXJzUmVhZHk6IFByb21pc2U8YW55PiA9IFByb21pc2UucmVzb2x2ZSgpO1xuXG5cdGxldCBkaWFnbm9zdGljc1N1cHBvcnQ6IERpYWdub3N0aWNzU3VwcG9ydCB8IHVuZGVmaW5lZDtcblxuXHRjb25zdCBsYW5ndWFnZVNlcnZpY2VzOiB7IFtpZDogc3RyaW5nXTogTGFuZ3VhZ2VTZXJ2aWNlIH0gPSB7fTtcblxuXHRjb25zdCBub3RSZWFkeSA9ICgpID0+IFByb21pc2UucmVqZWN0KCdOb3QgUmVhZHknKTtcblx0bGV0IHJlcXVlc3RTZXJ2aWNlOiBSZXF1ZXN0U2VydmljZSA9IHsgZ2V0Q29udGVudDogbm90UmVhZHksIHN0YXQ6IG5vdFJlYWR5LCByZWFkRGlyZWN0b3J5OiBub3RSZWFkeSB9O1xuXG5cdC8vIEFmdGVyIHRoZSBzZXJ2ZXIgaGFzIHN0YXJ0ZWQgdGhlIGNsaWVudCBzZW5kcyBhbiBpbml0aWFsaXplIHJlcXVlc3QuIFRoZSBzZXJ2ZXIgcmVjZWl2ZXNcblx0Ly8gaW4gdGhlIHBhc3NlZCBwYXJhbXMgdGhlIHJvb3RQYXRoIG9mIHRoZSB3b3Jrc3BhY2UgcGx1cyB0aGUgY2xpZW50IGNhcGFiaWxpdGllcy5cblx0Y29ubmVjdGlvbi5vbkluaXRpYWxpemUoKHBhcmFtczogSW5pdGlhbGl6ZVBhcmFtcyk6IEluaXRpYWxpemVSZXN1bHQgPT4ge1xuXG5cdFx0Y29uc3QgaW5pdGlhbGl6YXRpb25PcHRpb25zID0gcGFyYW1zLmluaXRpYWxpemF0aW9uT3B0aW9ucyBhcyBhbnkgfHwge307XG5cblx0XHR3b3Jrc3BhY2VGb2xkZXJzID0gKDxhbnk+cGFyYW1zKS53b3Jrc3BhY2VGb2xkZXJzO1xuXHRcdGlmICghQXJyYXkuaXNBcnJheSh3b3Jrc3BhY2VGb2xkZXJzKSkge1xuXHRcdFx0d29ya3NwYWNlRm9sZGVycyA9IFtdO1xuXHRcdFx0aWYgKHBhcmFtcy5yb290UGF0aCkge1xuXHRcdFx0XHR3b3Jrc3BhY2VGb2xkZXJzLnB1c2goeyBuYW1lOiAnJywgdXJpOiBVUkkuZmlsZShwYXJhbXMucm9vdFBhdGgpLnRvU3RyaW5nKHRydWUpIH0pO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJlcXVlc3RTZXJ2aWNlID0gZ2V0UmVxdWVzdFNlcnZpY2UoaW5pdGlhbGl6YXRpb25PcHRpb25zPy5oYW5kbGVkU2NoZW1hcyB8fCBbJ2ZpbGUnXSwgY29ubmVjdGlvbiwgcnVudGltZSk7XG5cblx0XHRmdW5jdGlvbiBnZXRDbGllbnRDYXBhYmlsaXR5PFQ+KG5hbWU6IHN0cmluZywgZGVmOiBUKSB7XG5cdFx0XHRjb25zdCBrZXlzID0gbmFtZS5zcGxpdCgnLicpO1xuXHRcdFx0bGV0IGM6IGFueSA9IHBhcmFtcy5jYXBhYmlsaXRpZXM7XG5cdFx0XHRmb3IgKGxldCBpID0gMDsgYyAmJiBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRpZiAoIWMuaGFzT3duUHJvcGVydHkoa2V5c1tpXSkpIHtcblx0XHRcdFx0XHRyZXR1cm4gZGVmO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGMgPSBjW2tleXNbaV1dO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGM7XG5cdFx0fVxuXHRcdGNvbnN0IHNuaXBwZXRTdXBwb3J0ID0gISFnZXRDbGllbnRDYXBhYmlsaXR5KCd0ZXh0RG9jdW1lbnQuY29tcGxldGlvbi5jb21wbGV0aW9uSXRlbS5zbmlwcGV0U3VwcG9ydCcsIGZhbHNlKTtcblx0XHRzY29wZWRTZXR0aW5nc1N1cHBvcnQgPSAhIWdldENsaWVudENhcGFiaWxpdHkoJ3dvcmtzcGFjZS5jb25maWd1cmF0aW9uJywgZmFsc2UpO1xuXHRcdGZvbGRpbmdSYW5nZUxpbWl0ID0gZ2V0Q2xpZW50Q2FwYWJpbGl0eSgndGV4dERvY3VtZW50LmZvbGRpbmdSYW5nZS5yYW5nZUxpbWl0JywgTnVtYmVyLk1BWF9WQUxVRSk7XG5cblx0XHRmb3JtYXR0ZXJNYXhOdW1iZXJPZkVkaXRzID0gaW5pdGlhbGl6YXRpb25PcHRpb25zPy5jdXN0b21DYXBhYmlsaXRpZXM/LnJhbmdlRm9ybWF0dGluZz8uZWRpdExpbWl0IHx8IE51bWJlci5NQVhfVkFMVUU7XG5cblx0XHRsYW5ndWFnZVNlcnZpY2VzLmNzcyA9IGdldENTU0xhbmd1YWdlU2VydmljZSh7IGZpbGVTeXN0ZW1Qcm92aWRlcjogcmVxdWVzdFNlcnZpY2UsIGNsaWVudENhcGFiaWxpdGllczogcGFyYW1zLmNhcGFiaWxpdGllcyB9KTtcblx0XHRsYW5ndWFnZVNlcnZpY2VzLnNjc3MgPSBnZXRTQ1NTTGFuZ3VhZ2VTZXJ2aWNlKHsgZmlsZVN5c3RlbVByb3ZpZGVyOiByZXF1ZXN0U2VydmljZSwgY2xpZW50Q2FwYWJpbGl0aWVzOiBwYXJhbXMuY2FwYWJpbGl0aWVzIH0pO1xuXHRcdGxhbmd1YWdlU2VydmljZXMubGVzcyA9IGdldExFU1NMYW5ndWFnZVNlcnZpY2UoeyBmaWxlU3lzdGVtUHJvdmlkZXI6IHJlcXVlc3RTZXJ2aWNlLCBjbGllbnRDYXBhYmlsaXRpZXM6IHBhcmFtcy5jYXBhYmlsaXRpZXMgfSk7XG5cblx0XHRjb25zdCBzdXBwb3J0c0RpYWdub3N0aWNQdWxsID0gZ2V0Q2xpZW50Q2FwYWJpbGl0eSgndGV4dERvY3VtZW50LmRpYWdub3N0aWMnLCB1bmRlZmluZWQpO1xuXHRcdGlmIChzdXBwb3J0c0RpYWdub3N0aWNQdWxsID09PSB1bmRlZmluZWQpIHtcblx0XHRcdGRpYWdub3N0aWNzU3VwcG9ydCA9IHJlZ2lzdGVyRGlhZ25vc3RpY3NQdXNoU3VwcG9ydChkb2N1bWVudHMsIGNvbm5lY3Rpb24sIHJ1bnRpbWUsIHZhbGlkYXRlVGV4dERvY3VtZW50KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZGlhZ25vc3RpY3NTdXBwb3J0ID0gcmVnaXN0ZXJEaWFnbm9zdGljc1B1bGxTdXBwb3J0KGRvY3VtZW50cywgY29ubmVjdGlvbiwgcnVudGltZSwgdmFsaWRhdGVUZXh0RG9jdW1lbnQpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGNhcGFiaWxpdGllczogU2VydmVyQ2FwYWJpbGl0aWVzID0ge1xuXHRcdFx0dGV4dERvY3VtZW50U3luYzogVGV4dERvY3VtZW50U3luY0tpbmQuSW5jcmVtZW50YWwsXG5cdFx0XHRjb21wbGV0aW9uUHJvdmlkZXI6IHNuaXBwZXRTdXBwb3J0ID8geyByZXNvbHZlUHJvdmlkZXI6IGZhbHNlLCB0cmlnZ2VyQ2hhcmFjdGVyczogWycvJywgJy0nLCAnOiddIH0gOiB1bmRlZmluZWQsXG5cdFx0XHRob3ZlclByb3ZpZGVyOiB0cnVlLFxuXHRcdFx0ZG9jdW1lbnRTeW1ib2xQcm92aWRlcjogdHJ1ZSxcblx0XHRcdHJlZmVyZW5jZXNQcm92aWRlcjogdHJ1ZSxcblx0XHRcdGRlZmluaXRpb25Qcm92aWRlcjogdHJ1ZSxcblx0XHRcdGRvY3VtZW50SGlnaGxpZ2h0UHJvdmlkZXI6IHRydWUsXG5cdFx0XHRkb2N1bWVudExpbmtQcm92aWRlcjoge1xuXHRcdFx0XHRyZXNvbHZlUHJvdmlkZXI6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0Y29kZUFjdGlvblByb3ZpZGVyOiB0cnVlLFxuXHRcdFx0cmVuYW1lUHJvdmlkZXI6IHRydWUsXG5cdFx0XHRjb2xvclByb3ZpZGVyOiB7fSxcblx0XHRcdGZvbGRpbmdSYW5nZVByb3ZpZGVyOiB0cnVlLFxuXHRcdFx0c2VsZWN0aW9uUmFuZ2VQcm92aWRlcjogdHJ1ZSxcblx0XHRcdGRpYWdub3N0aWNQcm92aWRlcjoge1xuXHRcdFx0XHRkb2N1bWVudFNlbGVjdG9yOiBudWxsLFxuXHRcdFx0XHRpbnRlckZpbGVEZXBlbmRlbmNpZXM6IGZhbHNlLFxuXHRcdFx0XHR3b3Jrc3BhY2VEaWFnbm9zdGljczogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRkb2N1bWVudFJhbmdlRm9ybWF0dGluZ1Byb3ZpZGVyOiBpbml0aWFsaXphdGlvbk9wdGlvbnM/LnByb3ZpZGVGb3JtYXR0ZXIgPT09IHRydWUsXG5cdFx0XHRkb2N1bWVudEZvcm1hdHRpbmdQcm92aWRlcjogaW5pdGlhbGl6YXRpb25PcHRpb25zPy5wcm92aWRlRm9ybWF0dGVyID09PSB0cnVlLFxuXHRcdH07XG5cdFx0cmV0dXJuIHsgY2FwYWJpbGl0aWVzIH07XG5cdH0pO1xuXG5cdGZ1bmN0aW9uIGdldExhbmd1YWdlU2VydmljZShkb2N1bWVudDogVGV4dERvY3VtZW50KSB7XG5cdFx0bGV0IHNlcnZpY2UgPSBsYW5ndWFnZVNlcnZpY2VzW2RvY3VtZW50Lmxhbmd1YWdlSWRdO1xuXHRcdGlmICghc2VydmljZSkge1xuXHRcdFx0Y29ubmVjdGlvbi5jb25zb2xlLmxvZygnRG9jdW1lbnQgdHlwZSBpcyAnICsgZG9jdW1lbnQubGFuZ3VhZ2VJZCArICcsIHVzaW5nIGNzcyBpbnN0ZWFkLicpO1xuXHRcdFx0c2VydmljZSA9IGxhbmd1YWdlU2VydmljZXNbJ2NzcyddO1xuXHRcdH1cblx0XHRyZXR1cm4gc2VydmljZTtcblx0fVxuXG5cdGxldCBkb2N1bWVudFNldHRpbmdzOiB7IFtrZXk6IHN0cmluZ106IFRoZW5hYmxlPExhbmd1YWdlU2V0dGluZ3MgfCB1bmRlZmluZWQ+IH0gPSB7fTtcblx0Ly8gcmVtb3ZlIGRvY3VtZW50IHNldHRpbmdzIG9uIGNsb3NlXG5cdGRvY3VtZW50cy5vbkRpZENsb3NlKGUgPT4ge1xuXHRcdGRlbGV0ZSBkb2N1bWVudFNldHRpbmdzW2UuZG9jdW1lbnQudXJpXTtcblx0fSk7XG5cdGZ1bmN0aW9uIGdldERvY3VtZW50U2V0dGluZ3ModGV4dERvY3VtZW50OiBUZXh0RG9jdW1lbnQpOiBUaGVuYWJsZTxMYW5ndWFnZVNldHRpbmdzIHwgdW5kZWZpbmVkPiB7XG5cdFx0aWYgKHNjb3BlZFNldHRpbmdzU3VwcG9ydCkge1xuXHRcdFx0bGV0IHByb21pc2UgPSBkb2N1bWVudFNldHRpbmdzW3RleHREb2N1bWVudC51cmldO1xuXHRcdFx0aWYgKCFwcm9taXNlKSB7XG5cdFx0XHRcdGNvbnN0IGNvbmZpZ1JlcXVlc3RQYXJhbSA9IHsgaXRlbXM6IFt7IHNjb3BlVXJpOiB0ZXh0RG9jdW1lbnQudXJpLCBzZWN0aW9uOiB0ZXh0RG9jdW1lbnQubGFuZ3VhZ2VJZCB9XSB9O1xuXHRcdFx0XHRwcm9taXNlID0gY29ubmVjdGlvbi5zZW5kUmVxdWVzdChDb25maWd1cmF0aW9uUmVxdWVzdC50eXBlLCBjb25maWdSZXF1ZXN0UGFyYW0pLnRoZW4ocyA9PiBzWzBdIGFzIExhbmd1YWdlU2V0dGluZ3MgfCB1bmRlZmluZWQpO1xuXHRcdFx0XHRkb2N1bWVudFNldHRpbmdzW3RleHREb2N1bWVudC51cmldID0gcHJvbWlzZTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBwcm9taXNlO1xuXHRcdH1cblx0XHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XG5cdH1cblxuXHQvLyBUaGUgc2V0dGluZ3MgaGF2ZSBjaGFuZ2VkLiBJcyBzZW5kIG9uIHNlcnZlciBhY3RpdmF0aW9uIGFzIHdlbGwuXG5cdGNvbm5lY3Rpb24ub25EaWRDaGFuZ2VDb25maWd1cmF0aW9uKGNoYW5nZSA9PiB7XG5cdFx0dXBkYXRlQ29uZmlndXJhdGlvbihjaGFuZ2Uuc2V0dGluZ3MgYXMgYW55KTtcblx0fSk7XG5cblx0ZnVuY3Rpb24gdXBkYXRlQ29uZmlndXJhdGlvbihzZXR0aW5nczogYW55KSB7XG5cdFx0Zm9yIChjb25zdCBsYW5ndWFnZUlkIGluIGxhbmd1YWdlU2VydmljZXMpIHtcblx0XHRcdGxhbmd1YWdlU2VydmljZXNbbGFuZ3VhZ2VJZF0uY29uZmlndXJlKHNldHRpbmdzW2xhbmd1YWdlSWRdKTtcblx0XHR9XG5cdFx0Ly8gcmVzZXQgYWxsIGRvY3VtZW50IHNldHRpbmdzXG5cdFx0ZG9jdW1lbnRTZXR0aW5ncyA9IHt9O1xuXHRcdGRpYWdub3N0aWNzU3VwcG9ydD8ucmVxdWVzdFJlZnJlc2goKTtcblx0fVxuXG5cdGFzeW5jIGZ1bmN0aW9uIHZhbGlkYXRlVGV4dERvY3VtZW50KHRleHREb2N1bWVudDogVGV4dERvY3VtZW50KTogUHJvbWlzZTxEaWFnbm9zdGljW10+IHtcblx0XHRjb25zdCBzZXR0aW5nc1Byb21pc2UgPSBnZXREb2N1bWVudFNldHRpbmdzKHRleHREb2N1bWVudCk7XG5cdFx0Y29uc3QgW3NldHRpbmdzXSA9IGF3YWl0IFByb21pc2UuYWxsKFtzZXR0aW5nc1Byb21pc2UsIGRhdGFQcm92aWRlcnNSZWFkeV0pO1xuXG5cdFx0Y29uc3Qgc3R5bGVzaGVldCA9IHN0eWxlc2hlZXRzLmdldCh0ZXh0RG9jdW1lbnQpO1xuXHRcdHJldHVybiBnZXRMYW5ndWFnZVNlcnZpY2UodGV4dERvY3VtZW50KS5kb1ZhbGlkYXRpb24odGV4dERvY3VtZW50LCBzdHlsZXNoZWV0LCBzZXR0aW5ncyk7XG5cdH1cblxuXHRmdW5jdGlvbiB1cGRhdGVEYXRhUHJvdmlkZXJzKGRhdGFQYXRoczogc3RyaW5nW10pIHtcblx0XHRkYXRhUHJvdmlkZXJzUmVhZHkgPSBmZXRjaERhdGFQcm92aWRlcnMoZGF0YVBhdGhzLCByZXF1ZXN0U2VydmljZSkudGhlbihjdXN0b21EYXRhUHJvdmlkZXJzID0+IHtcblx0XHRcdGZvciAoY29uc3QgbGFuZyBpbiBsYW5ndWFnZVNlcnZpY2VzKSB7XG5cdFx0XHRcdGxhbmd1YWdlU2VydmljZXNbbGFuZ10uc2V0RGF0YVByb3ZpZGVycyh0cnVlLCBjdXN0b21EYXRhUHJvdmlkZXJzKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXG5cdGNvbm5lY3Rpb24ub25Db21wbGV0aW9uKCh0ZXh0RG9jdW1lbnRQb3NpdGlvbiwgdG9rZW4pID0+IHtcblx0XHRyZXR1cm4gcnVuU2FmZUFzeW5jKHJ1bnRpbWUsIGFzeW5jICgpID0+IHtcblx0XHRcdGNvbnN0IGRvY3VtZW50ID0gZG9jdW1lbnRzLmdldCh0ZXh0RG9jdW1lbnRQb3NpdGlvbi50ZXh0RG9jdW1lbnQudXJpKTtcblx0XHRcdGlmIChkb2N1bWVudCkge1xuXHRcdFx0XHRjb25zdCBbc2V0dGluZ3MsXSA9IGF3YWl0IFByb21pc2UuYWxsKFtnZXREb2N1bWVudFNldHRpbmdzKGRvY3VtZW50KSwgZGF0YVByb3ZpZGVyc1JlYWR5XSk7XG5cdFx0XHRcdGNvbnN0IHN0eWxlU2hlZXQgPSBzdHlsZXNoZWV0cy5nZXQoZG9jdW1lbnQpO1xuXHRcdFx0XHRjb25zdCBkb2N1bWVudENvbnRleHQgPSBnZXREb2N1bWVudENvbnRleHQoZG9jdW1lbnQudXJpLCB3b3Jrc3BhY2VGb2xkZXJzKTtcblx0XHRcdFx0cmV0dXJuIGdldExhbmd1YWdlU2VydmljZShkb2N1bWVudCkuZG9Db21wbGV0ZTIoZG9jdW1lbnQsIHRleHREb2N1bWVudFBvc2l0aW9uLnBvc2l0aW9uLCBzdHlsZVNoZWV0LCBkb2N1bWVudENvbnRleHQsIHNldHRpbmdzPy5jb21wbGV0aW9uKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBudWxsO1xuXHRcdH0sIG51bGwsIGBFcnJvciB3aGlsZSBjb21wdXRpbmcgY29tcGxldGlvbnMgZm9yICR7dGV4dERvY3VtZW50UG9zaXRpb24udGV4dERvY3VtZW50LnVyaX1gLCB0b2tlbik7XG5cdH0pO1xuXG5cdGNvbm5lY3Rpb24ub25Ib3ZlcigodGV4dERvY3VtZW50UG9zaXRpb24sIHRva2VuKSA9PiB7XG5cdFx0cmV0dXJuIHJ1blNhZmVBc3luYyhydW50aW1lLCBhc3luYyAoKSA9PiB7XG5cdFx0XHRjb25zdCBkb2N1bWVudCA9IGRvY3VtZW50cy5nZXQodGV4dERvY3VtZW50UG9zaXRpb24udGV4dERvY3VtZW50LnVyaSk7XG5cdFx0XHRpZiAoZG9jdW1lbnQpIHtcblx0XHRcdFx0Y29uc3QgW3NldHRpbmdzLF0gPSBhd2FpdCBQcm9taXNlLmFsbChbZ2V0RG9jdW1lbnRTZXR0aW5ncyhkb2N1bWVudCksIGRhdGFQcm92aWRlcnNSZWFkeV0pO1xuXHRcdFx0XHRjb25zdCBzdHlsZVNoZWV0ID0gc3R5bGVzaGVldHMuZ2V0KGRvY3VtZW50KTtcblx0XHRcdFx0cmV0dXJuIGdldExhbmd1YWdlU2VydmljZShkb2N1bWVudCkuZG9Ib3Zlcihkb2N1bWVudCwgdGV4dERvY3VtZW50UG9zaXRpb24ucG9zaXRpb24sIHN0eWxlU2hlZXQsIHNldHRpbmdzPy5ob3Zlcik7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gbnVsbDtcblx0XHR9LCBudWxsLCBgRXJyb3Igd2hpbGUgY29tcHV0aW5nIGhvdmVyIGZvciAke3RleHREb2N1bWVudFBvc2l0aW9uLnRleHREb2N1bWVudC51cml9YCwgdG9rZW4pO1xuXHR9KTtcblxuXHRjb25uZWN0aW9uLm9uRG9jdW1lbnRTeW1ib2woKGRvY3VtZW50U3ltYm9sUGFyYW1zLCB0b2tlbikgPT4ge1xuXHRcdHJldHVybiBydW5TYWZlQXN5bmMocnVudGltZSwgYXN5bmMgKCkgPT4ge1xuXHRcdFx0Y29uc3QgZG9jdW1lbnQgPSBkb2N1bWVudHMuZ2V0KGRvY3VtZW50U3ltYm9sUGFyYW1zLnRleHREb2N1bWVudC51cmkpO1xuXHRcdFx0aWYgKGRvY3VtZW50KSB7XG5cdFx0XHRcdGF3YWl0IGRhdGFQcm92aWRlcnNSZWFkeTtcblx0XHRcdFx0Y29uc3Qgc3R5bGVzaGVldCA9IHN0eWxlc2hlZXRzLmdldChkb2N1bWVudCk7XG5cdFx0XHRcdHJldHVybiBnZXRMYW5ndWFnZVNlcnZpY2UoZG9jdW1lbnQpLmZpbmREb2N1bWVudFN5bWJvbHMyKGRvY3VtZW50LCBzdHlsZXNoZWV0KTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBbXTtcblx0XHR9LCBbXSwgYEVycm9yIHdoaWxlIGNvbXB1dGluZyBkb2N1bWVudCBzeW1ib2xzIGZvciAke2RvY3VtZW50U3ltYm9sUGFyYW1zLnRleHREb2N1bWVudC51cml9YCwgdG9rZW4pO1xuXHR9KTtcblxuXHRjb25uZWN0aW9uLm9uRGVmaW5pdGlvbigoZG9jdW1lbnREZWZpbml0aW9uUGFyYW1zLCB0b2tlbikgPT4ge1xuXHRcdHJldHVybiBydW5TYWZlQXN5bmMocnVudGltZSwgYXN5bmMgKCkgPT4ge1xuXHRcdFx0Y29uc3QgZG9jdW1lbnQgPSBkb2N1bWVudHMuZ2V0KGRvY3VtZW50RGVmaW5pdGlvblBhcmFtcy50ZXh0RG9jdW1lbnQudXJpKTtcblx0XHRcdGlmIChkb2N1bWVudCkge1xuXHRcdFx0XHRhd2FpdCBkYXRhUHJvdmlkZXJzUmVhZHk7XG5cdFx0XHRcdGNvbnN0IHN0eWxlc2hlZXQgPSBzdHlsZXNoZWV0cy5nZXQoZG9jdW1lbnQpO1xuXHRcdFx0XHRyZXR1cm4gZ2V0TGFuZ3VhZ2VTZXJ2aWNlKGRvY3VtZW50KS5maW5kRGVmaW5pdGlvbihkb2N1bWVudCwgZG9jdW1lbnREZWZpbml0aW9uUGFyYW1zLnBvc2l0aW9uLCBzdHlsZXNoZWV0KTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBudWxsO1xuXHRcdH0sIG51bGwsIGBFcnJvciB3aGlsZSBjb21wdXRpbmcgZGVmaW5pdGlvbnMgZm9yICR7ZG9jdW1lbnREZWZpbml0aW9uUGFyYW1zLnRleHREb2N1bWVudC51cml9YCwgdG9rZW4pO1xuXHR9KTtcblxuXHRjb25uZWN0aW9uLm9uRG9jdW1lbnRIaWdobGlnaHQoKGRvY3VtZW50SGlnaGxpZ2h0UGFyYW1zLCB0b2tlbikgPT4ge1xuXHRcdHJldHVybiBydW5TYWZlQXN5bmMocnVudGltZSwgYXN5bmMgKCkgPT4ge1xuXHRcdFx0Y29uc3QgZG9jdW1lbnQgPSBkb2N1bWVudHMuZ2V0KGRvY3VtZW50SGlnaGxpZ2h0UGFyYW1zLnRleHREb2N1bWVudC51cmkpO1xuXHRcdFx0aWYgKGRvY3VtZW50KSB7XG5cdFx0XHRcdGF3YWl0IGRhdGFQcm92aWRlcnNSZWFkeTtcblx0XHRcdFx0Y29uc3Qgc3R5bGVzaGVldCA9IHN0eWxlc2hlZXRzLmdldChkb2N1bWVudCk7XG5cdFx0XHRcdHJldHVybiBnZXRMYW5ndWFnZVNlcnZpY2UoZG9jdW1lbnQpLmZpbmREb2N1bWVudEhpZ2hsaWdodHMoZG9jdW1lbnQsIGRvY3VtZW50SGlnaGxpZ2h0UGFyYW1zLnBvc2l0aW9uLCBzdHlsZXNoZWV0KTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBbXTtcblx0XHR9LCBbXSwgYEVycm9yIHdoaWxlIGNvbXB1dGluZyBkb2N1bWVudCBoaWdobGlnaHRzIGZvciAke2RvY3VtZW50SGlnaGxpZ2h0UGFyYW1zLnRleHREb2N1bWVudC51cml9YCwgdG9rZW4pO1xuXHR9KTtcblxuXG5cdGNvbm5lY3Rpb24ub25Eb2N1bWVudExpbmtzKGFzeW5jIChkb2N1bWVudExpbmtQYXJhbXMsIHRva2VuKSA9PiB7XG5cdFx0cmV0dXJuIHJ1blNhZmVBc3luYyhydW50aW1lLCBhc3luYyAoKSA9PiB7XG5cdFx0XHRjb25zdCBkb2N1bWVudCA9IGRvY3VtZW50cy5nZXQoZG9jdW1lbnRMaW5rUGFyYW1zLnRleHREb2N1bWVudC51cmkpO1xuXHRcdFx0aWYgKGRvY3VtZW50KSB7XG5cdFx0XHRcdGF3YWl0IGRhdGFQcm92aWRlcnNSZWFkeTtcblx0XHRcdFx0Y29uc3QgZG9jdW1lbnRDb250ZXh0ID0gZ2V0RG9jdW1lbnRDb250ZXh0KGRvY3VtZW50LnVyaSwgd29ya3NwYWNlRm9sZGVycyk7XG5cdFx0XHRcdGNvbnN0IHN0eWxlc2hlZXQgPSBzdHlsZXNoZWV0cy5nZXQoZG9jdW1lbnQpO1xuXHRcdFx0XHRyZXR1cm4gZ2V0TGFuZ3VhZ2VTZXJ2aWNlKGRvY3VtZW50KS5maW5kRG9jdW1lbnRMaW5rczIoZG9jdW1lbnQsIHN0eWxlc2hlZXQsIGRvY3VtZW50Q29udGV4dCk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gW107XG5cdFx0fSwgW10sIGBFcnJvciB3aGlsZSBjb21wdXRpbmcgZG9jdW1lbnQgbGlua3MgZm9yICR7ZG9jdW1lbnRMaW5rUGFyYW1zLnRleHREb2N1bWVudC51cml9YCwgdG9rZW4pO1xuXHR9KTtcblxuXG5cdGNvbm5lY3Rpb24ub25SZWZlcmVuY2VzKChyZWZlcmVuY2VQYXJhbXMsIHRva2VuKSA9PiB7XG5cdFx0cmV0dXJuIHJ1blNhZmVBc3luYyhydW50aW1lLCBhc3luYyAoKSA9PiB7XG5cdFx0XHRjb25zdCBkb2N1bWVudCA9IGRvY3VtZW50cy5nZXQocmVmZXJlbmNlUGFyYW1zLnRleHREb2N1bWVudC51cmkpO1xuXHRcdFx0aWYgKGRvY3VtZW50KSB7XG5cdFx0XHRcdGF3YWl0IGRhdGFQcm92aWRlcnNSZWFkeTtcblx0XHRcdFx0Y29uc3Qgc3R5bGVzaGVldCA9IHN0eWxlc2hlZXRzLmdldChkb2N1bWVudCk7XG5cdFx0XHRcdHJldHVybiBnZXRMYW5ndWFnZVNlcnZpY2UoZG9jdW1lbnQpLmZpbmRSZWZlcmVuY2VzKGRvY3VtZW50LCByZWZlcmVuY2VQYXJhbXMucG9zaXRpb24sIHN0eWxlc2hlZXQpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIFtdO1xuXHRcdH0sIFtdLCBgRXJyb3Igd2hpbGUgY29tcHV0aW5nIHJlZmVyZW5jZXMgZm9yICR7cmVmZXJlbmNlUGFyYW1zLnRleHREb2N1bWVudC51cml9YCwgdG9rZW4pO1xuXHR9KTtcblxuXHRjb25uZWN0aW9uLm9uQ29kZUFjdGlvbigoY29kZUFjdGlvblBhcmFtcywgdG9rZW4pID0+IHtcblx0XHRyZXR1cm4gcnVuU2FmZUFzeW5jKHJ1bnRpbWUsIGFzeW5jICgpID0+IHtcblx0XHRcdGNvbnN0IGRvY3VtZW50ID0gZG9jdW1lbnRzLmdldChjb2RlQWN0aW9uUGFyYW1zLnRleHREb2N1bWVudC51cmkpO1xuXHRcdFx0aWYgKGRvY3VtZW50KSB7XG5cdFx0XHRcdGF3YWl0IGRhdGFQcm92aWRlcnNSZWFkeTtcblx0XHRcdFx0Y29uc3Qgc3R5bGVzaGVldCA9IHN0eWxlc2hlZXRzLmdldChkb2N1bWVudCk7XG5cdFx0XHRcdHJldHVybiBnZXRMYW5ndWFnZVNlcnZpY2UoZG9jdW1lbnQpLmRvQ29kZUFjdGlvbnMoZG9jdW1lbnQsIGNvZGVBY3Rpb25QYXJhbXMucmFuZ2UsIGNvZGVBY3Rpb25QYXJhbXMuY29udGV4dCwgc3R5bGVzaGVldCk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gW107XG5cdFx0fSwgW10sIGBFcnJvciB3aGlsZSBjb21wdXRpbmcgY29kZSBhY3Rpb25zIGZvciAke2NvZGVBY3Rpb25QYXJhbXMudGV4dERvY3VtZW50LnVyaX1gLCB0b2tlbik7XG5cdH0pO1xuXG5cdGNvbm5lY3Rpb24ub25Eb2N1bWVudENvbG9yKChwYXJhbXMsIHRva2VuKSA9PiB7XG5cdFx0cmV0dXJuIHJ1blNhZmVBc3luYyhydW50aW1lLCBhc3luYyAoKSA9PiB7XG5cdFx0XHRjb25zdCBkb2N1bWVudCA9IGRvY3VtZW50cy5nZXQocGFyYW1zLnRleHREb2N1bWVudC51cmkpO1xuXHRcdFx0aWYgKGRvY3VtZW50KSB7XG5cdFx0XHRcdGF3YWl0IGRhdGFQcm92aWRlcnNSZWFkeTtcblx0XHRcdFx0Y29uc3Qgc3R5bGVzaGVldCA9IHN0eWxlc2hlZXRzLmdldChkb2N1bWVudCk7XG5cdFx0XHRcdHJldHVybiBnZXRMYW5ndWFnZVNlcnZpY2UoZG9jdW1lbnQpLmZpbmREb2N1bWVudENvbG9ycyhkb2N1bWVudCwgc3R5bGVzaGVldCk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gW107XG5cdFx0fSwgW10sIGBFcnJvciB3aGlsZSBjb21wdXRpbmcgZG9jdW1lbnQgY29sb3JzIGZvciAke3BhcmFtcy50ZXh0RG9jdW1lbnQudXJpfWAsIHRva2VuKTtcblx0fSk7XG5cblx0Y29ubmVjdGlvbi5vbkNvbG9yUHJlc2VudGF0aW9uKChwYXJhbXMsIHRva2VuKSA9PiB7XG5cdFx0cmV0dXJuIHJ1blNhZmVBc3luYyhydW50aW1lLCBhc3luYyAoKSA9PiB7XG5cdFx0XHRjb25zdCBkb2N1bWVudCA9IGRvY3VtZW50cy5nZXQocGFyYW1zLnRleHREb2N1bWVudC51cmkpO1xuXHRcdFx0aWYgKGRvY3VtZW50KSB7XG5cdFx0XHRcdGF3YWl0IGRhdGFQcm92aWRlcnNSZWFkeTtcblx0XHRcdFx0Y29uc3Qgc3R5bGVzaGVldCA9IHN0eWxlc2hlZXRzLmdldChkb2N1bWVudCk7XG5cdFx0XHRcdHJldHVybiBnZXRMYW5ndWFnZVNlcnZpY2UoZG9jdW1lbnQpLmdldENvbG9yUHJlc2VudGF0aW9ucyhkb2N1bWVudCwgc3R5bGVzaGVldCwgcGFyYW1zLmNvbG9yLCBwYXJhbXMucmFuZ2UpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIFtdO1xuXHRcdH0sIFtdLCBgRXJyb3Igd2hpbGUgY29tcHV0aW5nIGNvbG9yIHByZXNlbnRhdGlvbnMgZm9yICR7cGFyYW1zLnRleHREb2N1bWVudC51cml9YCwgdG9rZW4pO1xuXHR9KTtcblxuXHRjb25uZWN0aW9uLm9uUmVuYW1lUmVxdWVzdCgocmVuYW1lUGFyYW1ldGVycywgdG9rZW4pID0+IHtcblx0XHRyZXR1cm4gcnVuU2FmZUFzeW5jKHJ1bnRpbWUsIGFzeW5jICgpID0+IHtcblx0XHRcdGNvbnN0IGRvY3VtZW50ID0gZG9jdW1lbnRzLmdldChyZW5hbWVQYXJhbWV0ZXJzLnRleHREb2N1bWVudC51cmkpO1xuXHRcdFx0aWYgKGRvY3VtZW50KSB7XG5cdFx0XHRcdGF3YWl0IGRhdGFQcm92aWRlcnNSZWFkeTtcblx0XHRcdFx0Y29uc3Qgc3R5bGVzaGVldCA9IHN0eWxlc2hlZXRzLmdldChkb2N1bWVudCk7XG5cdFx0XHRcdHJldHVybiBnZXRMYW5ndWFnZVNlcnZpY2UoZG9jdW1lbnQpLmRvUmVuYW1lKGRvY3VtZW50LCByZW5hbWVQYXJhbWV0ZXJzLnBvc2l0aW9uLCByZW5hbWVQYXJhbWV0ZXJzLm5ld05hbWUsIHN0eWxlc2hlZXQpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0fSwgbnVsbCwgYEVycm9yIHdoaWxlIGNvbXB1dGluZyByZW5hbWVzIGZvciAke3JlbmFtZVBhcmFtZXRlcnMudGV4dERvY3VtZW50LnVyaX1gLCB0b2tlbik7XG5cdH0pO1xuXG5cdGNvbm5lY3Rpb24ub25Gb2xkaW5nUmFuZ2VzKChwYXJhbXMsIHRva2VuKSA9PiB7XG5cdFx0cmV0dXJuIHJ1blNhZmVBc3luYyhydW50aW1lLCBhc3luYyAoKSA9PiB7XG5cdFx0XHRjb25zdCBkb2N1bWVudCA9IGRvY3VtZW50cy5nZXQocGFyYW1zLnRleHREb2N1bWVudC51cmkpO1xuXHRcdFx0aWYgKGRvY3VtZW50KSB7XG5cdFx0XHRcdGF3YWl0IGRhdGFQcm92aWRlcnNSZWFkeTtcblx0XHRcdFx0cmV0dXJuIGdldExhbmd1YWdlU2VydmljZShkb2N1bWVudCkuZ2V0Rm9sZGluZ1Jhbmdlcyhkb2N1bWVudCwgeyByYW5nZUxpbWl0OiBmb2xkaW5nUmFuZ2VMaW1pdCB9KTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBudWxsO1xuXHRcdH0sIG51bGwsIGBFcnJvciB3aGlsZSBjb21wdXRpbmcgZm9sZGluZyByYW5nZXMgZm9yICR7cGFyYW1zLnRleHREb2N1bWVudC51cml9YCwgdG9rZW4pO1xuXHR9KTtcblxuXHRjb25uZWN0aW9uLm9uU2VsZWN0aW9uUmFuZ2VzKChwYXJhbXMsIHRva2VuKSA9PiB7XG5cdFx0cmV0dXJuIHJ1blNhZmVBc3luYyhydW50aW1lLCBhc3luYyAoKSA9PiB7XG5cdFx0XHRjb25zdCBkb2N1bWVudCA9IGRvY3VtZW50cy5nZXQocGFyYW1zLnRleHREb2N1bWVudC51cmkpO1xuXHRcdFx0Y29uc3QgcG9zaXRpb25zOiBQb3NpdGlvbltdID0gcGFyYW1zLnBvc2l0aW9ucztcblxuXHRcdFx0aWYgKGRvY3VtZW50KSB7XG5cdFx0XHRcdGF3YWl0IGRhdGFQcm92aWRlcnNSZWFkeTtcblx0XHRcdFx0Y29uc3Qgc3R5bGVzaGVldCA9IHN0eWxlc2hlZXRzLmdldChkb2N1bWVudCk7XG5cdFx0XHRcdHJldHVybiBnZXRMYW5ndWFnZVNlcnZpY2UoZG9jdW1lbnQpLmdldFNlbGVjdGlvblJhbmdlcyhkb2N1bWVudCwgcG9zaXRpb25zLCBzdHlsZXNoZWV0KTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBbXTtcblx0XHR9LCBbXSwgYEVycm9yIHdoaWxlIGNvbXB1dGluZyBzZWxlY3Rpb24gcmFuZ2VzIGZvciAke3BhcmFtcy50ZXh0RG9jdW1lbnQudXJpfWAsIHRva2VuKTtcblx0fSk7XG5cblx0YXN5bmMgZnVuY3Rpb24gb25Gb3JtYXQodGV4dERvY3VtZW50OiBUZXh0RG9jdW1lbnRJZGVudGlmaWVyLCByYW5nZTogUmFuZ2UgfCB1bmRlZmluZWQsIG9wdGlvbnM6IEZvcm1hdHRpbmdPcHRpb25zKTogUHJvbWlzZTxUZXh0RWRpdFtdPiB7XG5cdFx0Y29uc3QgZG9jdW1lbnQgPSBkb2N1bWVudHMuZ2V0KHRleHREb2N1bWVudC51cmkpO1xuXHRcdGlmIChkb2N1bWVudCkge1xuXHRcdFx0Y29uc3QgZWRpdHMgPSBnZXRMYW5ndWFnZVNlcnZpY2UoZG9jdW1lbnQpLmZvcm1hdChkb2N1bWVudCwgcmFuZ2UgPz8gZ2V0RnVsbFJhbmdlKGRvY3VtZW50KSwgb3B0aW9ucyk7XG5cdFx0XHRpZiAoZWRpdHMubGVuZ3RoID4gZm9ybWF0dGVyTWF4TnVtYmVyT2ZFZGl0cykge1xuXHRcdFx0XHRjb25zdCBuZXdUZXh0ID0gVGV4dERvY3VtZW50LmFwcGx5RWRpdHMoZG9jdW1lbnQsIGVkaXRzKTtcblx0XHRcdFx0cmV0dXJuIFtUZXh0RWRpdC5yZXBsYWNlKGdldEZ1bGxSYW5nZShkb2N1bWVudCksIG5ld1RleHQpXTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBlZGl0cztcblx0XHR9XG5cdFx0cmV0dXJuIFtdO1xuXHR9XG5cblx0Y29ubmVjdGlvbi5vbkRvY3VtZW50UmFuZ2VGb3JtYXR0aW5nKChmb3JtYXRQYXJhbXMsIHRva2VuKSA9PiB7XG5cdFx0cmV0dXJuIHJ1blNhZmVBc3luYyhydW50aW1lLCAoKSA9PiBvbkZvcm1hdChmb3JtYXRQYXJhbXMudGV4dERvY3VtZW50LCBmb3JtYXRQYXJhbXMucmFuZ2UsIGZvcm1hdFBhcmFtcy5vcHRpb25zKSwgW10sIGBFcnJvciB3aGlsZSBmb3JtYXR0aW5nIHJhbmdlIGZvciAke2Zvcm1hdFBhcmFtcy50ZXh0RG9jdW1lbnQudXJpfWAsIHRva2VuKTtcblx0fSk7XG5cblx0Y29ubmVjdGlvbi5vbkRvY3VtZW50Rm9ybWF0dGluZygoZm9ybWF0UGFyYW1zLCB0b2tlbikgPT4ge1xuXHRcdHJldHVybiBydW5TYWZlQXN5bmMocnVudGltZSwgKCkgPT4gb25Gb3JtYXQoZm9ybWF0UGFyYW1zLnRleHREb2N1bWVudCwgdW5kZWZpbmVkLCBmb3JtYXRQYXJhbXMub3B0aW9ucyksIFtdLCBgRXJyb3Igd2hpbGUgZm9ybWF0dGluZyAke2Zvcm1hdFBhcmFtcy50ZXh0RG9jdW1lbnQudXJpfWAsIHRva2VuKTtcblx0fSk7XG5cblx0Y29ubmVjdGlvbi5vbk5vdGlmaWNhdGlvbihDdXN0b21EYXRhQ2hhbmdlZE5vdGlmaWNhdGlvbi50eXBlLCB1cGRhdGVEYXRhUHJvdmlkZXJzKTtcblxuXHQvLyBMaXN0ZW4gb24gdGhlIGNvbm5lY3Rpb25cblx0Y29ubmVjdGlvbi5saXN0ZW4oKTtcblxufVxuXG5mdW5jdGlvbiBnZXRGdWxsUmFuZ2UoZG9jdW1lbnQ6IFRleHREb2N1bWVudCk6IFJhbmdlIHtcblx0cmV0dXJuIFJhbmdlLmNyZWF0ZShQb3NpdGlvbi5jcmVhdGUoMCwgMCksIGRvY3VtZW50LnBvc2l0aW9uQXQoZG9jdW1lbnQuZ2V0VGV4dCgpLmxlbmd0aCkpO1xufVxuIl19