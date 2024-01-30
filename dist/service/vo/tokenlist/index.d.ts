import type { SerializedToken, Token } from '../../tool';
import AgniTokenListSchema from './AgniTokenListSchema.json';
export { AgniTokenListSchema, };
export declare class StorageTokenListInfo {
    url: string;
    enable: boolean;
}
export declare class TokenManagerAddInfo {
    active: boolean;
    token: Token;
    import: () => void;
}
export declare class TokenManagerInfo {
    token: Token;
    remove: () => void;
}
export declare class TokenSelectInfo {
    token: Token;
    balance: string;
}
export declare class TokenPrice {
    token: Token;
    priceUSD: string;
    priceMNT: string;
    constructor(token: Token, priceUSD: string, priceMNT: string);
}
export declare class TokenListInfo {
    storageTokenListInfo: StorageTokenListInfo;
    tokenList: TokenList;
    showRemove: boolean;
    remove: () => void;
    updateEnable: (bool: boolean) => void;
    tokenListUrl: () => string;
    version: () => string;
}
export interface Version {
    readonly major: number;
    readonly minor: number;
    readonly patch: number;
}
export interface Tags {
    readonly [tagId: string]: {
        readonly name: string;
        readonly description: string;
    };
}
export interface TokenList {
    readonly name: string;
    readonly timestamp: string;
    readonly version: Version;
    readonly tokens: SerializedToken[];
    readonly keywords?: string[];
    readonly tags?: Tags;
    readonly logoURI?: string;
}
