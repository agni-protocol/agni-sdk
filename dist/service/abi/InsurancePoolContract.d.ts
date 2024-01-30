import type { ConnectInfo } from '../../ConnectInfo';
import type { TransactionEvent } from '../vo';
import { BaseAbi } from './BaseAbi';
export declare class InsurancePoolContract extends BaseAbi {
    constructor(connectInfo: ConnectInfo);
    claimLoss(insuranceId: string): Promise<TransactionEvent>;
}
