import { ICSSDataProvider } from 'vscode-css-languageservice';
import { RequestService } from './requests';
export declare function fetchDataProviders(dataPaths: string[], requestService: RequestService): Promise<ICSSDataProvider[]>;
