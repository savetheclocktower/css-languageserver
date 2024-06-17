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
exports.fetchDataProviders = void 0;
const vscode_css_languageservice_1 = require("vscode-css-languageservice");
function fetchDataProviders(dataPaths, requestService) {
    const providers = dataPaths.map((p) => __awaiter(this, void 0, void 0, function* () {
        try {
            const content = yield requestService.getContent(p);
            return parseCSSData(content);
        }
        catch (e) {
            return (0, vscode_css_languageservice_1.newCSSDataProvider)({ version: 1 });
        }
    }));
    return Promise.all(providers);
}
exports.fetchDataProviders = fetchDataProviders;
function parseCSSData(source) {
    let rawData;
    try {
        rawData = JSON.parse(source);
    }
    catch (err) {
        return (0, vscode_css_languageservice_1.newCSSDataProvider)({ version: 1 });
    }
    return (0, vscode_css_languageservice_1.newCSSDataProvider)({
        version: rawData.version || 1,
        properties: rawData.properties || [],
        atDirectives: rawData.atDirectives || [],
        pseudoClasses: rawData.pseudoClasses || [],
        pseudoElements: rawData.pseudoElements || []
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3VzdG9tRGF0YS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL2xpYi9jdXN0b21EYXRhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7O0FBRWhHLDJFQUFrRjtBQUdsRixTQUFnQixrQkFBa0IsQ0FBQyxTQUFtQixFQUFFLGNBQThCO0lBQ3JGLE1BQU0sU0FBUyxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBTSxDQUFDLEVBQUMsRUFBRTtRQUN6QyxJQUFJLENBQUM7WUFDSixNQUFNLE9BQU8sR0FBRyxNQUFNLGNBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbkQsT0FBTyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDOUIsQ0FBQztRQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDWixPQUFPLElBQUEsK0NBQWtCLEVBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUMzQyxDQUFDO0lBQ0YsQ0FBQyxDQUFBLENBQUMsQ0FBQztJQUVILE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUMvQixDQUFDO0FBWEQsZ0RBV0M7QUFFRCxTQUFTLFlBQVksQ0FBQyxNQUFjO0lBQ25DLElBQUksT0FBWSxDQUFDO0lBRWpCLElBQUksQ0FBQztRQUNKLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzlCLENBQUM7SUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBQ2QsT0FBTyxJQUFBLCtDQUFrQixFQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDM0MsQ0FBQztJQUVELE9BQU8sSUFBQSwrQ0FBa0IsRUFBQztRQUN6QixPQUFPLEVBQUUsT0FBTyxDQUFDLE9BQU8sSUFBSSxDQUFDO1FBQzdCLFVBQVUsRUFBRSxPQUFPLENBQUMsVUFBVSxJQUFJLEVBQUU7UUFDcEMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxZQUFZLElBQUksRUFBRTtRQUN4QyxhQUFhLEVBQUUsT0FBTyxDQUFDLGFBQWEsSUFBSSxFQUFFO1FBQzFDLGNBQWMsRUFBRSxPQUFPLENBQUMsY0FBYyxJQUFJLEVBQUU7S0FDNUMsQ0FBQyxDQUFDO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiAgQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLiBTZWUgTGljZW5zZS50eHQgaW4gdGhlIHByb2plY3Qgcm9vdCBmb3IgbGljZW5zZSBpbmZvcm1hdGlvbi5cbiAqLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5pbXBvcnQgeyBJQ1NTRGF0YVByb3ZpZGVyLCBuZXdDU1NEYXRhUHJvdmlkZXIgfSBmcm9tICd2c2NvZGUtY3NzLWxhbmd1YWdlc2VydmljZSc7XG5pbXBvcnQgeyBSZXF1ZXN0U2VydmljZSB9IGZyb20gJy4vcmVxdWVzdHMnO1xuXG5leHBvcnQgZnVuY3Rpb24gZmV0Y2hEYXRhUHJvdmlkZXJzKGRhdGFQYXRoczogc3RyaW5nW10sIHJlcXVlc3RTZXJ2aWNlOiBSZXF1ZXN0U2VydmljZSk6IFByb21pc2U8SUNTU0RhdGFQcm92aWRlcltdPiB7XG5cdGNvbnN0IHByb3ZpZGVycyA9IGRhdGFQYXRocy5tYXAoYXN5bmMgcCA9PiB7XG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IGNvbnRlbnQgPSBhd2FpdCByZXF1ZXN0U2VydmljZS5nZXRDb250ZW50KHApO1xuXHRcdFx0cmV0dXJuIHBhcnNlQ1NTRGF0YShjb250ZW50KTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRyZXR1cm4gbmV3Q1NTRGF0YVByb3ZpZGVyKHsgdmVyc2lvbjogMSB9KTtcblx0XHR9XG5cdH0pO1xuXG5cdHJldHVybiBQcm9taXNlLmFsbChwcm92aWRlcnMpO1xufVxuXG5mdW5jdGlvbiBwYXJzZUNTU0RhdGEoc291cmNlOiBzdHJpbmcpOiBJQ1NTRGF0YVByb3ZpZGVyIHtcblx0bGV0IHJhd0RhdGE6IGFueTtcblxuXHR0cnkge1xuXHRcdHJhd0RhdGEgPSBKU09OLnBhcnNlKHNvdXJjZSk7XG5cdH0gY2F0Y2ggKGVycikge1xuXHRcdHJldHVybiBuZXdDU1NEYXRhUHJvdmlkZXIoeyB2ZXJzaW9uOiAxIH0pO1xuXHR9XG5cblx0cmV0dXJuIG5ld0NTU0RhdGFQcm92aWRlcih7XG5cdFx0dmVyc2lvbjogcmF3RGF0YS52ZXJzaW9uIHx8IDEsXG5cdFx0cHJvcGVydGllczogcmF3RGF0YS5wcm9wZXJ0aWVzIHx8IFtdLFxuXHRcdGF0RGlyZWN0aXZlczogcmF3RGF0YS5hdERpcmVjdGl2ZXMgfHwgW10sXG5cdFx0cHNldWRvQ2xhc3NlczogcmF3RGF0YS5wc2V1ZG9DbGFzc2VzIHx8IFtdLFxuXHRcdHBzZXVkb0VsZW1lbnRzOiByYXdEYXRhLnBzZXVkb0VsZW1lbnRzIHx8IFtdXG5cdH0pO1xufVxuIl19