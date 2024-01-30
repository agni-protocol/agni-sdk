import { SwapInfo } from '../vo';
import { Token } from '../tool';
import type { BaseApi } from './BaseApi';
export declare class SwapApi {
    baseApi: BaseApi;
    constructor();
    swapInfo(token0: Token, token1: Token, account: string): Promise<SwapInfo>;
    private getTokenPrice;
    private getBestTrade;
}
