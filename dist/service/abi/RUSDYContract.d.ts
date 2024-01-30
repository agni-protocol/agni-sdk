import type { ConnectInfo } from '../../ConnectInfo';
import type { TransactionEvent } from '../vo';
import { BaseAbi } from './BaseAbi';
export declare class RUSDYContract extends BaseAbi {
    constructor(connectInfo: ConnectInfo);
    BPS_DENOMINATOR: number;
    wrap(amount: string): Promise<TransactionEvent>;
    unwrap(amount: string): Promise<TransactionEvent>;
    getRUSDYByShares(_USDYAmount: string): Promise<string>;
    getSharesByRUSDY(_rUSDYAmount: string): Promise<string>;
}
