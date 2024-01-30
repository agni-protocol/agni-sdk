export declare const STORAGE_KEY_TOKEN_LIST = "STORAGE_KEY_TOKEN_LIST";
export declare const STORAGE_KEY_TOKENS = "STORAGE_KEY_TOKENS";
export declare class StorageProvider {
    type: 'web' | 'node';
    constructor(type: 'web' | 'node');
    get(key: string): string;
    getArray(key: string): any[];
    getObj(key: string): any;
    set(key: string, value: string): void;
    setJson(key: string, value: any): void;
    clearKey(key: string): void;
    clear(): void;
}
