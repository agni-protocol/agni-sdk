import type { Block } from '../../vo';
export interface SwapQueryV3PoolsResult {
    pools: {
        id: string;
        tick: number;
        sqrtPrice: string;
        feeTier: number;
        liquidity: string;
        feeProtocol: string;
        totalValueLockedUSD: string;
    }[];
}
export declare const SwapQueryV3Pools: string;
export declare function GetDerivedPricesGQL(tokenAddress: string, blocks: Block[]): string;
export interface GetDerivedPricesGQLResult {
    [key: string]: {
        derivedUSD: string;
    };
}
