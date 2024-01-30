import type { Token } from '../tool';
import type { LiquidityHistory, TickData, TickProcessed } from '../vo';
import { AddLiquidityV3Info, FeeAmount, LiquidityInfo, LiquidityListData } from '../vo';
import type { ConnectInfo } from '../../ConnectInfo';
import { Pool } from '../tool/sdk/v3';
import type { BaseApi } from './BaseApi';
export declare class PoolV3Api {
    baseApi: BaseApi;
    constructor();
    myLiquidityList(connectInfo: ConnectInfo): Promise<{
        hideClosePosition: LiquidityListData[];
        allPosition: LiquidityListData[];
    }>;
    private initLiquidityData;
    positionHistoryByTokenId(tokenId: string): Promise<LiquidityHistory[]>;
    myLiquidityByTokenId(connectInfo: ConnectInfo, tokenId: string): Promise<LiquidityInfo>;
    collectFeeData(tokenId: string, account: string): Promise<{
        amount0: string;
        amount1: string;
    }>;
    feeTierDistribution(token0: Token, token1: Token): Promise<Record<FeeAmount, number>>;
    allTickInfo(token0: Token, token1: Token, feeAmount: FeeAmount): Promise<{
        tickDatas: TickData[];
        ticksProcessed: TickProcessed[];
    }>;
    static computePoolAddress(tokenA: Token, tokenB: Token, fee: FeeAmount): string;
    getPool(datas: {
        token0: Token;
        token1: Token;
        feeAmount: FeeAmount;
    }[]): Promise<(Pool | undefined)[]>;
    private parsePrice;
    private outputTokenAmount;
    addLiquidity(token0: Token, token1: Token, account: string): Promise<AddLiquidityV3Info>;
}
