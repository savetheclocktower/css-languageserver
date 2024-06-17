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
exports.registerDiagnosticsPullSupport = exports.registerDiagnosticsPushSupport = void 0;
const vscode_languageserver_1 = require("vscode-languageserver");
const runner_1 = require("./runner");
function registerDiagnosticsPushSupport(documents, connection, runtime, validate) {
    const pendingValidationRequests = {};
    const validationDelayMs = 500;
    const disposables = [];
    // The content of a text document has changed. This event is emitted
    // when the text document first opened or when its content has changed.
    documents.onDidChangeContent(change => {
        triggerValidation(change.document);
    }, undefined, disposables);
    // a document has closed: clear all diagnostics
    documents.onDidClose(event => {
        cleanPendingValidation(event.document);
        connection.sendDiagnostics({ uri: event.document.uri, diagnostics: [] });
    }, undefined, disposables);
    function cleanPendingValidation(textDocument) {
        const request = pendingValidationRequests[textDocument.uri];
        if (request) {
            request.dispose();
            delete pendingValidationRequests[textDocument.uri];
        }
    }
    function triggerValidation(textDocument) {
        cleanPendingValidation(textDocument);
        const request = pendingValidationRequests[textDocument.uri] = runtime.timer.setTimeout(() => __awaiter(this, void 0, void 0, function* () {
            if (request === pendingValidationRequests[textDocument.uri]) {
                try {
                    const diagnostics = yield validate(textDocument);
                    if (request === pendingValidationRequests[textDocument.uri]) {
                        connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
                    }
                    delete pendingValidationRequests[textDocument.uri];
                }
                catch (e) {
                    connection.console.error((0, runner_1.formatError)(`Error while validating ${textDocument.uri}`, e));
                }
            }
        }), validationDelayMs);
    }
    return {
        requestRefresh: () => {
            documents.all().forEach(triggerValidation);
        },
        dispose: () => {
            disposables.forEach(d => d.dispose());
            disposables.length = 0;
            const keys = Object.keys(pendingValidationRequests);
            for (const key of keys) {
                pendingValidationRequests[key].dispose();
                delete pendingValidationRequests[key];
            }
        }
    };
}
exports.registerDiagnosticsPushSupport = registerDiagnosticsPushSupport;
function registerDiagnosticsPullSupport(documents, connection, runtime, validate) {
    function newDocumentDiagnosticReport(diagnostics) {
        return {
            kind: vscode_languageserver_1.DocumentDiagnosticReportKind.Full,
            items: diagnostics
        };
    }
    const registration = connection.languages.diagnostics.on((params, token) => __awaiter(this, void 0, void 0, function* () {
        return (0, runner_1.runSafeAsync)(runtime, () => __awaiter(this, void 0, void 0, function* () {
            const document = documents.get(params.textDocument.uri);
            if (document) {
                return newDocumentDiagnosticReport(yield validate(document));
            }
            return newDocumentDiagnosticReport([]);
        }), newDocumentDiagnosticReport([]), `Error while computing diagnostics for ${params.textDocument.uri}`, token);
    }));
    function requestRefresh() {
        connection.languages.diagnostics.refresh();
    }
    return {
        requestRefresh,
        dispose: () => {
            registration.dispose();
        }
    };
}
exports.registerDiagnosticsPullSupport = registerDiagnosticsPullSupport;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFsaWRhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi91dGlscy92YWxpZGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7O0FBRWhHLGlFQUErTDtBQUUvTCxxQ0FBcUQ7QUFTckQsU0FBZ0IsOEJBQThCLENBQUMsU0FBc0MsRUFBRSxVQUFzQixFQUFFLE9BQTJCLEVBQUUsUUFBbUI7SUFFOUosTUFBTSx5QkFBeUIsR0FBa0MsRUFBRSxDQUFDO0lBQ3BFLE1BQU0saUJBQWlCLEdBQUcsR0FBRyxDQUFDO0lBRTlCLE1BQU0sV0FBVyxHQUFpQixFQUFFLENBQUM7SUFFckMsb0VBQW9FO0lBQ3BFLHVFQUF1RTtJQUN2RSxTQUFTLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLEVBQUU7UUFDckMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3BDLENBQUMsRUFBRSxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFFM0IsK0NBQStDO0lBQy9DLFNBQVMsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDNUIsc0JBQXNCLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3ZDLFVBQVUsQ0FBQyxlQUFlLENBQUMsRUFBRSxHQUFHLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsV0FBVyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDMUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUUzQixTQUFTLHNCQUFzQixDQUFDLFlBQTBCO1FBQ3pELE1BQU0sT0FBTyxHQUFHLHlCQUF5QixDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM1RCxJQUFJLE9BQU8sRUFBRSxDQUFDO1lBQ2IsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2xCLE9BQU8seUJBQXlCLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3BELENBQUM7SUFDRixDQUFDO0lBRUQsU0FBUyxpQkFBaUIsQ0FBQyxZQUEwQjtRQUNwRCxzQkFBc0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNyQyxNQUFNLE9BQU8sR0FBRyx5QkFBeUIsQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsR0FBUyxFQUFFO1lBQ2pHLElBQUksT0FBTyxLQUFLLHlCQUF5QixDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUM3RCxJQUFJLENBQUM7b0JBQ0osTUFBTSxXQUFXLEdBQUcsTUFBTSxRQUFRLENBQUMsWUFBWSxDQUFDLENBQUM7b0JBQ2pELElBQUksT0FBTyxLQUFLLHlCQUF5QixDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO3dCQUM3RCxVQUFVLENBQUMsZUFBZSxDQUFDLEVBQUUsR0FBRyxFQUFFLFlBQVksQ0FBQyxHQUFHLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQztvQkFDcEUsQ0FBQztvQkFDRCxPQUFPLHlCQUF5QixDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDcEQsQ0FBQztnQkFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO29CQUNaLFVBQVUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUEsb0JBQVcsRUFBQywwQkFBMEIsWUFBWSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hGLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQyxDQUFBLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztJQUN2QixDQUFDO0lBRUQsT0FBTztRQUNOLGNBQWMsRUFBRSxHQUFHLEVBQUU7WUFDcEIsU0FBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFDRCxPQUFPLEVBQUUsR0FBRyxFQUFFO1lBQ2IsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQ3RDLFdBQVcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQ3ZCLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMseUJBQXlCLENBQUMsQ0FBQztZQUNwRCxLQUFLLE1BQU0sR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO2dCQUN4Qix5QkFBeUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDekMsT0FBTyx5QkFBeUIsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN2QyxDQUFDO1FBQ0YsQ0FBQztLQUNELENBQUM7QUFDSCxDQUFDO0FBMURELHdFQTBEQztBQUVELFNBQWdCLDhCQUE4QixDQUFDLFNBQXNDLEVBQUUsVUFBc0IsRUFBRSxPQUEyQixFQUFFLFFBQW1CO0lBRTlKLFNBQVMsMkJBQTJCLENBQUMsV0FBeUI7UUFDN0QsT0FBTztZQUNOLElBQUksRUFBRSxvREFBNEIsQ0FBQyxJQUFJO1lBQ3ZDLEtBQUssRUFBRSxXQUFXO1NBQ2xCLENBQUM7SUFDSCxDQUFDO0lBRUQsTUFBTSxZQUFZLEdBQUcsVUFBVSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLENBQU8sTUFBZ0MsRUFBRSxLQUF3QixFQUFFLEVBQUU7UUFDN0gsT0FBTyxJQUFBLHFCQUFZLEVBQUMsT0FBTyxFQUFFLEdBQVMsRUFBRTtZQUN2QyxNQUFNLFFBQVEsR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDeEQsSUFBSSxRQUFRLEVBQUUsQ0FBQztnQkFDZCxPQUFPLDJCQUEyQixDQUFDLE1BQU0sUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDOUQsQ0FBQztZQUNELE9BQU8sMkJBQTJCLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFeEMsQ0FBQyxDQUFBLEVBQUUsMkJBQTJCLENBQUMsRUFBRSxDQUFDLEVBQUUseUNBQXlDLE1BQU0sQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDaEgsQ0FBQyxDQUFBLENBQUMsQ0FBQztJQUVILFNBQVMsY0FBYztRQUN0QixVQUFVLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUM1QyxDQUFDO0lBRUQsT0FBTztRQUNOLGNBQWM7UUFDZCxPQUFPLEVBQUUsR0FBRyxFQUFFO1lBQ2IsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3hCLENBQUM7S0FDRCxDQUFDO0FBRUgsQ0FBQztBQS9CRCx3RUErQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICogIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS4gU2VlIExpY2Vuc2UudHh0IGluIHRoZSBwcm9qZWN0IHJvb3QgZm9yIGxpY2Vuc2UgaW5mb3JtYXRpb24uXG4gKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuaW1wb3J0IHsgQ2FuY2VsbGF0aW9uVG9rZW4sIENvbm5lY3Rpb24sIERpYWdub3N0aWMsIERpc3Bvc2FibGUsIERvY3VtZW50RGlhZ25vc3RpY1BhcmFtcywgRG9jdW1lbnREaWFnbm9zdGljUmVwb3J0LCBEb2N1bWVudERpYWdub3N0aWNSZXBvcnRLaW5kLCBUZXh0RG9jdW1lbnRzIH0gZnJvbSAndnNjb2RlLWxhbmd1YWdlc2VydmVyJztcbmltcG9ydCB7IFRleHREb2N1bWVudCB9IGZyb20gJ3ZzY29kZS1jc3MtbGFuZ3VhZ2VzZXJ2aWNlJztcbmltcG9ydCB7IGZvcm1hdEVycm9yLCBydW5TYWZlQXN5bmMgfSBmcm9tICcuL3J1bm5lcic7XG5pbXBvcnQgeyBSdW50aW1lRW52aXJvbm1lbnQgfSBmcm9tICcuLi9tYWluJztcblxuZXhwb3J0IHR5cGUgVmFsaWRhdG9yID0gKHRleHREb2N1bWVudDogVGV4dERvY3VtZW50KSA9PiBQcm9taXNlPERpYWdub3N0aWNbXT47XG5leHBvcnQgdHlwZSBEaWFnbm9zdGljc1N1cHBvcnQgPSB7XG5cdGRpc3Bvc2UoKTogdm9pZDtcblx0cmVxdWVzdFJlZnJlc2goKTogdm9pZDtcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckRpYWdub3N0aWNzUHVzaFN1cHBvcnQoZG9jdW1lbnRzOiBUZXh0RG9jdW1lbnRzPFRleHREb2N1bWVudD4sIGNvbm5lY3Rpb246IENvbm5lY3Rpb24sIHJ1bnRpbWU6IFJ1bnRpbWVFbnZpcm9ubWVudCwgdmFsaWRhdGU6IFZhbGlkYXRvcik6IERpYWdub3N0aWNzU3VwcG9ydCB7XG5cblx0Y29uc3QgcGVuZGluZ1ZhbGlkYXRpb25SZXF1ZXN0czogeyBbdXJpOiBzdHJpbmddOiBEaXNwb3NhYmxlIH0gPSB7fTtcblx0Y29uc3QgdmFsaWRhdGlvbkRlbGF5TXMgPSA1MDA7XG5cblx0Y29uc3QgZGlzcG9zYWJsZXM6IERpc3Bvc2FibGVbXSA9IFtdO1xuXG5cdC8vIFRoZSBjb250ZW50IG9mIGEgdGV4dCBkb2N1bWVudCBoYXMgY2hhbmdlZC4gVGhpcyBldmVudCBpcyBlbWl0dGVkXG5cdC8vIHdoZW4gdGhlIHRleHQgZG9jdW1lbnQgZmlyc3Qgb3BlbmVkIG9yIHdoZW4gaXRzIGNvbnRlbnQgaGFzIGNoYW5nZWQuXG5cdGRvY3VtZW50cy5vbkRpZENoYW5nZUNvbnRlbnQoY2hhbmdlID0+IHtcblx0XHR0cmlnZ2VyVmFsaWRhdGlvbihjaGFuZ2UuZG9jdW1lbnQpO1xuXHR9LCB1bmRlZmluZWQsIGRpc3Bvc2FibGVzKTtcblxuXHQvLyBhIGRvY3VtZW50IGhhcyBjbG9zZWQ6IGNsZWFyIGFsbCBkaWFnbm9zdGljc1xuXHRkb2N1bWVudHMub25EaWRDbG9zZShldmVudCA9PiB7XG5cdFx0Y2xlYW5QZW5kaW5nVmFsaWRhdGlvbihldmVudC5kb2N1bWVudCk7XG5cdFx0Y29ubmVjdGlvbi5zZW5kRGlhZ25vc3RpY3MoeyB1cmk6IGV2ZW50LmRvY3VtZW50LnVyaSwgZGlhZ25vc3RpY3M6IFtdIH0pO1xuXHR9LCB1bmRlZmluZWQsIGRpc3Bvc2FibGVzKTtcblxuXHRmdW5jdGlvbiBjbGVhblBlbmRpbmdWYWxpZGF0aW9uKHRleHREb2N1bWVudDogVGV4dERvY3VtZW50KTogdm9pZCB7XG5cdFx0Y29uc3QgcmVxdWVzdCA9IHBlbmRpbmdWYWxpZGF0aW9uUmVxdWVzdHNbdGV4dERvY3VtZW50LnVyaV07XG5cdFx0aWYgKHJlcXVlc3QpIHtcblx0XHRcdHJlcXVlc3QuZGlzcG9zZSgpO1xuXHRcdFx0ZGVsZXRlIHBlbmRpbmdWYWxpZGF0aW9uUmVxdWVzdHNbdGV4dERvY3VtZW50LnVyaV07XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gdHJpZ2dlclZhbGlkYXRpb24odGV4dERvY3VtZW50OiBUZXh0RG9jdW1lbnQpOiB2b2lkIHtcblx0XHRjbGVhblBlbmRpbmdWYWxpZGF0aW9uKHRleHREb2N1bWVudCk7XG5cdFx0Y29uc3QgcmVxdWVzdCA9IHBlbmRpbmdWYWxpZGF0aW9uUmVxdWVzdHNbdGV4dERvY3VtZW50LnVyaV0gPSBydW50aW1lLnRpbWVyLnNldFRpbWVvdXQoYXN5bmMgKCkgPT4ge1xuXHRcdFx0aWYgKHJlcXVlc3QgPT09IHBlbmRpbmdWYWxpZGF0aW9uUmVxdWVzdHNbdGV4dERvY3VtZW50LnVyaV0pIHtcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRjb25zdCBkaWFnbm9zdGljcyA9IGF3YWl0IHZhbGlkYXRlKHRleHREb2N1bWVudCk7XG5cdFx0XHRcdFx0aWYgKHJlcXVlc3QgPT09IHBlbmRpbmdWYWxpZGF0aW9uUmVxdWVzdHNbdGV4dERvY3VtZW50LnVyaV0pIHtcblx0XHRcdFx0XHRcdGNvbm5lY3Rpb24uc2VuZERpYWdub3N0aWNzKHsgdXJpOiB0ZXh0RG9jdW1lbnQudXJpLCBkaWFnbm9zdGljcyB9KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZGVsZXRlIHBlbmRpbmdWYWxpZGF0aW9uUmVxdWVzdHNbdGV4dERvY3VtZW50LnVyaV07XG5cdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHRjb25uZWN0aW9uLmNvbnNvbGUuZXJyb3IoZm9ybWF0RXJyb3IoYEVycm9yIHdoaWxlIHZhbGlkYXRpbmcgJHt0ZXh0RG9jdW1lbnQudXJpfWAsIGUpKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0sIHZhbGlkYXRpb25EZWxheU1zKTtcblx0fVxuXG5cdHJldHVybiB7XG5cdFx0cmVxdWVzdFJlZnJlc2g6ICgpID0+IHtcblx0XHRcdGRvY3VtZW50cy5hbGwoKS5mb3JFYWNoKHRyaWdnZXJWYWxpZGF0aW9uKTtcblx0XHR9LFxuXHRcdGRpc3Bvc2U6ICgpID0+IHtcblx0XHRcdGRpc3Bvc2FibGVzLmZvckVhY2goZCA9PiBkLmRpc3Bvc2UoKSk7XG5cdFx0XHRkaXNwb3NhYmxlcy5sZW5ndGggPSAwO1xuXHRcdFx0Y29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKHBlbmRpbmdWYWxpZGF0aW9uUmVxdWVzdHMpO1xuXHRcdFx0Zm9yIChjb25zdCBrZXkgb2Yga2V5cykge1xuXHRcdFx0XHRwZW5kaW5nVmFsaWRhdGlvblJlcXVlc3RzW2tleV0uZGlzcG9zZSgpO1xuXHRcdFx0XHRkZWxldGUgcGVuZGluZ1ZhbGlkYXRpb25SZXF1ZXN0c1trZXldO1xuXHRcdFx0fVxuXHRcdH1cblx0fTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyRGlhZ25vc3RpY3NQdWxsU3VwcG9ydChkb2N1bWVudHM6IFRleHREb2N1bWVudHM8VGV4dERvY3VtZW50PiwgY29ubmVjdGlvbjogQ29ubmVjdGlvbiwgcnVudGltZTogUnVudGltZUVudmlyb25tZW50LCB2YWxpZGF0ZTogVmFsaWRhdG9yKTogRGlhZ25vc3RpY3NTdXBwb3J0IHtcblxuXHRmdW5jdGlvbiBuZXdEb2N1bWVudERpYWdub3N0aWNSZXBvcnQoZGlhZ25vc3RpY3M6IERpYWdub3N0aWNbXSk6IERvY3VtZW50RGlhZ25vc3RpY1JlcG9ydCB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGtpbmQ6IERvY3VtZW50RGlhZ25vc3RpY1JlcG9ydEtpbmQuRnVsbCxcblx0XHRcdGl0ZW1zOiBkaWFnbm9zdGljc1xuXHRcdH07XG5cdH1cblxuXHRjb25zdCByZWdpc3RyYXRpb24gPSBjb25uZWN0aW9uLmxhbmd1YWdlcy5kaWFnbm9zdGljcy5vbihhc3luYyAocGFyYW1zOiBEb2N1bWVudERpYWdub3N0aWNQYXJhbXMsIHRva2VuOiBDYW5jZWxsYXRpb25Ub2tlbikgPT4ge1xuXHRcdHJldHVybiBydW5TYWZlQXN5bmMocnVudGltZSwgYXN5bmMgKCkgPT4ge1xuXHRcdFx0Y29uc3QgZG9jdW1lbnQgPSBkb2N1bWVudHMuZ2V0KHBhcmFtcy50ZXh0RG9jdW1lbnQudXJpKTtcblx0XHRcdGlmIChkb2N1bWVudCkge1xuXHRcdFx0XHRyZXR1cm4gbmV3RG9jdW1lbnREaWFnbm9zdGljUmVwb3J0KGF3YWl0IHZhbGlkYXRlKGRvY3VtZW50KSk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gbmV3RG9jdW1lbnREaWFnbm9zdGljUmVwb3J0KFtdKTtcblxuXHRcdH0sIG5ld0RvY3VtZW50RGlhZ25vc3RpY1JlcG9ydChbXSksIGBFcnJvciB3aGlsZSBjb21wdXRpbmcgZGlhZ25vc3RpY3MgZm9yICR7cGFyYW1zLnRleHREb2N1bWVudC51cml9YCwgdG9rZW4pO1xuXHR9KTtcblxuXHRmdW5jdGlvbiByZXF1ZXN0UmVmcmVzaCgpOiB2b2lkIHtcblx0XHRjb25uZWN0aW9uLmxhbmd1YWdlcy5kaWFnbm9zdGljcy5yZWZyZXNoKCk7XG5cdH1cblxuXHRyZXR1cm4ge1xuXHRcdHJlcXVlc3RSZWZyZXNoLFxuXHRcdGRpc3Bvc2U6ICgpID0+IHtcblx0XHRcdHJlZ2lzdHJhdGlvbi5kaXNwb3NlKCk7XG5cdFx0fVxuXHR9O1xuXG59XG4iXX0=