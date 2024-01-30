import type { ConnectInfo } from '../../ConnectInfo';
import type { TransactionEvent } from '../vo';
import { BaseAbi } from './BaseAbi';
export declare class StakingPoolContract extends BaseAbi {
    constructor(connectInfo: ConnectInfo);
    stakeNativeToken(tokenIdOrAmount: string): Promise<TransactionEvent>;
    unstake(stakeIds: string[]): Promise<TransactionEvent>;
}
