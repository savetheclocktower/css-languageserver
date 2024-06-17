"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("vscode-languageserver/node");
const runner_1 = require("./utils/runner");
const main_1 = require("./main");
const nodeFs_1 = require("./node/nodeFs");
// Create a connection for the server.
const connection = (0, node_1.createConnection)();
console.log = connection.console.log.bind(connection.console);
console.error = connection.console.error.bind(connection.console);
process.on('unhandledRejection', (e) => {
    connection.console.error((0, runner_1.formatError)(`Unhandled exception`, e));
});
const runtime = {
    timer: {
        setImmediate(callback, ...args) {
            const handle = setImmediate(callback, ...args);
            return { dispose: () => clearImmediate(handle) };
        },
        setTimeout(callback, ms, ...args) {
            const handle = setTimeout(callback, ms, ...args);
            return { dispose: () => clearTimeout(handle) };
        }
    },
    file: (0, nodeFs_1.getNodeFSRequestService)()
};
(0, main_1.startServer)(connection, runtime);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL3NlcnZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztnR0FHZ0c7O0FBRWhHLHFEQUFzRjtBQUN0RiwyQ0FBNkM7QUFDN0MsaUNBQXlEO0FBQ3pELDBDQUF3RDtBQUV4RCxzQ0FBc0M7QUFDdEMsTUFBTSxVQUFVLEdBQWUsSUFBQSx1QkFBZ0IsR0FBRSxDQUFDO0FBRWxELE9BQU8sQ0FBQyxHQUFHLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUM5RCxPQUFPLENBQUMsS0FBSyxHQUFHLFVBQVUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7QUFFbEUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLENBQU0sRUFBRSxFQUFFO0lBQzNDLFVBQVUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUEsb0JBQVcsRUFBQyxxQkFBcUIsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2pFLENBQUMsQ0FBQyxDQUFDO0FBRUgsTUFBTSxPQUFPLEdBQXVCO0lBQ25DLEtBQUssRUFBRTtRQUNOLFlBQVksQ0FBQyxRQUFrQyxFQUFFLEdBQUcsSUFBVztZQUM5RCxNQUFNLE1BQU0sR0FBRyxZQUFZLENBQUMsUUFBUSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7WUFDL0MsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztRQUNsRCxDQUFDO1FBQ0QsVUFBVSxDQUFDLFFBQWtDLEVBQUUsRUFBVSxFQUFFLEdBQUcsSUFBVztZQUN4RSxNQUFNLE1BQU0sR0FBRyxVQUFVLENBQUMsUUFBUSxFQUFFLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDO1lBQ2pELE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7UUFDaEQsQ0FBQztLQUNEO0lBQ0QsSUFBSSxFQUFFLElBQUEsZ0NBQXVCLEdBQUU7Q0FDL0IsQ0FBQztBQUVGLElBQUEsa0JBQVcsRUFBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICogIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS4gU2VlIExpY2Vuc2UudHh0IGluIHRoZSBwcm9qZWN0IHJvb3QgZm9yIGxpY2Vuc2UgaW5mb3JtYXRpb24uXG4gKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuaW1wb3J0IHsgY3JlYXRlQ29ubmVjdGlvbiwgQ29ubmVjdGlvbiwgRGlzcG9zYWJsZSB9IGZyb20gJ3ZzY29kZS1sYW5ndWFnZXNlcnZlci9ub2RlJztcbmltcG9ydCB7IGZvcm1hdEVycm9yIH0gZnJvbSAnLi91dGlscy9ydW5uZXInO1xuaW1wb3J0IHsgUnVudGltZUVudmlyb25tZW50LCBzdGFydFNlcnZlciB9IGZyb20gJy4vbWFpbic7XG5pbXBvcnQgeyBnZXROb2RlRlNSZXF1ZXN0U2VydmljZSB9IGZyb20gJy4vbm9kZS9ub2RlRnMnO1xuXG4vLyBDcmVhdGUgYSBjb25uZWN0aW9uIGZvciB0aGUgc2VydmVyLlxuY29uc3QgY29ubmVjdGlvbjogQ29ubmVjdGlvbiA9IGNyZWF0ZUNvbm5lY3Rpb24oKTtcblxuY29uc29sZS5sb2cgPSBjb25uZWN0aW9uLmNvbnNvbGUubG9nLmJpbmQoY29ubmVjdGlvbi5jb25zb2xlKTtcbmNvbnNvbGUuZXJyb3IgPSBjb25uZWN0aW9uLmNvbnNvbGUuZXJyb3IuYmluZChjb25uZWN0aW9uLmNvbnNvbGUpO1xuXG5wcm9jZXNzLm9uKCd1bmhhbmRsZWRSZWplY3Rpb24nLCAoZTogYW55KSA9PiB7XG5cdGNvbm5lY3Rpb24uY29uc29sZS5lcnJvcihmb3JtYXRFcnJvcihgVW5oYW5kbGVkIGV4Y2VwdGlvbmAsIGUpKTtcbn0pO1xuXG5jb25zdCBydW50aW1lOiBSdW50aW1lRW52aXJvbm1lbnQgPSB7XG5cdHRpbWVyOiB7XG5cdFx0c2V0SW1tZWRpYXRlKGNhbGxiYWNrOiAoLi4uYXJnczogYW55W10pID0+IHZvaWQsIC4uLmFyZ3M6IGFueVtdKTogRGlzcG9zYWJsZSB7XG5cdFx0XHRjb25zdCBoYW5kbGUgPSBzZXRJbW1lZGlhdGUoY2FsbGJhY2ssIC4uLmFyZ3MpO1xuXHRcdFx0cmV0dXJuIHsgZGlzcG9zZTogKCkgPT4gY2xlYXJJbW1lZGlhdGUoaGFuZGxlKSB9O1xuXHRcdH0sXG5cdFx0c2V0VGltZW91dChjYWxsYmFjazogKC4uLmFyZ3M6IGFueVtdKSA9PiB2b2lkLCBtczogbnVtYmVyLCAuLi5hcmdzOiBhbnlbXSk6IERpc3Bvc2FibGUge1xuXHRcdFx0Y29uc3QgaGFuZGxlID0gc2V0VGltZW91dChjYWxsYmFjaywgbXMsIC4uLmFyZ3MpO1xuXHRcdFx0cmV0dXJuIHsgZGlzcG9zZTogKCkgPT4gY2xlYXJUaW1lb3V0KGhhbmRsZSkgfTtcblx0XHR9XG5cdH0sXG5cdGZpbGU6IGdldE5vZGVGU1JlcXVlc3RTZXJ2aWNlKClcbn07XG5cbnN0YXJ0U2VydmVyKGNvbm5lY3Rpb24sIHJ1bnRpbWUpO1xuIl19