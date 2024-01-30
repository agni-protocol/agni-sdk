import { IDOPoolDetail, IdoPoolInfos, LaunchpadStakeDetail } from '../vo';
import type { BaseApi } from './BaseApi';
export declare class LaunchpadApi {
    baseApi: BaseApi;
    private getUserStakeInfoByGql;
    staking(account?: string): Promise<LaunchpadStakeDetail>;
    private getTokenPriceHistory;
    private fetchPools;
    getTokenPrice(address: string): Promise<string>;
    getAllTimeHighPrice(address: string): Promise<string>;
    getPools(): Promise<IdoPoolInfos>;
    private getUserDepositedLogsByPool;
    private getPoolInfoByGql;
    poolDetail(pool: string, account?: string): Promise<IDOPoolDetail>;
}
