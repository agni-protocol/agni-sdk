import type { Contract, TransactionReceipt } from 'ethers';
import type { ConnectInfo } from '../ConnectInfo';
import { BaseService } from './BaseService';
import { TransactionEvent } from './vo';
export declare class TransactionService extends BaseService {
    constructor(connectInfo: ConnectInfo);
    defaultErrorMsg: string;
    /**
     * 检查交易
     * @param txId
     */
    checkTransactionError(txId: string): Promise<TransactionReceipt>;
    /**
     * 发送交易
     * @param contract
     * @param method
     * @param args
     * @param config
     */
    sendContractTransaction(contract: Contract, method: string, args?: any[], config?: {
        gasPrice?: string;
        gasLimit?: number;
        fromAddress?: string;
        value?: number | string;
    }): Promise<TransactionEvent>;
    private sendRpcTransaction;
    private sendExtTransaction;
    convertErrorMsg(e: any): string;
    /**
     *
     * @param txId
     * @param message
     */
    transactionErrorHandler(txId: string, message?: string): Promise<{
        message: string;
        error: Error | undefined;
    }>;
    /**
     * 等待几个区块
     * @param web3
     * @param count
     */
    sleepBlock(count?: number): Promise<void>;
}
