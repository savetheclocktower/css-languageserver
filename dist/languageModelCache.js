"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLanguageModelCache = void 0;
function getLanguageModelCache(maxEntries, cleanupIntervalTimeInSec, parse) {
    let languageModels = {};
    let nModels = 0;
    let cleanupInterval = undefined;
    if (cleanupIntervalTimeInSec > 0) {
        cleanupInterval = setInterval(() => {
            const cutoffTime = Date.now() - cleanupIntervalTimeInSec * 1000;
            const uris = Object.keys(languageModels);
            for (const uri of uris) {
                const languageModelInfo = languageModels[uri];
                if (languageModelInfo.cTime < cutoffTime) {
                    delete languageModels[uri];
                    nModels--;
                }
            }
        }, cleanupIntervalTimeInSec * 1000);
    }
    return {
        get(document) {
            const version = document.version;
            const languageId = document.languageId;
            const languageModelInfo = languageModels[document.uri];
            if (languageModelInfo && languageModelInfo.version === version && languageModelInfo.languageId === languageId) {
                languageModelInfo.cTime = Date.now();
                return languageModelInfo.languageModel;
            }
            const languageModel = parse(document);
            languageModels[document.uri] = { languageModel, version, languageId, cTime: Date.now() };
            if (!languageModelInfo) {
                nModels++;
            }
            if (nModels === maxEntries) {
                let oldestTime = Number.MAX_VALUE;
                let oldestUri = null;
                for (const uri in languageModels) {
                    const languageModelInfo = languageModels[uri];
                    if (languageModelInfo.cTime < oldestTime) {
                        oldestUri = uri;
                        oldestTime = languageModelInfo.cTime;
                    }
                }
                if (oldestUri) {
                    delete languageModels[oldestUri];
                    nModels--;
                }
            }
            return languageModel;
        },
        onDocumentRemoved(document) {
            const uri = document.uri;
            if (languageModels[uri]) {
                delete languageModels[uri];
                nModels--;
            }
        },
        dispose() {
            if (typeof cleanupInterval !== 'undefined') {
                clearInterval(cleanupInterval);
                cleanupInterval = undefined;
                languageModels = {};
                nModels = 0;
            }
        }
    };
}
exports.getLanguageModelCache = getLanguageModelCache;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VNb2RlbENhY2hlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL2xhbmd1YWdlTW9kZWxDYWNoZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztnR0FHZ0c7OztBQVVoRyxTQUFnQixxQkFBcUIsQ0FBSSxVQUFrQixFQUFFLHdCQUFnQyxFQUFFLEtBQW9DO0lBQ2xJLElBQUksY0FBYyxHQUFnRyxFQUFFLENBQUM7SUFDckgsSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFDO0lBRWhCLElBQUksZUFBZSxHQUErQixTQUFTLENBQUM7SUFDNUQsSUFBSSx3QkFBd0IsR0FBRyxDQUFDLEVBQUUsQ0FBQztRQUNsQyxlQUFlLEdBQUcsV0FBVyxDQUFDLEdBQUcsRUFBRTtZQUNsQyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsd0JBQXdCLEdBQUcsSUFBSSxDQUFDO1lBQ2hFLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDekMsS0FBSyxNQUFNLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQztnQkFDeEIsTUFBTSxpQkFBaUIsR0FBRyxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQzlDLElBQUksaUJBQWlCLENBQUMsS0FBSyxHQUFHLFVBQVUsRUFBRSxDQUFDO29CQUMxQyxPQUFPLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDM0IsT0FBTyxFQUFFLENBQUM7Z0JBQ1gsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDLEVBQUUsd0JBQXdCLEdBQUcsSUFBSSxDQUFDLENBQUM7SUFDckMsQ0FBQztJQUVELE9BQU87UUFDTixHQUFHLENBQUMsUUFBc0I7WUFDekIsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQztZQUNqQyxNQUFNLFVBQVUsR0FBRyxRQUFRLENBQUMsVUFBVSxDQUFDO1lBQ3ZDLE1BQU0saUJBQWlCLEdBQUcsY0FBYyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN2RCxJQUFJLGlCQUFpQixJQUFJLGlCQUFpQixDQUFDLE9BQU8sS0FBSyxPQUFPLElBQUksaUJBQWlCLENBQUMsVUFBVSxLQUFLLFVBQVUsRUFBRSxDQUFDO2dCQUMvRyxpQkFBaUIsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUNyQyxPQUFPLGlCQUFpQixDQUFDLGFBQWEsQ0FBQztZQUN4QyxDQUFDO1lBQ0QsTUFBTSxhQUFhLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3RDLGNBQWMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxhQUFhLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUM7WUFDekYsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7Z0JBQ3hCLE9BQU8sRUFBRSxDQUFDO1lBQ1gsQ0FBQztZQUVELElBQUksT0FBTyxLQUFLLFVBQVUsRUFBRSxDQUFDO2dCQUM1QixJQUFJLFVBQVUsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDO2dCQUNsQyxJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUM7Z0JBQ3JCLEtBQUssTUFBTSxHQUFHLElBQUksY0FBYyxFQUFFLENBQUM7b0JBQ2xDLE1BQU0saUJBQWlCLEdBQUcsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUM5QyxJQUFJLGlCQUFpQixDQUFDLEtBQUssR0FBRyxVQUFVLEVBQUUsQ0FBQzt3QkFDMUMsU0FBUyxHQUFHLEdBQUcsQ0FBQzt3QkFDaEIsVUFBVSxHQUFHLGlCQUFpQixDQUFDLEtBQUssQ0FBQztvQkFDdEMsQ0FBQztnQkFDRixDQUFDO2dCQUNELElBQUksU0FBUyxFQUFFLENBQUM7b0JBQ2YsT0FBTyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBQ2pDLE9BQU8sRUFBRSxDQUFDO2dCQUNYLENBQUM7WUFDRixDQUFDO1lBQ0QsT0FBTyxhQUFhLENBQUM7UUFFdEIsQ0FBQztRQUNELGlCQUFpQixDQUFDLFFBQXNCO1lBQ3ZDLE1BQU0sR0FBRyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUM7WUFDekIsSUFBSSxjQUFjLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDekIsT0FBTyxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQzNCLE9BQU8sRUFBRSxDQUFDO1lBQ1gsQ0FBQztRQUNGLENBQUM7UUFDRCxPQUFPO1lBQ04sSUFBSSxPQUFPLGVBQWUsS0FBSyxXQUFXLEVBQUUsQ0FBQztnQkFDNUMsYUFBYSxDQUFDLGVBQWUsQ0FBQyxDQUFDO2dCQUMvQixlQUFlLEdBQUcsU0FBUyxDQUFDO2dCQUM1QixjQUFjLEdBQUcsRUFBRSxDQUFDO2dCQUNwQixPQUFPLEdBQUcsQ0FBQyxDQUFDO1lBQ2IsQ0FBQztRQUNGLENBQUM7S0FDRCxDQUFDO0FBQ0gsQ0FBQztBQXBFRCxzREFvRUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICogIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS4gU2VlIExpY2Vuc2UudHh0IGluIHRoZSBwcm9qZWN0IHJvb3QgZm9yIGxpY2Vuc2UgaW5mb3JtYXRpb24uXG4gKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuaW1wb3J0IHsgVGV4dERvY3VtZW50IH0gZnJvbSAndnNjb2RlLWNzcy1sYW5ndWFnZXNlcnZpY2UnO1xuXG5leHBvcnQgaW50ZXJmYWNlIExhbmd1YWdlTW9kZWxDYWNoZTxUPiB7XG5cdGdldChkb2N1bWVudDogVGV4dERvY3VtZW50KTogVDtcblx0b25Eb2N1bWVudFJlbW92ZWQoZG9jdW1lbnQ6IFRleHREb2N1bWVudCk6IHZvaWQ7XG5cdGRpc3Bvc2UoKTogdm9pZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldExhbmd1YWdlTW9kZWxDYWNoZTxUPihtYXhFbnRyaWVzOiBudW1iZXIsIGNsZWFudXBJbnRlcnZhbFRpbWVJblNlYzogbnVtYmVyLCBwYXJzZTogKGRvY3VtZW50OiBUZXh0RG9jdW1lbnQpID0+IFQpOiBMYW5ndWFnZU1vZGVsQ2FjaGU8VD4ge1xuXHRsZXQgbGFuZ3VhZ2VNb2RlbHM6IHsgW3VyaTogc3RyaW5nXTogeyB2ZXJzaW9uOiBudW1iZXI7IGxhbmd1YWdlSWQ6IHN0cmluZzsgY1RpbWU6IG51bWJlcjsgbGFuZ3VhZ2VNb2RlbDogVCB9IH0gPSB7fTtcblx0bGV0IG5Nb2RlbHMgPSAwO1xuXG5cdGxldCBjbGVhbnVwSW50ZXJ2YWw6IE5vZGVKUy5UaW1lb3V0IHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuXHRpZiAoY2xlYW51cEludGVydmFsVGltZUluU2VjID4gMCkge1xuXHRcdGNsZWFudXBJbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHtcblx0XHRcdGNvbnN0IGN1dG9mZlRpbWUgPSBEYXRlLm5vdygpIC0gY2xlYW51cEludGVydmFsVGltZUluU2VjICogMTAwMDtcblx0XHRcdGNvbnN0IHVyaXMgPSBPYmplY3Qua2V5cyhsYW5ndWFnZU1vZGVscyk7XG5cdFx0XHRmb3IgKGNvbnN0IHVyaSBvZiB1cmlzKSB7XG5cdFx0XHRcdGNvbnN0IGxhbmd1YWdlTW9kZWxJbmZvID0gbGFuZ3VhZ2VNb2RlbHNbdXJpXTtcblx0XHRcdFx0aWYgKGxhbmd1YWdlTW9kZWxJbmZvLmNUaW1lIDwgY3V0b2ZmVGltZSkge1xuXHRcdFx0XHRcdGRlbGV0ZSBsYW5ndWFnZU1vZGVsc1t1cmldO1xuXHRcdFx0XHRcdG5Nb2RlbHMtLTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0sIGNsZWFudXBJbnRlcnZhbFRpbWVJblNlYyAqIDEwMDApO1xuXHR9XG5cblx0cmV0dXJuIHtcblx0XHRnZXQoZG9jdW1lbnQ6IFRleHREb2N1bWVudCk6IFQge1xuXHRcdFx0Y29uc3QgdmVyc2lvbiA9IGRvY3VtZW50LnZlcnNpb247XG5cdFx0XHRjb25zdCBsYW5ndWFnZUlkID0gZG9jdW1lbnQubGFuZ3VhZ2VJZDtcblx0XHRcdGNvbnN0IGxhbmd1YWdlTW9kZWxJbmZvID0gbGFuZ3VhZ2VNb2RlbHNbZG9jdW1lbnQudXJpXTtcblx0XHRcdGlmIChsYW5ndWFnZU1vZGVsSW5mbyAmJiBsYW5ndWFnZU1vZGVsSW5mby52ZXJzaW9uID09PSB2ZXJzaW9uICYmIGxhbmd1YWdlTW9kZWxJbmZvLmxhbmd1YWdlSWQgPT09IGxhbmd1YWdlSWQpIHtcblx0XHRcdFx0bGFuZ3VhZ2VNb2RlbEluZm8uY1RpbWUgPSBEYXRlLm5vdygpO1xuXHRcdFx0XHRyZXR1cm4gbGFuZ3VhZ2VNb2RlbEluZm8ubGFuZ3VhZ2VNb2RlbDtcblx0XHRcdH1cblx0XHRcdGNvbnN0IGxhbmd1YWdlTW9kZWwgPSBwYXJzZShkb2N1bWVudCk7XG5cdFx0XHRsYW5ndWFnZU1vZGVsc1tkb2N1bWVudC51cmldID0geyBsYW5ndWFnZU1vZGVsLCB2ZXJzaW9uLCBsYW5ndWFnZUlkLCBjVGltZTogRGF0ZS5ub3coKSB9O1xuXHRcdFx0aWYgKCFsYW5ndWFnZU1vZGVsSW5mbykge1xuXHRcdFx0XHRuTW9kZWxzKys7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChuTW9kZWxzID09PSBtYXhFbnRyaWVzKSB7XG5cdFx0XHRcdGxldCBvbGRlc3RUaW1lID0gTnVtYmVyLk1BWF9WQUxVRTtcblx0XHRcdFx0bGV0IG9sZGVzdFVyaSA9IG51bGw7XG5cdFx0XHRcdGZvciAoY29uc3QgdXJpIGluIGxhbmd1YWdlTW9kZWxzKSB7XG5cdFx0XHRcdFx0Y29uc3QgbGFuZ3VhZ2VNb2RlbEluZm8gPSBsYW5ndWFnZU1vZGVsc1t1cmldO1xuXHRcdFx0XHRcdGlmIChsYW5ndWFnZU1vZGVsSW5mby5jVGltZSA8IG9sZGVzdFRpbWUpIHtcblx0XHRcdFx0XHRcdG9sZGVzdFVyaSA9IHVyaTtcblx0XHRcdFx0XHRcdG9sZGVzdFRpbWUgPSBsYW5ndWFnZU1vZGVsSW5mby5jVGltZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKG9sZGVzdFVyaSkge1xuXHRcdFx0XHRcdGRlbGV0ZSBsYW5ndWFnZU1vZGVsc1tvbGRlc3RVcmldO1xuXHRcdFx0XHRcdG5Nb2RlbHMtLTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGxhbmd1YWdlTW9kZWw7XG5cblx0XHR9LFxuXHRcdG9uRG9jdW1lbnRSZW1vdmVkKGRvY3VtZW50OiBUZXh0RG9jdW1lbnQpIHtcblx0XHRcdGNvbnN0IHVyaSA9IGRvY3VtZW50LnVyaTtcblx0XHRcdGlmIChsYW5ndWFnZU1vZGVsc1t1cmldKSB7XG5cdFx0XHRcdGRlbGV0ZSBsYW5ndWFnZU1vZGVsc1t1cmldO1xuXHRcdFx0XHRuTW9kZWxzLS07XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRkaXNwb3NlKCkge1xuXHRcdFx0aWYgKHR5cGVvZiBjbGVhbnVwSW50ZXJ2YWwgIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRcdGNsZWFySW50ZXJ2YWwoY2xlYW51cEludGVydmFsKTtcblx0XHRcdFx0Y2xlYW51cEludGVydmFsID0gdW5kZWZpbmVkO1xuXHRcdFx0XHRsYW5ndWFnZU1vZGVscyA9IHt9O1xuXHRcdFx0XHRuTW9kZWxzID0gMDtcblx0XHRcdH1cblx0XHR9XG5cdH07XG59XG4iXX0=