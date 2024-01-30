export declare function QueryBlockTimeGQL(timestamps: number[]): string;
export declare function QueryBlockMeta(): string;
export interface QueryBlockMetaVo {
    _meta: {
        block: {
            number: number;
            hash: string;
            timestamp: number;
        };
    };
}
export declare function poolsBulkGQL(block: number | undefined, pools: string[]): string;
export declare function tokensBulkGQL(block: number | undefined, tokens: string[]): string;
export declare function ethPricesGQL(block24?: number, block48?: number, blockWeek?: number): string;
export declare const topPoolsGQL: string;
export declare const topTokensGQL: string;
export interface TopTokensGQLVo {
    tokens: {
        id: string;
        totalValueLockedUSD: string;
    }[];
}
export declare function globalDataGQL(block?: string | number): string;
export declare const globalChartGQL: string;
export declare const globalTransactionsGQL: string;
export declare function GetTokenPriceDataGQL(hour: boolean, token: string): string;
export interface GetTokenPriceDataType {
    datas: {
        time: number;
        priceUSD: string;
    }[];
}
