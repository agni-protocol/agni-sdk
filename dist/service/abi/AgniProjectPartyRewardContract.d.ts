import type { ConnectInfo } from '../../ConnectInfo';
import { BaseAbi } from './BaseAbi';
export declare class AgniProjectPartyRewardContract extends BaseAbi {
    constructor(connectInfo: ConnectInfo, address: string);
    claim(): Promise<import("..").TransactionEvent>;
    setEpoch(epoch: number): Promise<import("..").TransactionEvent>;
    setReward(epoch: number, users: string[], amounts: string[]): Promise<import("..").TransactionEvent>;
}
