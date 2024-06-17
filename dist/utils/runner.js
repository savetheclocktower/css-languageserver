"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSafeAsync = exports.formatError = void 0;
const vscode_languageserver_1 = require("vscode-languageserver");
function formatError(message, err) {
    if (err instanceof Error) {
        const error = err;
        return `${message}: ${error.message}\n${error.stack}`;
    }
    else if (typeof err === 'string') {
        return `${message}: ${err}`;
    }
    else if (err) {
        return `${message}: ${err.toString()}`;
    }
    return message;
}
exports.formatError = formatError;
function runSafeAsync(runtime, func, errorVal, errorMessage, token) {
    return new Promise((resolve) => {
        runtime.timer.setImmediate(() => {
            if (token.isCancellationRequested) {
                resolve(cancelValue());
                return;
            }
            return func().then(result => {
                if (token.isCancellationRequested) {
                    resolve(cancelValue());
                    return;
                }
                else {
                    resolve(result);
                }
            }, e => {
                console.error(formatError(errorMessage, e));
                resolve(errorVal);
            });
        });
    });
}
exports.runSafeAsync = runSafeAsync;
function cancelValue() {
    return new vscode_languageserver_1.ResponseError(vscode_languageserver_1.LSPErrorCodes.RequestCancelled, 'Request cancelled');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVubmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL3V0aWxzL3J1bm5lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztnR0FHZ0c7OztBQUVoRyxpRUFBd0Y7QUFHeEYsU0FBZ0IsV0FBVyxDQUFDLE9BQWUsRUFBRSxHQUFRO0lBQ3BELElBQUksR0FBRyxZQUFZLEtBQUssRUFBRSxDQUFDO1FBQzFCLE1BQU0sS0FBSyxHQUFVLEdBQUcsQ0FBQztRQUN6QixPQUFPLEdBQUcsT0FBTyxLQUFLLEtBQUssQ0FBQyxPQUFPLEtBQUssS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ3ZELENBQUM7U0FBTSxJQUFJLE9BQU8sR0FBRyxLQUFLLFFBQVEsRUFBRSxDQUFDO1FBQ3BDLE9BQU8sR0FBRyxPQUFPLEtBQUssR0FBRyxFQUFFLENBQUM7SUFDN0IsQ0FBQztTQUFNLElBQUksR0FBRyxFQUFFLENBQUM7UUFDaEIsT0FBTyxHQUFHLE9BQU8sS0FBSyxHQUFHLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQztJQUN4QyxDQUFDO0lBQ0QsT0FBTyxPQUFPLENBQUM7QUFDaEIsQ0FBQztBQVZELGtDQVVDO0FBRUQsU0FBZ0IsWUFBWSxDQUFJLE9BQTJCLEVBQUUsSUFBdUIsRUFBRSxRQUFXLEVBQUUsWUFBb0IsRUFBRSxLQUF3QjtJQUNoSixPQUFPLElBQUksT0FBTyxDQUF5QixDQUFDLE9BQU8sRUFBRSxFQUFFO1FBQ3RELE9BQU8sQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRTtZQUMvQixJQUFJLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO2dCQUNuQyxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztnQkFDdkIsT0FBTztZQUNSLENBQUM7WUFDRCxPQUFPLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDM0IsSUFBSSxLQUFLLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztvQkFDbkMsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7b0JBQ3ZCLE9BQU87Z0JBQ1IsQ0FBQztxQkFBTSxDQUFDO29CQUNQLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDakIsQ0FBQztZQUNGLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRTtnQkFDTixPQUFPLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDNUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ25CLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQztBQUNKLENBQUM7QUFwQkQsb0NBb0JDO0FBRUQsU0FBUyxXQUFXO0lBQ25CLE9BQU8sSUFBSSxxQ0FBYSxDQUFJLHFDQUFhLENBQUMsZ0JBQWdCLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztBQUNsRixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqICBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuIFNlZSBMaWNlbnNlLnR4dCBpbiB0aGUgcHJvamVjdCByb290IGZvciBsaWNlbnNlIGluZm9ybWF0aW9uLlxuICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbmltcG9ydCB7IFJlc3BvbnNlRXJyb3IsIENhbmNlbGxhdGlvblRva2VuLCBMU1BFcnJvckNvZGVzIH0gZnJvbSAndnNjb2RlLWxhbmd1YWdlc2VydmVyJztcbmltcG9ydCB7IFJ1bnRpbWVFbnZpcm9ubWVudCB9IGZyb20gJy4uL21haW4nO1xuXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0RXJyb3IobWVzc2FnZTogc3RyaW5nLCBlcnI6IGFueSk6IHN0cmluZyB7XG5cdGlmIChlcnIgaW5zdGFuY2VvZiBFcnJvcikge1xuXHRcdGNvbnN0IGVycm9yID0gPEVycm9yPmVycjtcblx0XHRyZXR1cm4gYCR7bWVzc2FnZX06ICR7ZXJyb3IubWVzc2FnZX1cXG4ke2Vycm9yLnN0YWNrfWA7XG5cdH0gZWxzZSBpZiAodHlwZW9mIGVyciA9PT0gJ3N0cmluZycpIHtcblx0XHRyZXR1cm4gYCR7bWVzc2FnZX06ICR7ZXJyfWA7XG5cdH0gZWxzZSBpZiAoZXJyKSB7XG5cdFx0cmV0dXJuIGAke21lc3NhZ2V9OiAke2Vyci50b1N0cmluZygpfWA7XG5cdH1cblx0cmV0dXJuIG1lc3NhZ2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBydW5TYWZlQXN5bmM8VD4ocnVudGltZTogUnVudGltZUVudmlyb25tZW50LCBmdW5jOiAoKSA9PiBUaGVuYWJsZTxUPiwgZXJyb3JWYWw6IFQsIGVycm9yTWVzc2FnZTogc3RyaW5nLCB0b2tlbjogQ2FuY2VsbGF0aW9uVG9rZW4pOiBUaGVuYWJsZTxUIHwgUmVzcG9uc2VFcnJvcjxhbnk+PiB7XG5cdHJldHVybiBuZXcgUHJvbWlzZTxUIHwgUmVzcG9uc2VFcnJvcjxhbnk+PigocmVzb2x2ZSkgPT4ge1xuXHRcdHJ1bnRpbWUudGltZXIuc2V0SW1tZWRpYXRlKCgpID0+IHtcblx0XHRcdGlmICh0b2tlbi5pc0NhbmNlbGxhdGlvblJlcXVlc3RlZCkge1xuXHRcdFx0XHRyZXNvbHZlKGNhbmNlbFZhbHVlKCkpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gZnVuYygpLnRoZW4ocmVzdWx0ID0+IHtcblx0XHRcdFx0aWYgKHRva2VuLmlzQ2FuY2VsbGF0aW9uUmVxdWVzdGVkKSB7XG5cdFx0XHRcdFx0cmVzb2x2ZShjYW5jZWxWYWx1ZSgpKTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmVzb2x2ZShyZXN1bHQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9LCBlID0+IHtcblx0XHRcdFx0Y29uc29sZS5lcnJvcihmb3JtYXRFcnJvcihlcnJvck1lc3NhZ2UsIGUpKTtcblx0XHRcdFx0cmVzb2x2ZShlcnJvclZhbCk7XG5cdFx0XHR9KTtcblx0XHR9KTtcblx0fSk7XG59XG5cbmZ1bmN0aW9uIGNhbmNlbFZhbHVlPEU+KCkge1xuXHRyZXR1cm4gbmV3IFJlc3BvbnNlRXJyb3I8RT4oTFNQRXJyb3JDb2Rlcy5SZXF1ZXN0Q2FuY2VsbGVkLCAnUmVxdWVzdCBjYW5jZWxsZWQnKTtcbn1cbiJdfQ==