import type { ConnectInfo } from '../../ConnectInfo';
import type { TransactionEvent } from '../vo';
import { BaseAbi } from './BaseAbi';
export declare class WETHContract extends BaseAbi {
    constructor(connectInfo: ConnectInfo);
    deposit(amount: string): Promise<TransactionEvent>;
    withdraw(amount: string): Promise<TransactionEvent>;
}
