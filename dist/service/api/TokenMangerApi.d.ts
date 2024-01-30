import { Token } from '../tool';
import { TokenListInfo, TokenManagerAddInfo, TokenManagerInfo, TokenPrice, TokenSelectInfo } from '../vo';
import type { BaseApi } from './BaseApi';
export declare class TokenMangerApi {
    baseApi: BaseApi;
    defaultTokenListUrl: string;
    constructor();
    batchGetTokens(addresses: string[]): Promise<Record<string, Token>>;
    tokenPrice(...tokens: Token[]): Promise<TokenPrice[]>;
    tokenList(url?: string): Promise<TokenListInfo[]>;
    tokenSelectList(account: string, searchStr?: string): Promise<{
        searchTokens: TokenManagerAddInfo[];
        customTokens: TokenSelectInfo[];
    }>;
    getTokenByTokenList(): Promise<Token[]>;
    getTokenByContract(addresses: string[]): Promise<Token[]>;
    tokenManager(searchStr?: string): Promise<{
        searchTokens: TokenManagerAddInfo[];
        customTokens: TokenManagerInfo[];
    }>;
    systemTokens(): Token[];
    tradeTokens(): Token[];
    WNATIVE(): Token;
    USDT(): Token;
    NATIVE(): Token;
    private searchTokenList;
    private mapToTokenAdd;
    private mapToTokenList;
    private storageToken;
    private storageTokenAdd;
    private storageTokenRemove;
    private storageTokenListUrls;
    private storageTokenListUrlsAdd;
    private storageTokenListUrlsUpdate;
    private storageTokenListUrlsRemove;
    private uriToHttp;
}
