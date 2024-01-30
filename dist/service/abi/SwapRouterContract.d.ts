import type { ConnectInfo } from '../../ConnectInfo';
import { Percent, TradeType } from '../tool';
import type { SmartRouterTrade } from '../tool/v3route/types';
import type { TransactionEvent } from '../vo';
import { BaseAbi } from './BaseAbi';
export declare class SwapRouterContract extends BaseAbi {
    constructor(connectInfo: ConnectInfo);
    private encodeV2Swap;
    private encodeV3Swap;
    private encodeMixedRouteSwap;
    swap(trades: SmartRouterTrade<TradeType>[], slippageTolerance: Percent, recipientAddr: string, deadline: string | number, gasPriceGWei: string): Promise<TransactionEvent>;
}
