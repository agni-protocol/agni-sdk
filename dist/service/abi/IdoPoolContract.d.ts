import type { ConnectInfo } from '../../ConnectInfo';
import type { TransactionEvent } from '../vo';
import { BaseAbi } from './BaseAbi';
export declare class IdoPoolContract extends BaseAbi {
    constructor(connectInfo: ConnectInfo, address: string);
    enroll(): Promise<TransactionEvent>;
    presaleDeposit(buyQuota: string, buyInsurance: boolean): Promise<TransactionEvent>;
    publicSaleDeposit(buyInsurance: boolean, buyQuota: string, extraDeposit: string): Promise<TransactionEvent>;
    claim(): Promise<TransactionEvent>;
}
